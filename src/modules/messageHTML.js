const moment = require('moment');
const twemoji = require('twemoji');
const mime = require('mime');
const { JSDOM } = require('jsdom');
const jsdom = new JSDOM();
const Discord = require('discord.js');

const {window: {document}} = jsdom;

function requireNoCache (id) {
  const modKey = require.resolve(id);
  let oldCache;
  if(Object.prototype.hasOwnProperty.call(require.cache, modKey)) {
    oldCache = require.cache[modKey];
    delete require.cache[modKey];
  }
  const module = require(id);
  if(oldCache) {
    require.cache[modKey] = oldCache;
  } else {
    delete require.cache[modKey];
  }
  return module;
}

/**
 * @type {import("./discord-markdown")}
 */
const DiscordMarkdown = requireNoCache('./discord-markdown');


const cssModuleNames = requireNoCache('../classMappings');

const GROUPING_THRESHOLD = 420000;

function c(klass) {
  return cssModuleNames[klass] || klass;
}

function colorToRgba(col, a) {
  const ret = [
    col>>16,
    col>>8&0xFF,
    col&0xFF
  ];
  if(a !== undefined) ret.push(a);
  return ret;
}

function formatFileSize(size) {
  if (size <= 0) return '0 bytes';
  const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const unit = Math.min(Math.floor(Math.log2(Math.max(size,1))/10), units.length - 1);
  const precision = unit ? 2 : 0;
  size = size / Math.pow(1024, unit);
  const fixed = size.toFixed(precision);
  const fraction = precision ? fixed.substr(-precision) : null;
  const int = parseInt(fixed)+'';
  const initialDigits = int.length > 3 ? int.length % 3 : 0;
  return `${initialDigits ? int.substr(0, initialDigits) + ',' : ''}${int.substr(initialDigits).replace(/(\d{3})(?=\d)/g, '$1,')}${fraction ? '.' + fraction : ''} ${units[unit]}`;
}

function getFileIcon(type) {
  switch(type) {
  case 'photoshop': return 'https://discordapp.com/assets/985ea67d2edab4424c62009886f12e44.svg';
  case 'video': return 'https://discordapp.com/assets/985ea67d2edab4424c62009886f12e44.svg';
  case 'image': return 'https://discordapp.com/assets/985ea67d2edab4424c62009886f12e44.svg';
  case 'acrobat': return 'https://discordapp.com/assets/f167b4196f02faf2dc2e7eb266a24275.svg';
  case 'ae': return 'https://discordapp.com/assets/982bd8aedd89b0607f492d1175b3b3a5.svg';
  case 'sketch': return 'https://discordapp.com/assets/f812168e543235a62b9f6deb2b094948.svg';
  case 'ai': return 'https://discordapp.com/assets/03ad68e1f4d47f2671d629cfeac048ef.svg';
  case 'archive': return 'https://discordapp.com/assets/73d212e3701483c36a4660b28ac15b62.svg';
  case 'code': return 'https://discordapp.com/assets/481aa700fab464f2332ca9b5f4eb6ba4.svg';
  case 'document': return 'https://discordapp.com/assets/9f358f466473586417baee7bacfba5ca.svg';
  case 'spreadsheet': return 'https://discordapp.com/assets/85f7a4063578f6e0e2c73f60bca0fcce.svg';
  case 'webcode': return 'https://discordapp.com/assets/a11e895b46cde503a094dd31641060a6.svg';
  case 'audio': return 'https://discordapp.com/assets/5b0da31dc2b00717c1e35fb1f84f9b9b.svg';
  case 'unknown': return 'https://discordapp.com/assets/985ea67d2edab4424c62009886f12e44.svg';
  default: return 'https://discordapp.com/assets/985ea67d2edab4424c62009886f12e44.svg';
  }
}

const fileTypes = [{
  reType: /^image\/vnd.adobe.photoshop/,
  klass: 'photoshop'
}, {
  reType: /^image\//,
  klass: 'image'
}, {
  reType: /^video\//,
  klass: 'video'
}, {
  reName: /\.pdf$/,
  klass: 'acrobat'
}, {
  reName: /\.ae/,
  klass: 'ae'
}, {
  reName: /\.sketch$/,
  klass: 'sketch'
}, {
  reName: /\.ai$/,
  klass: 'ai'
}, {
  reName: /\.(?:rar|zip|7z|tar|tar\.gz)$/,
  klass: 'archive'
}, {
  reName: /\.(?:c\+\+|cpp|cc|c|h|hpp|mm|m|json|js|rb|rake|py|asm|fs|pyc|dtd|cgi|bat|rss|java|graphml|idb|lua|o|gml|prl|sls|conf|cmake|make|sln|vbe|cxx|wbf|vbs|r|wml|php|bash|applescript|fcgi|yaml|ex|exs|sh|ml|actionscript)$/,
  klass: 'code'
}, {
  reName: /\.(?:txt|rtf|doc|docx|md|pages|ppt|pptx|pptm|key|log)$/,
  klass: 'document'
}, {
  reName: /\.(?:xls|xlsx|numbers|csv)$/,
  klass: 'spreadsheet'
}, {
  reName: /\.(?:html|xhtml|htm|js|xml|xls|xsd|css|styl)$/,
  klass: 'webcode'
}, {
  reName: /\.(?:mp3|ogg|wav|flac)$/,
  klass: 'audio'
}];
function getFileType(name, type) {
  name = name ? name.toLowerCase() : '';
  type = type || mime.getType(name);
  var foundType = fileTypes.find(function(entry) {
    return entry.reType && type ? entry.reType.test(type) : !(!entry.reName || !name) && entry.reName.test(name);
  });
  return foundType ? foundType.klass : 'unknown';
}

