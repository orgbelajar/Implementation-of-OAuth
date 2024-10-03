const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') }); // Memuat .env dari folder TUGAS

module.exports = {
    sessionSecret: process.env.SESSION_SECRET,
    githubClientId: process.env.GITHUB_CLIENT_ID,
    facebookClientId: process.env.FACEBOOK_CLIENT_ID,
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
    facebookClientSecret: process.env.FACEBOOK_CLIENT_SECRET
};