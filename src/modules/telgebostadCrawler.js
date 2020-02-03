const listUrl = 'https://hyresborsen.telge.se/res/themes/telgebostader/pages/public/objectlistpublicb.aspx?objectgroup=1';
const objUrl = 'https://hyresborsen.telge.se/HSS/Object/ObjectDetailsTemplateB.aspx?objectguid=';
const publicUrl = 'https://hyresborsen.telge.se/res/themes/telgebostader/pages/public/ObjectDetailsPublicTemplateB.aspx?objectguid=';
const floorplanUrl = 'https://telge.bim.cloud/HopaGetView4Object?CN=lgh&FN=fi2bus_name&FV=';
const imgUrl = 'https://hyresborsen.telge.se/Global/DisplayMultimedia.ashx?guid=';
const cheerio = require('cheerio');
const axios = require('axios');
const qs = require('querystring');
const moment = require('moment-timezone');

/**
 * @typedef {{
  _COMPLETE_: boolean,
  rent: number | void,
  area: number | void,
  rooms: number | void,
  region: string | void,
  address: string | void,
  objectId: string,
  url: string,
  moveIn: Date | string | void,
  lastApplicationDate: Date | string | void,
  applicants: number | void,
  maxScore: number | void,
  maxQueueStart: string | void,
  floor: string | void,
  built: number | void,
  renovated: number | void,
  shortId: string | void,
  img: string,
  floorPlan: string | void
}} HousingListing
*/

