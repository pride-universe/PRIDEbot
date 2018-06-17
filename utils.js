function emojiToString(emoji) {
  if(emoji.id === null) return emoji.name;
  return "<"+(emoji.animated?'a':'')+":"+emoji.name+":"+emoji.id+">";
}

function emojiToReaction(emoji) {
  return emoji.id === null ? emoji.name : emoji.id;
}

function emojiCompare(emojiA, emojiB) {
  return emojiA.id === emojiB.id && emojiA.name === emojiB.name
}

module.exports = {
  emojiToString,
  emojiToReaction,
  emojiCompare,
}
