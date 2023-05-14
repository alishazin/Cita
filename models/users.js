
module.exports = initializeCollection;

const mongoose = require("mongoose");

function initializeCollection() {
    
    const User = mongoose.model("User", new mongoose.Schema({
        provider: String,
        email: String,
        password: String,
        googleId: String,
        details: Object,
        secret: String,
    }));

    return User;
}