function parseImg(img, maxWidth, maxHeight) {
  if(!img || !img.width || !img.height || !img.proxyURL) return null;
  let {proxyURL: url, width, height} = img;
  url = new URL(url);
  const isGif = ['.mp4', 'gif', 'webm'].includes(url.pathname.substr(url.pathname.lastIndexOf('.')));
  if(width <= maxWidth && height <= maxHeight) return {url: url.href, style: `width: ${width}px; height: ${height}px;`, isGif};
  const scale = Math.min(maxWidth / width, maxHeight / height);
  width = Math.round(width * scale);
  height = Math.round(height * scale);
  
  url.searchParams.set('width', width);
  url.searchParams.set('height', height);
  return {url: url.href, style: `width: ${width}px; height: ${height}px;`};
}

function buildGifTag() {
  const rootEl = document.createElement('div');
  rootEl.className = c('d-imageAccessory');
  const tagEl = rootEl.appendChild(document.createElement('div'));
  tagEl.className = c('d-gifTag');
  return rootEl;
}

function buildImageEmbed (embed, markdownOptions, forceAnimated = false) {
  const isPlain = !embed.title && !embed.fields.length && !embed.description && !embed.timestamp && !embed.footer && !embed.color && !embed.author;
  if(!embed.image && !embed.thumbnail) return buildDefaultEmbed(embed, markdownOptions);
  if(!isPlain) {  
    if(!embed.image) {
      embed = Object.assign(new Discord.MessageEmbed(),embed);
      embed.image = embed.thumbnail;
    }
    embed.thumbnail = undefined;
    return buildDefaultEmbed(embed, markdownOptions);
  }
  const isAnimated = forceAnimated || (new URL((embed.image || embed.thumbnail).url)).pathname.endsWith('.gif');
  const img = parseImg(embed.image || embed.thumbnail, 400, 300);
  const rootEl = document.createElement('a');
  rootEl.href = '#';
  rootEl.classList.add(
    c('d-anchor'),
    c('d-anchorUnderlineOnHover'),
    c('d-imageWrapper'),
    c('d-imageZoom'),
    c('d-clickable'),
    c('d-embedImage'),
    c('d-embedWrapper'));
  rootEl.setAttribute('style', img.style);
  if(isAnimated) rootEl.appendChild(buildGifTag());
  const imgEl = rootEl.appendChild(document.createElement('img'));
  imgEl.src = img.url;
  imgEl.setAttribute('style', img.style);
  return rootEl;
}

function buildPlayIcon() {
  const rootEl = document.createElement('div');
  rootEl.classList.add(c('d-iconWrapperActive'), c('d-iconWrapper'));

  const playSvg = rootEl.appendChild(document.createElement('svg'));
  playSvg.classList.add(c('d-iconPlay'), c('d-icon'));
  playSvg.innerHTML = '<polygon fill="currentColor" points="0 0 0 14 11 7" transform="translate(7 5)"></polygon>';
  return rootEl;
}

