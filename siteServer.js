/**
 * @typedef {import('express').Request<import('express-serve-static-core').ParamsDictionary, any, any, qs.ParsedQs>} Request
 */
/**
 * @typedef {import('discord.js').GuildMember GuildMember
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
/**
 * @type {import('axios').default}
 */
const axios = require('axios');
const qs = require('querystring');
const { getPermGroups, getSelfRoleGroups } = require('./src/modules/roles');

const app = express();
app.set('etag', false);
const port = process.env.PORT || 3000;

const { CLIENT_ID, CLIENT_SECRET, JWT_SECRET, JWT_ALG } = process.env;
const jwtMiddleware = require('express-jwt')({ secret: JWT_SECRET, algorithms: [JWT_ALG] });
const jsonMiddleware = express.json();
const discordApi = axios.create({
  baseURL: 'https://discord.com/api/v6',
});


let bot = require('./src/index');

function apiResponse(payload) {
  if (payload instanceof Error) {
    if (this.statusCode < 300) {
      this.status(500);
    }
    this.end(JSON.stringify({ status: this.statusCode, error: payload.message }));
  }
  this.end(JSON.stringify({ status: this.statusCode, payload }));
}

app.use('/', express.static(path.join(__dirname, 'website/dist')));

app.use('/api/*', cors());

app.use('/api/*', async (req, res, next) => {
  res.apiResponse = apiResponse;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', 0);
  res.setHeader('Surrogate-Control', 'no-store');
  if (bot == null || bot.readyAt == null) {
    // res.status(503).apiResponse(new Error('bot is not ready'));
    // return;
  }
  next();
});

app.get('/api/helloworld', (req, res) => {
  res.apiResponse('hello world');
});

app.post('/api/token', jsonMiddleware, async (req, res) => {
  const { code } = req.body;
  if (typeof code !== 'string') res.status(400).apiResponse(new Error('Invalid body'));
  const body = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${process.env.VUE_APP_BASE_URL}/oauth2`,
    scope: 'identify',
  };
  try {
    const { data: { expires_in, ...data } } = await discordApi.post('/oauth2/token', qs.stringify(body), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    const { data: { id } } = await discordApi.get('/users/@me', {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });
    const token = jwt.sign(JSON.stringify({ ...data, expires: Math.floor(Date.now() / 1000) + expires_in, id }), JWT_SECRET, {
      algorithm: JWT_ALG,
    });
    res.apiResponse({ token });
  } catch (err) {
    console.log(err);
    res.status(401).apiResponse('Unauhorized');
  }
});

app.get('/api/refresh', jwtMiddleware, async (req, res) => {
  const { refresh_token, scope, id } = req.user;
  const body = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refresh_token,
    redirect_uri: 'http://localhost:8081/oauth2',
    scope,
  };
  try {
    const { data: { expires_in, ...data } } = await discordApi.post('/oauth2/token', qs.stringify(body), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).catch((err) => { throw new Error(err.response ? err.response.data || err.message : err.message); });
    const token = jwt.sign(JSON.stringify({ ...data, expires: Math.floor(Date.now() / 1000) + expires_in, id }), JWT_SECRET, {
      algorithm: JWT_ALG,
    });
    res.apiResponse({ token });
  } catch (err) {
    res.apiResponse(err);
  }
});

app.post('/api/logout', jwtMiddleware, async (req, res) => {
  const { refresh_token } = req.user;
  const body = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    token_type: 'refresh_token',
    token: refresh_token,
  };
  try {
    res.apiResponse((await discordApi.post('/oauth2/token/revoke',
      qs.stringify(body),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })).data);
  } catch (err) {
    console.error(err);
    res.apiResponse(err);
  }
});

app.get('/api/servers', jwtMiddleware, async (req, res) => {
  const { user } = req;
  if (user.expires * 1000 < Date.now()) {
    res.status(401).apiResponse(new Error('Token expired'));
    return;
  }
  try {
    const guildEntries = (await Promise.all(
      bot.guilds.cache.map(g=>Promise.all([getSelfRoleGroups(g).then(res => res.length > 0 ? g : null, (err) => {console.error(err); return null;}),g.members.fetch(user.id).catch(()=>null)])),
    ))
      .filter(([g,m])=>m && g)
      .map(([g,m])=>({
        guild: {
          id: g.id,
          name: g.name,
          nameAcronym: g.nameAcronym,
          iconURL: g.iconURL({ size: 512 })
        },
        displayName: m.displayName
      }));
    res.apiResponse(guildEntries);
  } catch (err) {
    console.error(err);
    res.apiResponse(err);
  }
});

app.get('/api/servers/:id', jwtMiddleware, async (req, res) => {
  const { user } = req;
  if (user.expires * 1000 < Date.now()) {
    res.status(401).apiResponse(new Error('Token expired'));
    return;
  }
  const { id } = req.params;
  const guild = bot.guilds.resolve(id);
  if (guild == null) {
    res.status(404).apiResponse(new Error('Guild not found'));
    return;
  }
  try {
    const permGroups = await getPermGroups(id, user.id);
    let groups = (await getSelfRoleGroups(id)).filter(group => {
      return !group.permGroup || permGroups.has(group.permGroup);
    });
    groups = groups.map(({name, roleEntries})=>({
      name,
      roleEntries: roleEntries.filter(re => !re.role.deleted).map(re => ({
        id: re.role.id,
        color: re.role.color ? `#${re.role.color.toString(16).padStart('6', '0')}` : 'var(--header-primary)',
        name: re.role.name,
        acquired: guild.members.resolve(user.id).roles.cache.has(re.role.id),
      })),
    }));
    res.apiResponse({id: guild.id, name: guild.name, nameAcronym: guild.nameAcronym, iconURL: guild.iconURL({ size: 512 }), groups});
  } catch (err) {
    console.error(err);
    res.status(400).apiResponse(err);
  }
});

app.post('/api/servers/:id/roles', jwtMiddleware, jsonMiddleware, async (req, res) => {
  const { user } = req;
  if (user.expires * 1000 < Date.now()) {
    res.status(401).apiResponse(new Error('Token expired'));
    return;
  }
  const { id } = req.params;
  const guild = bot.guilds.resolve(id);
  if (guild == null) {
    res.status(404).apiResponse(new Error('Guild not found'));
    return;
  }
  /**
   * @type {GuildMember}
   */
  let member = guild.members.resolve(user.id) || await guild.members.fetch(user.id).catch(() => null);
  if (!member) {
    res.status(400).apiResponse(new Error('User not part of guild'));
  }
  const { role: roleId, value } = req.body;
  const permGroups = await getPermGroups(id, member);
  let roleEntry = null;
  try {
    for(const group of await getSelfRoleGroups(guild)) {
      for(const re of group.roleEntries) {
        if(re.role.id === roleId) {
          if (!re.permGroup || permGroups.has(re.permGroup)) {
            roleEntry = re;
          }
          break;
        }
      }
    }
    if (!roleEntry) {
      res.status(400).apiResponse(new Error('Either role doesn\'t exist or you don\'t have permission to assign'));
      return;
    }
    member = await member.roles[value ? 'add' : 'remove'](roleEntry.role);
    res.apiResponse({
      role: roleEntry.role.id,
      acquired: member.roles.cache.has(roleEntry.role.id)
    });
  } catch (err) {
    console.error(err);
    res.apiResponse(err);
  }
});
app.use('/api/*', (req, res) => {
  res.status(404).apiResponse(new Error('Api endpoint not found'));
});

app.use('/', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'website/dist', 'index.html'));
});

app.listen(port, () => console.log(`Pridebot webserver listening on http://localhost:${port}`));
