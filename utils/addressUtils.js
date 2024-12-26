const crypto = require('crypto');

const generateAddress = (prefix) => {
  const randomBytes = crypto.randomBytes(20);
  const address = prefix + randomBytes.toString('hex');
  const publicKey = crypto.randomBytes(32).toString('hex');
  return { address, publicKey };
};

module.exports = { generateAddress };