function buildPlainVideo(vid) {
  const rootEl = document.createElement('div');
  rootEl.className = c('d-embedVideo');
  rootEl.setAttribute('style', vid.style);
  
  let innerEl = rootEl.appendChild(document.createElement('div'));
  innerEl.className = c('d-imageWrapper');
  innerEl.setAttribute('style', vid.style);
  
  innerEl = innerEl.appendChild(document.createElement('div'));
  innerEl.classList.add(c('wrapperPaused-19pWuK'), c('wrapper-2TxpI8'));
  innerEl.setAttribute('style', vid.style);

  if(vid.meta) {
    const metadataEl = innerEl.appendChild(document.createElement('div'));
    metadataEl.className = c('d-metadataVideo');
    const metadataContentEl = metadataEl.appendChild(document.createElement('div'));
    metadataContentEl.className = c('d-metadataContent');

    const metadataNameEl = metadataContentEl.appendChild(document.createElement('div'));
    metadataNameEl.className = c('d-metadataName');
    metadataNameEl.textContent = vid.meta.name;
  
    const metadataSizeEl = metadataContentEl.appendChild(document.createElement('div'));
    metadataSizeEl.classList.add(c('d-metadataSize'));
    metadataSizeEl.textContent = formatFileSize(vid.meta.size);
  
    const dlbtnEl = metadataEl.appendChild(document.createElement('a'));
    dlbtnEl.href = '#';
    dlbtnEl.classList.add(c('d-anchor'), c('d-anchorUnderlineOnHover'), c('d-metadataDownload'));
    
    const dlbtnSvg = dlbtnEl.appendChild(document.createElement('svg'));
    dlbtnSvg.className = c('d-metadataIcon');
    dlbtnSvg.innerHTML = '<g fill="none" fill-rule="evenodd"><path d="M0 0h24v24H0z"></path><path class="fill" fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></g>';
    dlbtnSvg.setAttribute('width', 24);
    dlbtnSvg.setAttribute('height', 24);
    dlbtnSvg.setAttribute('viewBox', '0 0 24 24');
  }

  const imgEl = innerEl.appendChild(document.createElement('img'));
  imgEl.src = vid.url;
  imgEl.setAttribute('style', vid.style);

  const playButtonEl = innerEl.appendChild(document.createElement('div'));
  playButtonEl.classList.add(
    c('playCenter-Fe8u3X'),
    c('flexCenter-3_1bcw'),
    c('d-flex'),
    c('justifyCenter-3D2jYp'),
    c('alignCenter-1dQNNs'));
  
  const videoWrapperEl = playButtonEl.appendChild(document.createElement('div'));
  videoWrapperEl.className = c('d-videoWrapper');
  videoWrapperEl.appendChild(buildPlayIcon());
  return rootEl;
}

function buildVideoEmbed (embed, markdownOptions) {
  if(!embed.video && !embed.thumbnail) return buildDefaultEmbed(embed, markdownOptions);
  if(!embed.thumbnail) {
    const url = new URL(embed.video.proxyURL);
    url.searchParams.set('format', 'jpeg');
    embed = Object.assign(new Discord.MessageEmbed(), embed);
    embed.thumbnail = {
      width: embed.video.width,
      height: embed.video.height,
      url: url.href,
      proxyURL: url.href
    };
  }
  const isPlain = !embed.title && !embed.fields.length && !embed.description && !embed.timestamp && !embed.footer && !embed.color && !embed.author;
  if(!isPlain) return buildDefaultEmbed(embed, markdownOptions);
  const vid = parseImg(embed.thumbnail, 400, 300);
  return buildPlainVideo(vid);
}

function buildVideoActions() {
  const rootEl = document.createElement('div');
  rootEl.className = c('d-embedVideoActions');
  let innerEl;
  innerEl = rootEl.appendChild(document.createElement('div'));
  innerEl.className = c('d-centerContent');
  innerEl = innerEl.appendChild(document.createElement('div'));
  innerEl.className = c('d-videoWrapper');
  
  innerEl.appendChild(buildPlayIcon());
  
  const openEl = innerEl.appendChild(document.createElement('a'));
  openEl.href = '#';
  openEl.classList.add(c('d-iconWrapperActive'), c('d-iconWrapper'));
  
  const openSvg = openEl.appendChild(document.createElement('svg'));
  openSvg.classList.add(c('d-iconExternalMargins'), c('d-icon'));
  openSvg.innerHTML = '<path fill="currentColor" transform="translate(3.000000, 4.000000)" d="M16 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4v-2H2V4h14v10h-4v2h4c1.1 0 2-.9 2-2V2a2 2 0 0 0-2-2zM9 6l-4 4h3v6h2v-6h3L9 6z"></path>';

  return rootEl;
}

function buildVideo(vid) {
  const rootEl = document.createElement('div');
  rootEl.classList.add(c('d-embedVideo'), c('d-embedMarginLarge'));
  rootEl.setAttribute('style', vid.style);
  const innerEl = rootEl.appendChild(document.createElement('div'));
  innerEl.setAttribute('style', vid.style);
  innerEl.classList.add(c('d-imageWrapper'), c('d-clickable'), c('d-embedVideoImageComponent'));
  const imgEl = innerEl.appendChild(document.createElement('img'));
  imgEl.src = vid.url;
  imgEl.className = c('d-embedVideoImageComponentInner');
  rootEl.appendChild(buildVideoActions());
  return rootEl;
}

