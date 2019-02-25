/*
Including license for this file in case I accidentally commit it before being done with my modifications and fork it off:

MIT License

Copyright (c) 2017 Brussell

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const markdown = require('simple-markdown');
const highlight = require('highlight.js');
const emojis = require('emojis-list');

const textRegex = new RegExp(`^[\\s\\S]+?(?=[^0-9A-Za-z\\s\\u00c0-\\uffff-]|${generateEmojiRanges()}|\\n\\n|\\n|\\w+:\\S|$)`)

function generateEmojiRanges() {
  const chars = emojis.map(e=>e.charCodeAt(0)).sort().filter((e,pos,arr)=>!pos || e !== arr[pos - 1]);
  const ranges = [];
  let range = [];
  /**
   * @param {string} char
   */
  for(let char of chars) {
    if(!range.length) {
      range[0] = char;
    } else if(char === range[range.length-1] + 1) {
      range[1] = char;
    } else {
      if(range.length === 2 && range[0] === range[1]-1) {
        ranges.push([range[0]], [range[1]]);
      } else {
        ranges.push(range);
      }
      range = [char];
    }
  }
  /**
   * @param {Array<Number>} range
   */
  return ranges.map(range=>{
    if(range.length === 1) return `\\u${range[0].toString(16).padStart(4,"0")}`;
    return `[\\u${range[0].toString(16).padStart(4,"0")}-\\u${range[1].toString(16).padStart(4,"0")}]`;
  }).join('|');
}

/**
 * Generate an HTML tag
 * 
 * @param {string} tagName The name of the tag
 * @param {string} content The contents of the tag
 * @param {Object} attributes The attributes of the tag
 * @param {boolean} isClosed Whether to close the tag
 * @param {Object} [state] A state object
 * @param {boolean} [state.insideSpoiler=true] Whether to attach the inside spoiler class
 * @param {Object} [state.cssModuleNames] The mapping of classes to CSS modules
 * @returns {string}
 */
function htmlTag(tagName, content, attributes, isClosed = true, state = { }) {
	if (typeof isClosed === 'object') {
		state = isClosed;
		isClosed = true;
	}

	if (!attributes)
    attributes = { };
  
  if (attributes.class && !Array.isArray(attributes.class)) {
    attributes.class = attributes.class.split(" ");
  }
  
  if (state.insideSpoiler) {
    if(!attributes.class) attributes.class = [];
    attributes.class.push('d-inlineContent');
  }
  
  if (attributes.class && state.cssModuleNames)
		attributes.class = attributes.class.map(cl => state.cssModuleNames[cl] || cl);

	let attributeString = '';
	for (let attr in attributes) {
		// Removes falsy attributes
		if (Object.prototype.hasOwnProperty.call(attributes, attr) && attributes[attr])
			attributeString += ` ${attr}="${Array.isArray(attributes[attr]) ? attributes[attr].filter(e=>e).join(' ') : attributes[attr]}"`;
	}

	let unclosedTag = '<' + tagName + attributeString + '>';

	if (isClosed)
		return unclosedTag + content + '</' + tagName + '>';
	return unclosedTag;
}

