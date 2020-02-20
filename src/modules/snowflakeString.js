const btoa = require('btoa');
const atob = require('atob');

/**
 * Turn a base 64 value into a BigInt
 * @param {string} base64 - The base 64
 * @param {BigInt} [keySize] - The amount of bytes to use for a xor bitmask for the rest of the bytes
 * @returns {BigInt} The BigInt represented by the Base64 string
 */
function base64toBigInt(base64, keySize = 3n) {
  const arr = new Uint8Array(Array.prototype.map.call(atob(base64), c=>c.charCodeAt()));
  let val = 0n;
  for (let i = 0n; i < arr.length; i++) {
    val |= BigInt( keySize && i >= keySize ? arr[i] ^ arr[i % keySize] : arr[i]) << (i) * 8n;
  }
  return val;
}

/**
 * Turn a base 64 value into a BigInt
 * @param {BigInt} bInt - The base 64
 * @param {BigInt} [keySize] - The amount of bytes to use for a xor bitmask for the rest of the bytes
 * @param {BigInt} [bytes] - The size of the bytearray to encode as base64
 * @returns {string} The Base64 representation of the bInt value.
 */
function bigIntToBase64(bInt, keySize = 3n, bytes = 8) {
  const arr = new Uint8Array(bytes);
  for (let i = 0n; i < arr.length; i++) {
    const num = Number((bInt >> i * 8n) & 0xFFn);
    arr[i] = keySize ? num ^ arr[i % keySize] : num;
  }
  return btoa(String.fromCharCode(...arr)).replace(/=/g,'');
}

module.exports = {
  base64toBigInt,
  bigIntToBase64,
};
