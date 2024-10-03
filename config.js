// config.js
require('dotenv').config(); // Memuat variabel dari file .env

module.exports = {
    sessionSecret: process.env.SESSION_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
};