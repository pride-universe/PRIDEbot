const { Plugin } = require('discord.js-plugins');
const { MessageEmbed } = require('discord.js');
const { housing } = require('../../../config');
const fetchHouses = require('../../modules/telgebostadCrawler');
const moment = require('moment-timezone');
const { getConvertedValue } = require('../../commands/util/currency');

const FETCH_INTERVAL = 3 * 60 * 60 * 1000;
const BASE_FAIL_TIME = 5000;
/**
 * @typedef {{
  _COMPLETE_: boolean,
  rent: string,
  area: string,
  rooms: string,
  region: string,
  address: string,
  objectId: string,
  url: string,
  moveIn: string,
  lastApplicationDate: string,
  applicants: string,
  maxQueueStart: string,
  floor: string,
  built: string,
  renovated: string,
  img: string | void,
  floorPlan: string | void,
  seen: number
}} NormalListing
*/


class HousingLister extends Plugin {
  constructor(client) {
    const info = {
      name: 'housingLister',
      group: 'util',
      description: 'Keeps a registry of channels and channel topics',
      guarded: false,
      autostart: true,
      startOn: ['ready', 'providerReady']
    };
    super(client, info);
    this.timeout = null;
    this.failTime = BASE_FAIL_TIME;
  }

  async start() {
    /**
     * @type {NormalListing[]}
     */
    this.listings = this.client.settings.get('housingListings', []);
    const lastFetched = this.client.settings.get('housingListingsFetched', 0);
    const delay = Math.max(FETCH_INTERVAL - Date.now() + lastFetched, 0);
    const guild = this.client.guilds.resolve(housing[0]);
    /**
     * @type {import("discord.js").TextChannel}
     */
    this.activeChannel = guild && guild.channels.resolve(housing[1].active);
    if (this.activeChannel) this.timeout = this.client.setTimeout(() => this.updateHousings(), delay);
    else {
      console.log('Cannot find housing channel. Disabling module');
      this.stop();
    }
    /**
     * @type {import("discord.js").TextChannel | null}
     */
    this.removedChannel = guild && guild.channels.resolve(housing[1].deleted);
  }

  async stop() {
    this.client.clearTimeout(this.timeout);
  }

  makeEmbed(listing) {
    const oldListing = this.listings.find(l=>l.objectId === listing.objectId);
    if(!listing._COMPLETE_ && oldListing) {
      listing = {
        ...oldListing,
        _COMPLETE_: false,
      };
    }
    const embed = new MessageEmbed();
    embed.setColor(listing._COMPLETE_ ? 8900331 : 16711680);
    embed.setFooter(listing._COMPLETE_ ? 'Last Updated' : 'Failed to update details');
    embed.setTimestamp(listing._COMPLETE_ ? listing.seen : Date.now());
    embed.setAuthor(`${listing.address} (${listing.region})`, null, listing.url);
    if(listing.img) embed.setThumbnail(listing.img);
    if(listing.floorPlan) embed.setImage(listing.floorPlan);
    embed.addField('Rooms', listing.rooms, true);
    embed.addField('Area', listing.area, true);
    embed.addField('Rent', listing.rent, true);
    embed.addField('Floor', listing.floor, true);
    embed.addField('Applicants', listing.applicants, true);
    embed.addField('Earliest Queuer', `${listing.maxQueueStart} (${listing.maxScore}p)`, true);
    embed.addField('Built', listing.built, true);
    embed.addField('Renovated', listing.renovated, true);
    embed.addField('Last application date', listing.lastApplicationDate, true);
    embed.addField('Move in date', listing.moveIn, true);
    return embed;
  }

  async getCost(sek) {
    try {
      const { value } = await getConvertedValue(sek, 'SEK', 'USD');
      return `${sek}kr ($${Math.round(value)})`;
    } catch (err) {
      return `${sek}kr ($?)`;
    }
  }

  /**
   * 
   * @param {import("../../modules/telgebostadCrawler").HousingListing[]} housings 
   */
  normalize(housings) {
    return Promise.all(housings.map(async h => ({
      _COMPLETE_: h._COMPLETE_,
      rent: h.rent ? await this.getCost(h.rent) : 'n/a',
      area: h.area ? `${h.area}m² (${Math.round(h.area * 10.7639)}ft²)` : 'n/a',
      rooms: `${h.rooms} (incl livingroom)`,
      region: h.region || 'n/a',
      address: h.address || 'n/a',
      objectId: h.objectId,
      url: h.url,
      moveIn: typeof h.moveIn === 'object' ? moment(h.moveIn).format('Y-MM-DD') : h.moveIn || 'n/a',
      lastApplicationDate: typeof h.lastApplicationDate === 'object' ? moment(h.lastApplicationDate).format('Y-MM-DD') : h.lastApplicationDate || 'n/a',
      applicants: h.applicants != null ? String(h.applicants) : 'n/a',
      maxScore: h.maxScore != null ? String(h.maxScore) : 'n/a',
      maxQueueStart: h.maxQueueStart || 'n/a',
      floor: h.floor || 'n/a',
      built: h.built != null ? String(h.built) : 'n/a',
      renovated: h.renovated != null ? String(h.renovated) : 'n/a',
      img: h.img && `https://images.weserv.nl/?url=${encodeURIComponent(h.img)}`,
      floorPlan: h.floorPlan,
      seen: Date.now(),
    })));
  }

  async updateHousings() {
    this.timeout = null;
    try {
    const fetched = await this.normalize(await fetchHouses());
    const added = fetched.filter(new_ => !this.listings.some(old => old.objectId === new_.objectId));
    const removed = this.listings.filter(old => !fetched.some(new_ => old.objectId === new_.objectId));
    const updated = this.listings.filter(old => fetched.some(new_ => old.objectId === new_.objectId)).map(l => ({...fetched.find(f=>f.objectId === l.objectId), _MSG_ID_: l._MSG_ID_}));
    for(const listing of added) {
      const msg = await this.activeChannel.send(this.makeEmbed(listing));
      this.listings.push({ ...listing, _MSG_ID_: msg.id});
    }
    for(const listing of updated) {
      const oldIndex = this.listings.findIndex(l=>l.objectId === listing.objectId);
      if (listing._COMPLETE_) {
        this.listings[oldIndex] = listing;
      }
      const msg = await this.activeChannel.messages.fetch(listing._MSG_ID_).catch(console.error);
      if (msg.edit(this.makeEmbed(listing)));
      else {
        const msg = await this.activeChannel.send(this.makeEmbed(listing));
        this.listings[oldIndex]._MSG_ID_ = msg.id; 
      }
    }
    for(const toRemove of removed) {
      await this.activeChannel.messages.remove(toRemove._MSG_ID_).catch(console.error);
      const index = this.listings.findIndex(l => l._MSG_ID_ === toRemove._MSG_ID_);
      if (index < 0) continue;
      this.listings.splice(index, 1);
      if(this.removedChannel && toRemove._COMPLETE_) {
        await this.removedChannel.send(this.makeEmbed(toRemove))
      }
    }
    this.client.settings.set('housingListingsFetched', Date.now());
    this.timeout = this.client.setTimeout(() => this.updateHousings(), FETCH_INTERVAL);
    this.failTime = BASE_FAIL_TIME;
    } catch (err) {
      this.client.emit('error', err);
      if (!this.timeout) {
        this.timeout = this.client.setTimeout(() => this.updateHousings(), Math.min(this.failTime, FETCH_INTERVAL));
        this.failTime *= 2;
      }
    } finally {
      this.client.settings.set('housingListings', this.listings);
    }
  }
}

module.exports = HousingLister;
