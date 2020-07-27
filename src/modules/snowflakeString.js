const btoa = global.btoa ? global.btoa : require('btoa');
const atob = global.atob ? global.atob : require('atob');

/**
 * Turn a base 64 value into a BigInt
 * @param {string} encoded - The base 64
 * @param {BigInt} [keySize] - The amount of bytes to use for a xor bitmask for the rest of the bytes
 * @returns {string} The snowflake represented by the encoded string
 */
function decodeSnowflake(encoded, keySize = 3n) {
  const arr = new Uint8Array(Array.prototype.map.call(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')), c=>c.charCodeAt()));
  let val = 0n;
  for (let i = 0n; i < arr.length; i++) {
    val |= BigInt( keySize && i >= keySize ? arr[i] ^ arr[i % keySize] : arr[i]) << (i) * 8n;
  }
  return String(val);
}

/**
 * Turn a base 64 value into a BigInt
 * @param {string | BigInt} snowflake - The base 64
 * @param {BigInt} [keySize] - The amount of bytes to use for a xor bitmask for the rest of the bytes
 * @param {BigInt} [bytes] - The size of the bytearray to encode as base64
 * @returns {string} The nice string representation of the snowflake value.
 */
function encodeSnowflake(snowflake, keySize = 3n, bytes = 8) {
  if (typeof snowflake === 'string') snowflake = BigInt(snowflake);
  const arr = new Uint8Array(bytes);
  for (let i = 0n; i < arr.length; i++) {
    const num = Number((snowflake >> i * 8n) & 0xFFn);
    arr[i] = keySize ? num ^ arr[i % keySize] : num;
  }
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g,'');
}

module.exports = {
  decodeSnowflake,
  encodeSnowflake,
};
