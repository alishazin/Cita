
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// User-defined 
const DB = require(`${__dirname}/config/db.js`); 
const usersModel = require(`${__dirname}/models/users.js`); 
const authViews = require(`${__dirname}/apps/auth/views.js`); 

// Initializing Express App
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Database
const mongoose = DB.connect();

// Models
const User = usersModel();

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
        });
    });
});
  
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});

// passport.use(
//     new GoogleStrategy({
//         clientID: process.env.GOOGLE_CLIENT_ID,
//         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//         callbackURL: "http://localhost:3000/auth/google/secrets",
//         // userProfileURL: "https:://www.googleapis.com/oauth2/v3/userinfo"
//     },  
//     function(accessToken, refreshToken, profile, cb) {
//         const email = profile.emails[0].value;
        
//         User.findOrCreate({ 
//             googleId: profile.id, 
//             username: email,
//             provider: "google",
//             details: profile._json,
//         }, function (err, user) {
//             return cb(err, user);
//         }
//     );
// }));

// Views
authViews.initialize(app, passport, User);

// Starting Server
app.listen(3000, () => {
    console.log("Server started on port 3000");
});