const rules = {
	codeBlock: Object.assign({ }, markdown.defaultRules.codeBlock, {
		html: (node, output, state) => {
			let code;
			if (node.lang && highlight.getLanguage(node.lang))
				code = highlight.highlight(node.lang, node.content, true); // Discord seems to set ignore ignoreIllegals: true

			if (code && state.cssModuleNames) // Replace classes in hljs output
				code.value = code.value.replace(/<span class="([a-z0-9-_ ]+)">/gi, (str, m) =>
					str.replace(m, m.split(' ').map(cl => state.cssModuleNames[cl] || cl).join(' ')));
      if(state.insideSpoiler) state.spoilerIsCodeblock = true;
			return htmlTag('pre', htmlTag(
				'code', code ? code.value : node.content, { class: `hljs${code ? ' ' + code.language : ''}` }, state
			), null, state);
		}
	}),
	fence: Object.assign({ }, markdown.defaultRules.fence, {
		match: markdown.inlineRegex(/^ *(`{3,}) *(\S+)? *\n([\s\S]+?)\s*\1 *(?:\n *)*/)
	}),
	newline: markdown.defaultRules.newline,
	escape: markdown.defaultRules.escape,
	autolink: Object.assign({ }, markdown.defaultRules.autolink, {
		parse: capture => {
			return {
				content: [{
					type: 'text',
					content: capture[1]
				}],
				target: capture[1]
			};
		},
		html: (node, output, state) => {
      const childState = state.insideSpoiler ? Object.assign({}, state, {insideSpoiler: false}) : state;
			return htmlTag('a', output(node.content, childState), { href: markdown.sanitizeUrl(node.target) }, state);
		}
	}),
	url: Object.assign({ }, markdown.defaultRules.url, {
		parse: capture => {
			return {
				content: [{
					type: 'text',
					content: capture[1]
				}],
				target: capture[1]
			}
		},
		html: (node, output, state) => {
      const childState = state.insideSpoiler ? Object.assign({}, state, {insideSpoiler: false}) : state;
			return htmlTag('a', output(node.content, childState), { href: markdown.sanitizeUrl(node.target) }, state);
		}
	}),
	em: Object.assign({ }, markdown.defaultRules.em, {
    html: (node, output, state) => {
      const childState = state.insideSpoiler ? Object.assign({}, state, {insideSpoiler: false}) : state;
			return htmlTag('em', output(node.content, childState), null, state);
		}
  }),
	strong: Object.assign({ }, markdown.defaultRules.strong, {
    html: (node, output, state) => {
      const childState = state.insideSpoiler ? Object.assign({}, state, {insideSpoiler: false}) : state;
			return htmlTag('strong', output(node.content, childState), null, state);
		}
  }),
	u: Object.assign({ }, markdown.defaultRules.u, {
    html: (node, output, state) => {
      const childState = state.insideSpoiler ? Object.assign({}, state, {insideSpoiler: false}) : state;
			return htmlTag('u', output(node.content, childState), null, state);
		}
  }),
	del: Object.assign({ }, markdown.defaultRules.del, {
		match: markdown.inlineRegex(/^~~(\s*?(?:\\[\s\S]|~(?!~)|[^\s\\~]|\s+(?!~~))+?\s*?)~~/),
    html: (node, output, state) => {
      const childState = state.insideSpoiler ? Object.assign({}, state, {insideSpoiler: false}) : state;
			return htmlTag('del', output(node.content, childState), null, state);
		}
	}),
	inlineCode: Object.assign({ }, markdown.defaultRules.inlineCode, {
    html: function(node, output, state) {
      return htmlTag('code', markdown.sanitizeText(node.content), {class: "inline"}, state);
    }
  }),
	text: Object.assign({ }, markdown.defaultRules.text, {
		match: source => textRegex.exec(source),
		html: function(node, output, state) {
      const content = state.escapeHTML ? markdown.sanitizeText(node.content) : node.content;
      if(state.insideSpoiler) return htmlTag('span', content, null, state);
      return content;
		}
	}),
	specialCaseArms: {
		order: markdown.defaultRules.escape.order - 0.5,
		match: source => /^¯\\_\(ツ\)_\/¯/.exec(source),
		parse: function(capture, parse, state) {
			return {
				content: parse(capture[0].replace(/^¯\\_\(ツ\)_\/¯/, '¯\\\\\\_(ツ)_/¯'), state)
			};
		},
		html: function(node, output, state) {
			return output(node.content, state);
		},
	},
	br: Object.assign({ }, markdown.defaultRules.br, {
		match: markdown.anyScopeRegex(/^\n/),
	}),
	spoiler: {
		order: 0,
		match: source => /^\|\|((?:.|\n)+?)\|\|/.exec(source),
		parse: function(capture, parse, state) {
			return {
				content: parse(capture[1], state)
			};
		},
		html: function(node, output, state) {
      const childState = Object.assign({insideSpoiler: true}, state);
      const outputted = output(node.content, childState);
      const classes = ['d-spoilerText'];
      if(childState.spoilerIsCodeblock) classes.push('d-spoilerCodeBlock');
      if(state.hideSpoilers) classes.push('d-spoilerHidden');
			return htmlTag('span', outputted, { class: classes }, state);
		}
	}
};

const discordCallbackDefaults = {
	user: node => '@' + node.id,
	channel: node => '#' + node.id,
	role: node => '&' + node.id,
	emoji: node => ':' + markdown.sanitizeText(node.name) + ':',
	everyone: () => '@everyone',
	here: () => '@here'
};

const rulesDiscord = {
	discordUser: {
		order: markdown.defaultRules.strong.order,
		match: source => /^<@!?([0-9]*)>/.exec(source),
		parse: function(capture) {
			return {
				id: capture[1]
			};
		},
		html: function(node, output, state) {
			return htmlTag('span', state.discordCallback.user(node), { class: 'd-mention d-user' }, state);
		}
	},
	discordChannel: {
		order: markdown.defaultRules.strong.order,
		match: source => /^<#?([0-9]*)>/.exec(source),
		parse: function(capture) {
			return {
				id: capture[1]
			};
		},
		html: function(node, output, state) {
			return htmlTag('span', state.discordCallback.channel(node), { class: 'd-mention d-channel' }, state);
		}
	},
	discordRole: {
		order: markdown.defaultRules.strong.order,
		match: source => /^<@&([0-9]*)>/.exec(source),
		parse: function(capture) {
			return {
				id: capture[1]
			};
		},
		html: function(node, output, state) {
			return htmlTag('span', state.discordCallback.role(node), { class: 'd-mention d-role' }, state);
		}
	},
	discordEmoji: {
    order: markdown.defaultRules.strong.order,
    /**
     * @param {string} source
     */
		match: source => {
      const regRes = /^<(a?):(\w+):([0-9]*)>/.exec(source);
      if(regRes) return regRes;
      const stringEmoji = emojis.find(e => {
        return source.startsWith(e);
      });
      if(!stringEmoji) return null;
      const match = [stringEmoji, null, stringEmoji, null];
      match.index = 0;
      match.input = source;
      match.groups = undefined;
      return match;
    },
		parse: function(capture) {
			return {
				animated: capture[1] === "a",
				name: capture[2],
				id: capture[3],
			};
		},
		html: function(node, output, state) {
			return htmlTag('span', state.discordCallback.emoji(node), { class: `d-emoji${node.animated ? ' d-emoji-animated' : ''}` }, state);
		}
	},
	discordEveryone: {
		order: markdown.defaultRules.strong.order,
		match: source => /^@everyone/.exec(source),
		parse: function() {
			return { };
		},
		html: function(node, output, state) {
			return htmlTag('span', state.discordCallback.everyone(node), { class: 'd-mention d-user' }, state);
		}
	},
	discordHere: {
		order: markdown.defaultRules.strong.order,
		match: source => /^@here/.exec(source),
		parse: function() {
			return { };
		},
		html: function(node, output, state) {
			return htmlTag('span', state.discordCallback.here(node), { class: 'd-mention d-user' }, state);
		}
	}
};
Object.assign(rules, rulesDiscord);

const rulesDiscordOnly = Object.assign({ }, rulesDiscord, {
	text: Object.assign({ }, markdown.defaultRules.text, {
		match: source => textRegex.exec(source),
		html: function(node, output, state) {
			if (state.escapeHTML)
				return markdown.sanitizeText(node.content);

			return node.content;
		}
	})
});

const rulesEmbed = Object.assign({ }, rules, {
	link: markdown.defaultRules.link
});

const parser = markdown.parserFor(rules);
const htmlOutput = markdown.htmlFor(markdown.ruleOutput(rules, 'html'));
const parserDiscord = markdown.parserFor(rulesDiscordOnly);
const htmlOutputDiscord = markdown.htmlFor(markdown.ruleOutput(rulesDiscordOnly, 'html'));
const parserEmbed = markdown.parserFor(rulesEmbed);
const htmlOutputEmbed = markdown.htmlFor(markdown.ruleOutput(rulesEmbed, 'html'));

/**
 * Parse markdown and return the HTML output
 * @param {String} source Source markdown content
 * @param {Object} [options] Options for the parser
 * @param {Boolean} [options.embed=false] Parse as embed content
 * @param {Boolean} [options.escapeHTML=true] Escape HTML in the output
 * @param {Boolean} [options.discordOnly=false] Only parse Discord-specific stuff (such as mentions)
 * @param {Boolean} [options.hideSpoilers=false] Give spoilers a hidden class
 * @param {Object} [options.discordCallback] Provide custom handling for mentions and emojis
 * @param {Object} [options.cssModuleNames] An object mapping css classes to css module classes
 * @returns {string}
 */
function toHTML(source, options) {
	options = Object.assign({
		embed: false,
		escapeHTML: true,
		discordOnly: false,
    discordCallback: { },
    hideSpoilers: false
	}, options || { });

	let _parser = parser;
	let _htmlOutput = htmlOutput;
	if (options.discordOnly) {
		_parser = parserDiscord;
		_htmlOutput = htmlOutputDiscord;
	} else if (options.embed) {
		_parser = parserEmbed;
		_htmlOutput = htmlOutputEmbed;
	}

	const state = {
		inline: true,
		escapeHTML: options.escapeHTML,
    cssModuleNames: options.cssModuleNames || null,
    discordCallback: Object.assign({ }, discordCallbackDefaults, options.discordCallback),
    hideSpoilers: options.hideSpoilers
	};

	return _htmlOutput(_parser(source, state), state);
}

module.exports = {
	parser: source => parser(source, { inline: true }),
	htmlOutput,
  toHTML,
  sanitizeText: markdown.sanitizeText,
  sanitizeUrl: markdown.sanitizeUrl,
  htmlTag
};