function buildFields (fields, markdownOptions, embedMarkdownOptions) {
  const rootEl = document.createElement('div');
  rootEl.className = c('d-embedFields');

  for(let field of fields) {
    const fieldEl = rootEl.appendChild(document.createElement('div'));
    fieldEl.className = c('d-embedField');
    if(field.inline) fieldEl.classList.add(c('d-embedFieldInline'));
    const nameEl = fieldEl.appendChild(document.createElement('div'));
    nameEl.className = c('d-embedFieldName');
    nameEl.innerHTML = DiscordMarkdown.toHTML(field.name, markdownOptions);
    const valueEl = fieldEl.appendChild(document.createElement('div'));
    valueEl.className = c('d-embedFieldValue');
    valueEl.innerHTML = DiscordMarkdown.toHTML(field.value, embedMarkdownOptions);
  }

  return rootEl;
}

function buildDefaultEmbed (embed, markdownOptions) {
  const thumb = !embed.video && parseImg(embed.thumbnail, 80, 80);
  const img = parseImg(embed.image, 400, 300);
  const vid = embed.video && parseImg(embed.thumbnail, 400, 300);
  const embedMarkdownOptions = Object.assign({}, markdownOptions, {embed: true});

  const rootEl = document.createElement('div');
  rootEl.classList.add(c('d-embed'), c('d-embedWrapper'));
  
  const pill = rootEl.appendChild(document.createElement('div'));
  pill.className = c('d-embedPill');
  if(embed.hexColor) pill.style.backgroundColor = embed.hexColor;

  const inner = rootEl.appendChild(document.createElement('div'));
  inner.className = c('d-embedInner');

  const content = inner.appendChild(document.createElement('div'));
  content.className = c('d-embedContent');

  const contentInner = content.appendChild(document.createElement('div'));
  contentInner.classList.add(c('d-embedContentInner'), c('d-markup'));

  if(thumb) {
    const thumbEl = content.appendChild(document.createElement('a'));
    thumbEl.href = '#';
    thumbEl.classList.add(
      c('d-anchor'),
      c('d-anchorUnderlineOnHover'),
      c('d-imageWrapper'),
      c('d-imageZoom'),
      c('d-clickable'),
      c('d-embedThumbnail'));
    thumbEl.setAttribute('style', thumb.style);
    const imgEl = thumbEl.appendChild(document.createElement('img'));
    imgEl.src = thumb.url;
    imgEl.setAttribute('style', thumb.style);
  }

  if (embed.provider) {
    const el = contentInner.appendChild(document.createElement('div'));
    let innerEl;
    if(embed.provider.url) {
      innerEl = el.appendChild(document.createElement('a'));
      innerEl.href = '#';
      innerEl.classList.add(
        c('d-anchor'),
        c('d-anchorUnderlineOnHover'),
        c('d-embedProviderLink'),
        c('d-embedLink'));
    } else {
      innerEl = el.appendChild(document.createElement('span'));
    }
    innerEl.classList.add(c('d-embedProvider'));
    innerEl.innerHTML = DiscordMarkdown.toHTML(embed.provider.name, markdownOptions);
  }

  if (embed.author) {
    const el = contentInner.appendChild(document.createElement('div'));
    el.className = c('d-embedAuthor');
    if(embed.author.proxyIconURL) {
      const icon = el.appendChild(document.createElement('img'));
      icon.src = embed.author.proxyIconURL;
      icon.className = c('d-embedAuthorIcon');
    }
    let innerEl;
    if(embed.author.url) {
      innerEl = el.appendChild(document.createElement('a'));
      innerEl.href = '#';
      innerEl.classList.add(
        c('d-anchor'),
        c('d-anchorUnderlineOnHover'),
        c('d-embedAuthorNameLink'),
        c('d-embedLink'));
    } else {
      innerEl = el.appendChild(document.createElement('span'));
    }
    innerEl.classList.add(c('d-embedAuthorName'));
    innerEl.innerHTML = DiscordMarkdown.toHTML(embed.author.name, markdownOptions);
  }

  if (embed.title) {
    const el = contentInner.appendChild(document.createElement('div'));
    let innerEl;
    if(embed.url) {
      innerEl = el.appendChild(document.createElement('a'));
      innerEl.href = '#';
      innerEl.classList.add(c('d-anchor'),
        c('d-anchorUnderlineOnHover'),
        c('embedTitleLink-1Zla9e'),
        c('d-embedLink'));
    } else {
      innerEl = el.appendChild(document.createElement('div'));
    }
    innerEl.classList.add(c('d-embedTitle'));
    innerEl.innerHTML = DiscordMarkdown.toHTML(embed.title, markdownOptions);
  }
  if (embed.description && !vid) {
    const el = contentInner.appendChild(document.createElement('div'));
    el.className = c('d-embedDescription');
    el.innerHTML = DiscordMarkdown.toHTML(embed.description, embedMarkdownOptions);
  }

  if (embed.fields && embed.fields.length) {
    contentInner.appendChild(buildFields(embed.fields, markdownOptions, embedMarkdownOptions));
  }

  for(let childEl of contentInner.children) {
    childEl.classList.add(c('d-embedMargin'));
  }

  const firstChildEl = contentInner.firstElementChild;
  if(firstChildEl) firstChildEl.classList.remove(c('d-embedMargin'));

  if(img) {
    const imgOuter = inner.appendChild(document.createElement('a'));
    imgOuter.href = '#';
    imgOuter.classList.add(
      c('d-anchor'),
      c('d-anchorUnderlineOnHover'),
      c('d-imageWrapper'),
      c('d-imageZoom'),
      c('d-clickable'),
      c('d-embedImage'),
      c('d-embedMarginLarge'),
      c('d-embedWrapper'));
    imgOuter.setAttribute('style', img.style);
    const imgEl = imgOuter.appendChild(document.createElement('img'));
    imgEl.src = img.url;
    imgEl.setAttribute('style', img.style);
  }

  if(vid) inner.appendChild(buildVideo(vid));

  let {footer, timestamp} = embed;
  if(timestamp) timestamp = moment.utc(timestamp).calendar();
  if(!footer && timestamp) {
    footer = {
      text: timestamp
    };
    timestamp = null;
  }

  if(footer) {
    let textEl;
    if(footer.proxyIconURL) {
      const footerEl = inner.appendChild(document.createElement('div'));
      footerEl.classList.add(c('d-embedFooter'), c('d-embedMarginLarge'));
      const icon = footerEl.appendChild(document.createElement('img'));
      icon.src = footer.proxyIconURL;
      icon.className = c('d-embedFooterIcon');
      textEl = footerEl.appendChild(document.createElement('span'));
    } else {
      textEl = inner.appendChild(document.createElement('div'));
      textEl.classList.add(c('d-embedFooter'));
    }
    textEl.classList.add(c('d-embedFooterText'));
    textEl.appendChild(document.createTextNode(footer.text));
    if(timestamp) {
      const separator = textEl.appendChild(document.createElement('span'));
      separator.className = c('d-embedFooterSeparator');
      separator.textContent = '•';
      textEl.appendChild(document.createTextNode(timestamp));
    }
  }

  return rootEl;
}

