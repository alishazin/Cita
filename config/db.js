
module.exports = {connect : configMongoDB};

const mongoose = require("mongoose");

function configMongoDB() {
    mongoose.connect("mongodb://127.0.0.1:27017/citaDB");
    return mongoose;
}