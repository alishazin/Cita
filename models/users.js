
module.exports = initializeCollection;

const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require("mongoose-findorcreate");

function initializeCollection() {

    const userSchema = new mongoose.Schema({
        firstName: {
            required: true,
            type: String,
            minLength: 2,
            maxLength: 20,
            trim: true,
            lowercase: true,
        },
        lastName: {
            required: true,
            type: String,
            minLength: 2,
            maxLength: 20,
            trim: true,
            lowercase: true,
        },
        username: {
            required: true,
            type: String,
            trim: true,
            lowercase: true,
        },
        verified: {
            required: false,
            type: Boolean,
        },
        verification_id: {
            id: String,
            date_generated: Date,
        },
        googleId: String,
        provider: String,
        reset_password: {
            token: String,
            date_generated: Date,
        },
        my_bookings: Array
    })
    userSchema.plugin(passportLocalMongoose);
    userSchema.plugin(findOrCreate);
    
    const User = mongoose.model("User", userSchema);

    return User;
}