function buildGifvEmbed(embed, markdownOptions) {
  embed = Object.assign(new Discord.MessageEmbed(), embed);
  if(!embed.thumbnail) {
    embed.thumbnail = embed.video;
    const url = new URL(embed.thumbnail.proxyURL);
    url.searchParams.set('format', 'jpeg');
    embed.thumbnail.url = embed.thumbnail.proxyURL = url.href;
  }
  embed.video = null;
  return buildImageEmbed(embed, markdownOptions, true);
}

function buildEmbed (embed, markdownOptions) {
  switch(embed.type) {
  case 'video':
    return buildVideoEmbed(embed, markdownOptions);
  case 'image':
    return buildImageEmbed(embed, markdownOptions);
  case 'gifv': return buildGifvEmbed(embed, markdownOptions);
  default:
    return buildDefaultEmbed(embed, markdownOptions);
  }
}

function buildAudioControls() {
  const rootEl = document.createElement('div');
  rootEl.className = c('d-audioControls');

  const playEl = rootEl.appendChild(document.createElement('div'));
  const playSvg = playEl.appendChild(document.createElement('svg'));
  playSvg.className = c('d-controlIcon');
  playSvg.setAttribute('width', 16);
  playSvg.setAttribute('height', 16);
  playSvg.setAttribute('viewBox', '0 0 24 24');
  playSvg.innerHTML = '<polygon fill="currentColor" points="0 0 0 14 11 7" transform="translate(7 5)"></polygon>';

  const timerEl = rootEl.appendChild(document.createElement('div'));
  timerEl.className = c('d-durationTimeWrapper');
  
  const dispTimerEl = timerEl.appendChild(document.createElement('span'));
  dispTimerEl.classList.add(c('d-durationTimeDisplay'), c('d-weightMedium'));
  dispTimerEl.textContent = '-:--';

  const sepTimerEl = timerEl.appendChild(document.createElement('span'));
  sepTimerEl.classList.add(c('d-durationTimeSeparator'), c('d-weightMedium'));
  sepTimerEl.textContent = '/';

  timerEl.appendChild(dispTimerEl.cloneNode());

  const horizontalEl = rootEl.appendChild(document.createElement('div'));
  horizontalEl.className = c('d-horizontal');

  const mediaBarOuterEl = horizontalEl.appendChild(document.createElement('div'));
  mediaBarOuterEl.className = c('d-mediaBarInteraction');
  const mediaBarEl = mediaBarOuterEl.appendChild(document.createElement('div'));
  mediaBarEl.className = c('d-mediaBarWrapper');
  const progressEl = mediaBarEl.appendChild(document.createElement('div'));
  progressEl.classList.add(c('d-mediaBarProgress'), c('d-fakeEdges'));

  const volumeEl = rootEl.appendChild(document.createElement('div'));
  volumeEl.className = c('d-flex');
  const volBtnEl = volumeEl.appendChild(document.createElement('div'));
  const volBtnSvg = volBtnEl.appendChild(document.createElement('svg'));
  volBtnSvg.className = c('d-controlIcon');
  volBtnSvg.setAttribute('width', 16);
  volBtnSvg.setAttribute('height', 16);
  volBtnSvg.setAttribute('viewBox', '0 0 16 16');
  volBtnSvg.innerHTML = '<path fill="currentColor" d="M9.33333333,2 L9.33333333,3.37333333 C11.26,3.94666667 12.6666667,5.73333333 12.6666667,7.84666667 C12.6666667,9.96 11.26,11.74 9.33333333,12.3133333 L9.33333333,13.6933333 C12,13.0866667 14,10.7 14,7.84666667 C14,4.99333333 12,2.60666667 9.33333333,2 L9.33333333,2 Z M11,7.84666667 C11,6.66666667 10.3333333,5.65333333 9.33333333,5.16 L9.33333333,10.5133333 C10.3333333,10.04 11,9.02 11,7.84666667 L11,7.84666667 Z M2,5.84666667 L2,9.84666667 L4.66666667,9.84666667 L8,13.18 L8,2.51333333 L4.66666667,5.84666667 L2,5.84666667 L2,5.84666667 Z"></path>';

  return rootEl;
}

