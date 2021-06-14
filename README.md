![PRIDEbot](https://raw.githubusercontent.com//pride-universe/PRIDEbot/master/PRIDEbot.jpg)

# PRIDEbot
A discord bot for managing the a couple of discord servers.

## Development
Setting up for development is pretty straightforward. The important things are having the right node/npm versions and having the required secret keys which allow you to connect to the PRIDEbot dev discord server.

#### Build Prerequisites
* **Node LTS/Carbon (10.15.3)**
> Version 10.15.3 has been shown to work on Mac, Windows, and the build box (a debian based VPS)

#### Access Keys
Create a file in the root of the project called `.env` and copy in:
```
NODE_ENV="development"
DISCORD_TOKEN="[token]"
WA_SECRET="[secret]"
WEBHOOK_ID="[webhook id]"
WEBHOOK_TOKEN="[webhook token]"
CLIENT_SECRET="[oauth2 client secret]"
#This will be injected by the vue app
CLIENT_ID="$VUE_APP_CLIENT_ID"
JWT_SECRET="[random string]"
JWT_ALG="HS256"
```
You will need to create a discord bot of your own so that there isn't conflicts with multiple collaborators trying to start/use the same bot. You can follow [this quick guide](https://thomlom.dev/create-a-discord-bot-under-15-minutes/) to get a bot created and a token generated. Use this for your **discordToken** above At the prompt to join your bot to a discord server - ensure that you have been given access already to the [Bots R Us discord server](https://discord.gg/NwkmMPd) for your testing.
> You will need to give your Bot permissions in the Bots R Us server so that it can post/be visible in the members list

The logging module **id** and **token** can be provided directly from Linn (project maintainer)
