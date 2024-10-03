const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const { sessionSecret, googleClientId, googleClientSecret } = require('./config')

// Connect ke MongoDB dengan nama db googleoauth
mongoose.connect('mongodb://localhost:27017/usergoogleoauthDB', {
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});

// Buat variabel Schema 
const userSchema = new mongoose.Schema({
    googleId: String,
    displayName: String,
    email: String
});

const User = mongoose.model('User', userSchema); // nama model 'User' sebagai nama collcetion akan menjadi plural yaitu 'users'

const app = express();

// Konfigurasi session untuk menyimpan data login
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true
}));

// Inisialisasi passport dan session
app.use(passport.initialize());
app.use(passport.session());

// Konfigurasi Passport Google OAuth
passport.use(new GoogleStrategy({
    clientID: googleClientId,
    clientSecret: googleClientSecret,
    callbackURL: 'http://localhost:3000/auth/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
        // Cek apakah pengguna sudah ada di database
        const existingUser = await User.findOne({ googleId: profile.id });
        if (existingUser) {
            // Jika sudah ada, lanjutkan login
            return done(null, existingUser);
        } else {
            // Jika belum ada, simpan data pengguna baru ke database
            const addUser = new User({
                googleId: profile.id,
                displayName: profile.displayName,
                email: profile.emails[0].value
            });
            await addUser.save();
            return done(null, addUser);
        }
    }
));

// Serialize user ke session  
passport.serializeUser((user, done) => {
    done(null, user);
});
   
// Deserialize user dari session
passport.deserializeUser((user, done) => {
    done(null, user);
});
   
// Route untuk login menggunakan Google
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


// Callback route setelah login berhasil
app.get('/auth/callback', 
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/profile');
    }
);


// Route untuk menampilkan profil pengguna setelah login
app.get('/profile', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/auth/google');
    }
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Profile</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
        </head>
        <body>
            <div class="container mt-5">
                <h1>Hello, ${req.user.displayName}!</h1>
                <a href="/logout" class="btn btn-danger">Logout</a>
            </div>

            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
        </body>
        </html>
    `);
});


// Route untuk logout dan akan diarah ke halaman login akun Google
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/auth/google');
    })
});

// Jalankan server
app.listen(3000, () => {
    console.log('Server berjalan di http://localhost:3000');
});