function buildAudioAttachment(attachment) {
  const rootEl = document.createElement('div');
  rootEl.classList.add(c('d-wrapperAudio'), c('d-wrapperAudioRound'), c('d-embedWrapper'));
  rootEl.style.width = '498px';
  rootEl.style.height = 'auto';

  const metadataEl = rootEl.appendChild(document.createElement('div'));
  metadataEl.className = c('d-audioMetadata');

  const metadataContentEl = metadataEl.appendChild(document.createElement('div'));
  metadataContentEl.className = c('d-metadataContent');

  const metadataNameEl = metadataContentEl.appendChild(document.createElement('a'));
  metadataNameEl.href = '#';
  metadataNameEl.classList.add(c('d-anchor'), c('d-anchorUnderlineOnHover'), c('d-metadataName'));
  metadataNameEl.textContent = attachment.name;

  const metadataSizeEl = metadataContentEl.appendChild(document.createElement('div'));
  metadataSizeEl.classList.add(c('d-metadataSize'));
  metadataSizeEl.textContent = formatFileSize(attachment.size);

  const dlbtnEl = metadataEl.appendChild(document.createElement('a'));
  dlbtnEl.href = '#';
  dlbtnEl.classList.add(c('d-anchor'), c('d-anchorUnderlineOnHover'), c('d-metadataDownload'));
  
  const dlbtnSvg = dlbtnEl.appendChild(document.createElement('svg'));
  dlbtnSvg.className = c('d-metadataIcon');
  dlbtnSvg.innerHTML = '<g fill="none" fill-rule="evenodd"><path d="M0 0h24v24H0z"></path><path class="fill" fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></g>';
  dlbtnSvg.setAttribute('width', 24);
  dlbtnSvg.setAttribute('height', 24);
  dlbtnSvg.setAttribute('viewBox', '0 0 24 24');

  rootEl.appendChild(buildAudioControls());

  return rootEl;
}

function buildAttachment (attachment, markdownOptions) {
  const type = getFileType(attachment.url);
  if(attachment.width && attachment.height) {
    if(type === 'image') {
      const embed = new Discord.MessageEmbed();
      embed.type = 'image';
      embed.image = {
        width: attachment.width,
        height: attachment.height,
        url: attachment.url,
        proxyURL: attachment.proxyURL,
      };
      return buildEmbed(embed, markdownOptions);
    }
    const url = new URL(attachment.proxyURL);
    url.searchParams.set('format', 'jpeg');
    const vid = parseImg({
      url: url.href,
      proxyURL: url.href,
      width: attachment.width,
      height: attachment.height
    }, 400, 300);
    vid.meta = {
      name: attachment.name,
      size: attachment.size
    };
    return buildPlainVideo(vid);
  }
  
  if(type === 'audio')
    return buildAudioAttachment(attachment, markdownOptions);
  
  const rootEl = document.createElement('div');
  rootEl.classList.add(
    c('attachment-33OFj0'),
    c('horizontal-2EEEnY'),
    c('d-flex'),
    c('directionRow-3v3tfG'),
    c('alignCenter-1dQNNs'),
    c('d-embedWrapper'));
  
  const iconEl = rootEl.appendChild(document.createElement('img'));
  iconEl.className = c('d-fileIcon');
  iconEl.src = getFileIcon(type);

  const innerEl = rootEl.appendChild(document.createElement('div'));
  innerEl.className = c('d-attachmentInner');

  const filenameWrapperEl = innerEl.appendChild(document.createElement('div'));
  filenameWrapperEl.className = c('d-filenameLinkWrapper');

  const filenameLinkEl = filenameWrapperEl.appendChild(document.createElement('a'));
  filenameLinkEl.href = '#';
  filenameLinkEl.classList.add(c('d-anchor'), c('d-anchorUnderlineOnHover'), c('fileNameLink-9GuxCo'));
  filenameLinkEl.textContent = attachment.name;

  const metadataEl = innerEl.appendChild(document.createElement('div'));
  metadataEl.classList.add(c('d-metadata'), c('d-size12'), c('d-weightLight'), c('d-height16'));
  metadataEl.textContent = formatFileSize(attachment.size);

  const dlbtnEl = rootEl.appendChild(document.createElement('a'));
  dlbtnEl.href = '#';
  dlbtnEl.classList.add(c('d-anchor'), c('d-anchorUnderlineOnHover'));
  
  const dlbtnSvg = dlbtnEl.appendChild(document.createElement('svg'));
  dlbtnSvg.className = c('downloadButton-23tKQp');
  dlbtnSvg.innerHTML = '<g fill="none" fill-rule="evenodd"><path d="M0 0h24v24H0z"></path><path class="fill" fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></g>';
  dlbtnSvg.setAttribute('width', 24);
  dlbtnSvg.setAttribute('height', 24);
  dlbtnSvg.setAttribute('viewBox', '0 0 24 24');

  return rootEl;
}

