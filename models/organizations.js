
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
        working_days: {
            required: true,
            type: Array,
        },
        working_hours: Object,
        status: {
            required: true,
            type: Number
        } // 1: paused, 2: active
    })
    
    const Organization = mongoose.model("Organization", organizationSchema);

    return Organization;
}