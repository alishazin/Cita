
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
const organizationsModel = require(`${__dirname}/models/organizations.js`); 
const authViews = require(`${__dirname}/apps/auth/views.js`); 
const homeViews = require(`${__dirname}/apps/home/views.js`); 

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
const Organization = organizationsModel();

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

passport.use("google", new GoogleStrategy({
    clientID: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/signup/google/callback",
},  
async function(accessToken, refreshToken, profile, cb) {
    const email = profile._json.email.trim().toLowerCase();

    // deleting if unverified account exist
    await User.findOneAndRemove({username: email, provider: "local", verified: false});

    User.findOrCreate({ 
        googleId: profile.id, 
        username: email,
        provider: "google",
    },{
        firstName: profile._json.given_name,
        lastName: profile._json.family_name,
    }, async function (err, user) {
        if (err) {
            cb();
        } else {
            return cb(err, user);
        }
    });
}
));

app.get("/", (req, res) => {
    if (req.user) {
        res.redirect("/home/book-appointment");
    } else {
        res.redirect("/auth/login");
    }
});

// Views
authViews.initialize(app, passport, User);
homeViews.initialize(app, passport, User, Organization);

// Custom 404 page (Add at last)
app.use(function(req, res) {
    res.status(404).render('auth/404.ejs');
});


// Starting Server
app.listen(3000, () => {
    console.log("Server started on port 3000");
});