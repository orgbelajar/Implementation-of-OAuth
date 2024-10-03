const express = require('express'); 
const session = require('express-session');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const mongoose = require('mongoose');
const path = require('path');
const { sessionSecret, githubClientId, facebookClientId, githubClientSecret, facebookClientSecret } = require('./config');

// Connect ke MongoDB dengan nama db userfacebookgithuboauthDB
mongoose.connect('mongodb://localhost:27017/userfacebookgithuboauthDB', {
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});

// Buat variabel Schema 
const userSchema = new mongoose.Schema({
    githubId: String,
    facebookId: String,
    displayName: String,
    email: String
});

const User = mongoose.model('User', userSchema); // nama model 'User' sebagai nama collection akan menjadi plural yaitu 'users'

const app = express();

// Middleware untuk serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Konfigurasi session untuk menyimpan data login
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true
}));

// Inisialisasi passport dan session
app.use(passport.initialize());
app.use(passport.session());

// Konfigurasi Passport GitHub OAuth
passport.use(new GitHubStrategy({
    clientID: githubClientId,
    clientSecret: githubClientSecret,
    callbackURL: 'http://localhost:5000/auth/github/callback'
},
async (accessToken, refreshToken, profile, done) => {
    const existingUser = await User.findOne({ githubId: profile.id });
    if (existingUser) {
        return done(null, existingUser);
    } else {
        const addUser = new User({
            githubId: profile.id,
            displayName: profile.displayName,
            /*
            Metode Nullish Coalescing 
            (memastikan kode tetap aman dan tidak memunculkan error ketika data yang diharapkan tidak tersedia)
            */
            email: profile.emails?.[0]?.value ?? null // Nullish Coalescing
        });
        await addUser.save();
        return done(null, addUser);
    }
}));
// Konfigurasi Passport Facebook OAuth
passport.use(new FacebookStrategy({
    clientID: facebookClientId,
    clientSecret: facebookClientSecret,
    callbackURL: 'http://localhost:5000/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'emails']
},
async (accessToken, refreshToken, profile, done) => {
    const existingUser = await User.findOne({ facebookId: profile.id });
    if (existingUser) {
        return done(null, existingUser);
    } else {
        const addUser = new User({
            facebookId: profile.id,
            displayName: profile.displayName,
            email: profile.emails?.[0]?.value ?? null
        });
        await addUser.save();
        return done(null, addUser);
    }
}));

// Serialize user ke session
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user dari session
passport.deserializeUser((user, done) => {
    done(null, user);
});

// Root path (Main Menu)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // hubungkan ke folder public (sebagai client side nya)
});

// Route untuk login menggunakan GitHub (jika awalnya belum login ke Githun)
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
// Route untuk login menggunakan Facebook (jika awalnya belum login ke Facebook)
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));


// Callback route setelah login GitHub berhasil
app.get('/auth/github/callback', 
    passport.authenticate('github', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/profile');
    }
);
// Callback route setelah login Facebook berhasil (jika sebelumnya sudah login ke facebook)
app.get('/auth/facebook/callback', 
    passport.authenticate('facebook', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/profile');
    }
);


// Route untuk menampilkan profil pengguna setelah login
app.get('/profile', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/');
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


// Route untuk logout
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

// Jalankan server
app.listen(5000, () => {
    console.log('Server berjalan di http://localhost:5000');
});