function buildHeader(message) {
  const rootEl = document.createElement('div');
  rootEl.className = c('d-headerCozy');
  const avatarWrapperEl = rootEl.appendChild(document.createElement('div'));
  avatarWrapperEl.classList.add(c('d-headerWrapper'), c('d-large'), c('d-avatar'));
  const avatarEl = avatarWrapperEl.appendChild(document.createElement('div'));
  avatarEl.classList.add(c('d-image'), c('d-large'));
  avatarEl.style.backgroundImage = `url("${message.author.displayAvatarURL({size: 128})}")`;
  const nameWrapperEl = rootEl.appendChild(document.createElement('h2'));
  nameWrapperEl.classList.add(c('d-headerCozyMeta'));
  const nameEl = nameWrapperEl.appendChild(document.createElement('span')).appendChild(document.createElement('span'));
  nameEl.className = c('d-username');
  if(message.member) {
    nameEl.style.color = message.member.displayHexColor;
    nameEl.textContent = message.member.displayName;
  } else {
    nameEl.textContent = message.author.username;
  }
  if(message.author.bot) {
    const botEl = nameEl.parentNode.appendChild(document.createElement('span'));
    botEl.classList.add(c('d-botTagRegular'), c('d-botTag'), c('d-botTagCozy'), c('d-botTagHeader'));
    botEl.textContent = 'BOT';
  }
  const timeEl = nameWrapperEl.appendChild(document.createElement('time'));
  timeEl.className = c('d-timestampCozy');
  timeEl.setAttribute('datetime', message.createdAt.toISOString());
  timeEl.textContent = moment.utc(message.createdAt).calendar();
  return rootEl;
}

function buildReactions(message) {
  const rootEl = document.createElement('span');
  rootEl.className = c('d-reactions');
  for(let [,reaction] of message.reactions) {
    const reactionEl = rootEl.appendChild(document.createElement('div'));
    reactionEl.className = c('d-reaction');
    const innerEl = reactionEl.appendChild(document.createElement('div'));
    innerEl.className = c('d-reactionInner');
    const imgEl = innerEl.appendChild(document.createElement('img'));
    imgEl.src = getEmojiURL(reaction.emoji);
    imgEl.className = 'emoji';
    const countEl = innerEl.appendChild(document.createElement('div'));
    countEl.className = c('d-reactionCount');
    countEl.style.minWidth = '9px';
    countEl.textContent = reaction.count;
  }
  return rootEl;
}

function getEmojiURL(emoji) {
  if(emoji.id) return `https://cdn.discordapp.com/emojis/${DiscordMarkdown.sanitizeUrl(emoji.id)}.${emoji.animated?'gif':'png'}?v=1`;
  return `../assets/emoji/${twemoji.convert.toCodePoint(emoji.name)}.svg`;
}

