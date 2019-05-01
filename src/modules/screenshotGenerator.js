const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const BROWSER_KEEP_ALIVE = 10000;

class ScreenshotGenerator {
  constructor() {
    this._browser = null;
    this._pagePromise = null;
    this._queue = [];
    this._timeout = null;
    this._working = false;
  }

  getPage () {
    if(this._pagePromise) {
      return this._pagePromise;
    }
    return this._pagePromise = this.startBrowser().then(({browser, page})=>(this._browser=browser,this._page=page,page));
  }

  async startBrowser() {
    console.log('starting browser')
    const browser = this._browser = await puppeteer.launch({executablePath: '/usr/bin/chromium-browser', args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const page = await browser.newPage();
    // This does not have to be a page on the web, it can be a localhost page, or file://
    await page.goto(`file:${path.join(__dirname, '../template.html')}`, {
      waitUntil: 'domcontentloaded' // ensures DOM is loaded
    });
    return {browser, page};
  }

  async _doScreenshot(messages) {
    const messageHTML = (function(module) {
      const modKey = require.resolve(module);
      delete require.cache[modKey];
      return require(module);
    })('./messageHTML');
    await this.fetchExtras(messages);
    const page = await this.getPage();
    await page.evaluate((html)=>document.getElementById('message-mountpoint').innerHTML=html, messageHTML(messages));
    await this.waitForNetworkIdle(500);

    const {width, height} = page.viewport();
    const bodyHeight = await page.evaluate(() => document.body.offsetHeight);

    fs.writeFileSync('src/rendered.html', '<!DOCTYPE html>\n' + await page.evaluate(() => document.documentElement.outerHTML));
    // Output a page screenshot
    if(bodyHeight < height) {
      return page.screenshot({ clip: {x: 0, y: 0, width, height: bodyHeight}});
    } else {
      return page.screenshot({ fullPage: true});
    }
  }

  _popQueue() {
    const {messages, resolve, reject} = this._queue.pop() || {message: null, resolve: null, reject: null};
    if(!messages) {
      this._working = false;
      setTimeout(()=>this.stopBrowser(), BROWSER_KEEP_ALIVE);
      return;
    }
    this._doScreenshot(messages).then(resolve, reject).finally(()=>this._popQueue());
  }

  _startQueue() {
    if(this._working) return;
    if(this._timeout) clearTimeout(this._timeout);
    this._timeout = null;
    this._working = true;
    this._popQueue();
  }

  getScreenshot(messages) {
    const promise = new Promise((resolve, reject) => {
      this._queue.unshift({messages, resolve, reject});
    });
    this._startQueue();
    return promise;
  }

  async stopBrowser() {
    if(!!this._browser) console.error('Tried to stop already stopped browser?');
    if(this._working) return;
    console.log('stopping browser');
    this._pagePromise = null;
    const browser = this._browser;
    this._browser = null;
    this._page = null;
    await browser.close();
  }

  async waitForNetworkIdle (timeout, maxInflightRequests = 0) {
    const page = await this.getPage();
    page.on('request', onRequestStarted);
    page.on('requestfinished', onRequestFinished);
    page.on('requestfailed', onRequestFinished);
  
    let inflight = 0;
    let fulfill;
    let promise = new Promise(x => fulfill = x);
    let timeoutId = setTimeout(onTimeoutDone, timeout);
    return promise;
  
    function onTimeoutDone() {
      page.removeListener('request', onRequestStarted);
      page.removeListener('requestfinished', onRequestFinished);
      page.removeListener('requestfailed', onRequestFinished);
      fulfill();
    }
  
    function onRequestStarted() {
      ++inflight;
      if (inflight > maxInflightRequests)
        clearTimeout(timeoutId);
    }
    
    function onRequestFinished() {
      if (inflight === 0)
        return;
      --inflight;
      if (inflight === maxInflightRequests)
        timeoutId = setTimeout(onTimeoutDone, timeout);
    }
  }

  async fetchExtras (messages) {
    const _messages = Array.isArray(messages) ? messages : [messages];
    await Promise.all(_messages.map(m=>Promise.all([
      Promise.all(m.mentions.channels.array().map(c=>c.fetch())),
      Promise.all(m.mentions.members.array().map(c=>c.fetch())),
      Promise.all(m.mentions.users.array().map(c=>c.fetch()))
    ])));
  return messages;
  }
}

const instance = new ScreenshotGenerator();

module.exports = (messages)=>instance.getScreenshot(messages);
