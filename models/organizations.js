
module.exports = initializeCollection;

const mongoose = require("mongoose");

function initializeCollection() {

    const organizationSchema = new mongoose.Schema({
        admin: {
            required: true,
            type: String,
        },
        name: {
            required: true,
            type: String,
        }, 
        working_hours: Object,
        status: {
            required: true,
            type: Number
        }, // 1: paused, 2: active
        created_on: {
            required: true,
            type: Date
        },
        special_holidays: Array
    })
    
    const Organization = mongoose.model("Organization", organizationSchema);

    return Organization;
}