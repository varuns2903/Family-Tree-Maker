const { Uploadclient } = require('uploadcare');

// Initialize the Uploadcare client with your secret keys
// These keys must be in your .env file
const uploadcare = new Uploadclient({
  publicKey: process.env.UPLOADCARE_PUBLIC_KEY,
  privateKey: process.env.UPLOADCARE_PRIVATE_KEY,
});

module.exports = uploadcare;