function buildMessage (message) {
  const discordCallback = {
    user({id}) {
      let inner = `&lt;@${id}&gt;`;
      const member = message.mentions.members.resolve(id) || message.guild.members.resolve(id);
      if (member) {
        inner = `@${member.displayName}`;
      } else {
        const user = message.mentions.users.resolve(id) || message.client.users.resolve(id);
        if(user) return `@${user.username}`;
      }
      
      return `<span class="${c('d-mention')} ${c('d-wrapperMentionHover')} ${c('d-wrapperMention')}" role="button">${DiscordMarkdown.sanitizeText(inner)}</span>`;
    },
    channel({id}) {
      const channel = message.guild.channels.resolves(id);
      if(!channel) return '#deleted-channel';
      if(!channel.type !== 'text') return `#$${DiscordMarkdown.sanitizeText(channel.name)}`;
      return `<span tabindex="0" class="${c('d-mention')} ${c('d-wrapperMentionHover')} ${c('d-wrapperMention')}" role="button">#${DiscordMarkdown.sanitizeText(channel.name)}</span>`;
    },
    role({id}) {
      const role = message.guild.roles.resolve(id);
      if(!role) return '@deleted-role';
      if(role.color) return `<span class="${c('d-mention')}" style="color: ${role.hexColor}; background-color: rgba(${colorToRgba(role.color, .1).join()})">@${DiscordMarkdown.sanitizeText(role.name)}</span>`;
      return `<span class="${c('d-mention')} ${c('d-wrapperMentionHover')} ${c('d-wrapperMention')}">@${DiscordMarkdown.sanitizeText(role.name)}</span>`;
    },
    emoji({id, name, animated}) {
      if(id) {
        return `<img class="emoji" src="https://cdn.discordapp.com/emojis/${DiscordMarkdown.sanitizeUrl(id)}.${animated?'gif':'png'}?v=1" alt=":${DiscordMarkdown.sanitizeText(name)}:" draggable="false">`;
      } else {
        return `${twemoji.parse(name,{base: '../assets/', folder: 'emoji', size: 'svg', ext: '.svg'})}`;
      }
    },
    here() {
      return `<span class="${c('d-mention')} ${c('d-wrapperMentionHover')} ${c('d-wrapperMention')}">@here</span>`;
    },
    everyone() {
      return `<span class="${c('d-mention')} ${c('d-wrapperMentionHover')} ${c('d-wrapperMention')}">@everyone</span>`;
    }
  };
  const markdownOptions = {discordCallback, cssModuleNames, hideSpoilers: true};
  const rootEl = document.createElement('div');
  rootEl.classList.add(c('d-contentCozy'), c('d-content'));
  
  const bodyEl = rootEl.appendChild(document.createElement('div'));
  bodyEl.classList.add(c('d-containerCozyMessage'), c('d-containerMessage'));
  if(message.mentions.everyone) bodyEl.classList.add(c('d-isMentionedCozy'), c('d-isMentioned'));
  const bodyInnerEl = bodyEl.appendChild(document.createElement('div'));
  bodyInnerEl.className = c('d-markup');
  bodyInnerEl.innerHTML = DiscordMarkdown.toHTML(message.content, markdownOptions);
  if(message.editedAt) {
    const editedEl = bodyInnerEl.appendChild(document.createElement('time'));
    editedEl.setAttribute('datetime', message.editedAt.toISOString());
    editedEl.className = c('d-edited');
    editedEl.textContent = '(edited)';
  }

  const extraEl = rootEl.appendChild(document.createElement('div'));
  extraEl.classList.add(c('d-containerCozyExtra'), c('d-containerExtra'));
  message.attachments.forEach(a=>extraEl.appendChild(buildAttachment(a, markdownOptions)));
  message.embeds.forEach(e=>extraEl.appendChild(buildEmbed(e, markdownOptions)));

  if(message.reactions.size) extraEl.appendChild(buildReactions(message));
  return rootEl;
}

function buildHTML (messages) {
  const groups = groupMessages(messages);
  const rootEl = document.createElement('div');
  rootEl.style.width = '100%';
  for(const group of groups) {
    let message = group.shift();
    const groupRootEl = rootEl.appendChild(document.createElement('div'));
    groupRootEl.classList.add(c('d-containerCozyBounded'), c('d-containerCozyGroup'), c('d-containerGroup'));
    let messageEl = groupRootEl.appendChild(document.createElement('div'));
    messageEl.classList.add(c('d-messageCozy'), c('d-message'));
    messageEl.appendChild(buildHeader(message));
    messageEl.appendChild(buildMessage(message));
    for(message of group) {
      messageEl = groupRootEl.appendChild(document.createElement('div'));
      messageEl.classList.add(c('d-messageCozy'), c('d-message'));
      messageEl.appendChild(buildMessage(message));
    }
    groupRootEl.appendChild(document.createElement('hr')).classList.add(c('d-dividerEnabled'), c('d-divider'));
  }
  return rootEl.outerHTML;
}

function groupMessages (messages) {
  const groups = [];
  let oldMessage;
  for(let message of messages) {
    if(!oldMessage || oldMessage.author.id !== message.author.id || message.createdTimestamp - oldMessage.createdTimestamp > GROUPING_THRESHOLD) {
      groups.push([]);
    }
    const group = groups[groups.length-1];
    group.push(message);
    oldMessage = message;
  }
  return groups;
}

module.exports = buildHTML;