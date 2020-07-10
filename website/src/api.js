import axios from 'axios';

export const DISCORD_API = 'https://discord.com/api';

const instance = axios.create({
  baseURL: process.env.VUE_APP_API_URL,
});

export default instance;
