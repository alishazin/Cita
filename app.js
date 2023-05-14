
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

// User-defined 
const DB = require(`${__dirname}/config/db.js`); 
const usersModel = require(`${__dirname}/models/users.js`); 
const authViews = require(`${__dirname}/apps/auth/views.js`); 

// Initializing Express App
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

// Database
const mongoose = DB.connect();

// Models
const User = usersModel();

// Views
authViews.initialize(app);

// Starting Server
app.listen(3000, () => {
    console.log("Server started on port 3000");
});