const fetchData = async (url, body) => {
  let result;
  if(!body) result = await axios.get(url);
  else result = await axios.post(url, qs.stringify(body), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
  return { $: cheerio.load(result.data, { xmlMode: true }), res: result };
};

/**
 * 
 * @param {CheerioStatic} $ 
 */
function getPageStatus($) {
  const cur = Number.parseInt($('#ctl00_ctl01_DefaultSiteContentPlaceHolder1_Col1_ctl00_lblCurrPage').text());
  const last = Number.parseInt($('#ctl00_ctl01_DefaultSiteContentPlaceHolder1_Col1_ctl00_lblNoOfPages').text());
  return [cur, last];
}

/**
 * 
 * @param {CheerioStatic} $ 
 */
function getNextBody($) {  
  const form = $('form#aspnetForm')[0];
  /**
   * 
   * @param {string} sel 
   */
  function getNameAndVal(sel) {
    const val = $(sel, form);
    return [val.attr('name'), val.attr('value')];
  }
  const selectors = [
    'input#__VIEWSTATE',
    'input#__VIEWSTATEGENERATOR',
    'input#__EVENTVALIDATION',
    'input[type=submit].btn.next',
  ];
  const ret = {};
  selectors.forEach(s=> {
    const [key, val] = getNameAndVal(s);
    ret[key] = val;
  });
  return ret;
}

/**
 * 
 * @param {CheerioStatic} $ 
 */
function parsePage({ $ }, page)  {
  const [curPage, lastPage] = getPageStatus($);
  const hasNextPage = curPage !== lastPage && !Number.isNaN(curPage) && !Number.isNaN(lastPage);
  
  // No listings
  if (Number.isNaN(curPage) && !hasNextPage && page === 1) return { entries: [], nextBody: null};

  if (curPage !== page) throw new Error('Wrong page loaded');
  /**
  * 
  * @param {CheerioElement} row 
  */
  const parseRow = (row) => {
    while(row.children[row.children.length-1].type !== 'tag' || row.children[row.children.length-1].name !== 'td') {
      row.children.pop();
    }
    row.children.pop();
    const ret = {};
    ret.rent = Number.parseInt($('span', row.children.pop()).text());
    ret.area = Number.parseInt($('span', row.children.pop()).text());
    ret.rooms = Number.parseInt($('span', row.children.pop()).text());
    ret.region = $('span', row.children.pop()).text();
    const aTag = $('a', row.children.pop());
    ret.address = aTag.text();
    const href = aTag.attr('href');
    const querystring = href.split('?')[1];
    ret.objectId = qs.parse(querystring).objectguid;
    ret.url = `${publicUrl}${ret.objectId}`;
    ret._COMPLETE_ = false;
    return ret;
  };
  const el = $('.siteMain table tbody')[0];
  let row = $('tr.listitem-even, tr.listitem-odd', el)[0];
  const rows = [];
  while (row) {
    if (row.type === 'tag' && row.name === 'tr') rows.push(row);
    row = row.next;
  }
  return {
    entries: rows.map(parseRow),
    nextBody: hasNextPage ? getNextBody($) : null,
  };

}

async function moreData(obj) {
  const { $, res } = await fetchData(`${objUrl}${obj.objectId}`);
  const fetchedDate = !Number.isNaN(Date.parse(res.headers.date)) ? res.headers.date : new Date().toGMTString();
  obj.moveIn = $('#ctl00_ctl01_DefaultSiteContentPlaceHolder1_Col1_lblMoveIn').text();
  obj.lastApplicationDate = $('#ctl00_ctl01_DefaultSiteContentPlaceHolder1_Col1_lblLastRegDate').text();
  obj.applicants = $('#ctl00_ctl01_DefaultSiteContentPlaceHolder1_Col1_lblRegUserCount').text();
  obj.maxScore = $('#ctl00_ctl01_DefaultSiteContentPlaceHolder1_Col1_lblMaxScore').text();
  obj.floor = $('ul#ctl00_ctl01_DefaultSiteContentPlaceHolder1_Col1_ulFloor > li.right').text();
  obj.built = $('ul#ctl00_ctl01_DefaultSiteContentPlaceHolder1_Col1_ulBuiltYear > li.right').text();
  obj.renovated = $('ul#ctl00_ctl01_DefaultSiteContentPlaceHolder1_Col1_trRebuiltYear > li.right').text();
  obj.shortId = $('ul#ctl00_ctl01_DefaultSiteContentPlaceHolder1_Col1_ulObjectID > li.right').text();
  obj.img = $('#ctl00_ctl01_DefaultSiteContentPlaceHolder1_Col1_divImageBig > img').attr('src');
  obj.img = obj.img ? qs.parse(obj.img.split('?').pop()).guid : undefined;
  obj.img = obj.img ? `${imgUrl}${obj.img}` : undefined;
  obj.floorPlan = obj.shortId ? `${floorplanUrl}${obj.shortId}` : undefined;

  if(Date.parse(obj.moveIn)) obj.moveIn = new Date(Date.parse(obj.moveIn));
  if(Date.parse(obj.lastApplicationDate)) obj.lastApplicationDate = new Date(Date.parse(obj.lastApplicationDate));

  if(typeof obj.moveIn === 'string' && obj.moveIn.toLowerCase() === 'nu') obj.moveIn = 'NOW';
  if(typeof obj.lastApplicationDate === 'string' && obj.lastApplicationDate.toLowerCase() === 'nu') obj.lastApplicationDate = 'NOW';

  obj.applicants = obj.applicants ? Number.parseInt(obj.applicants) : undefined;
  obj.maxScore = obj.maxScore ? Number.parseInt(obj.maxScore) : undefined;
  obj.floor = obj.floor != null ? obj.floor : undefined;
  obj.built = obj.built ? Number.parseInt(obj.built) : undefined;
  obj.renovated = obj.renovated ? Number.parseInt(obj.renovated) : undefined;
  obj.maxQueueStart = !Number.isNaN(obj.maxScore) ? moment(fetchedDate).tz('Europe/Stockholm').subtract(Math.round(obj.maxScore / 10), 'days').format('Y-MM-DD') : undefined;
  obj._COMPLETE_ = true;
}

/**
 * @returns {Promise<HousingListing[]>}
 */
const fetchListings = async () => {
  let places = [];
  {
    let page = 1;
    let entries, nextBody;
    do {
      ({ entries, nextBody } = parsePage(await fetchData(listUrl, nextBody), page++));
      places.push(...entries);
    } while (nextBody);
  }
  places = places.reduce((a,c) => {
    if(c.objectId && !a.some((e)=>e.objectId === c.objectId)) a.push(c);
    return a;
  }, []);
  await Promise.all(places.map(place => moreData(place).catch(console.error)));
  return places;
};

module.exports = fetchListings;