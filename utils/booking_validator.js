
module.exports = {validate: bookingValidator, getExistingBookingNumber: getExistingBookingNumber}

const _ = require('lodash');
const utilPatches = require('../utils/patches.js');
const orgValidator = require('./org_validator.js');

function getExistingBookingNumber(orgObj, date, slot_no) {
    let count = 0;
    for (let bookingObj of orgObj.bookings) {
        if (bookingObj.date.toLocaleDateString() === date.toLocaleDateString() && Number(bookingObj.slot_no) === Number(slot_no)) {
            count++;
        }
    }
    return count;
}

async function bookingValidator(req, Organization) {

    const getDateForInputValue = (booking_date) => {
        return `${booking_date.getFullYear()}-${utilPatches.addZeroToStart(booking_date.getMonth() + 1)}-${utilPatches.addZeroToStart(booking_date.getDate())}`
    }

    let org_name = req.body.org_name;
    let booking_date = req.body.booking_date;

    if (!org_name || !booking_date) {
        return {is_valid: false, template_vars: {error_msg: "Something went wrong, refresh the page and try again.", org_name_before: null, booking_date_before: null, result_header: null, search_result: null}}
    } else {
        
        // booking_date validation
        booking_date = new Date(booking_date);
        if (booking_date == "Invalid Date") {
            return {is_valid: false, template_vars: {error_msg: "Invalid date.", org_name_before: null, booking_date_before: null, result_header: null, search_result: null}}
        } else if (!utilPatches.checkIfDateFromFuture(booking_date, true)) {
            return {is_valid: false, template_vars: {error_msg: "Date shouldn't be from the past.", org_name_before: null, booking_date_before: null, result_header: null, search_result: null}}
        } else {
            
            // org_name validation
            org_name = String(org_name).trim().toLowerCase();
            const orgObj = await Organization.findOne({name: org_name, status: 2});
            
            if (orgObj === null) {
                return {is_valid: false, template_vars: {error_msg: "Organization with the given name does not exist.", org_name_before: org_name, booking_date_before: getDateForInputValue(booking_date), result_header: null, search_result: null}}
            } else {
                
                // Checking availability
                
                // checking all slots
                const allSlots = orgObj.working_hours[booking_date.getDay()];
                
                if (allSlots === null) {
                    return {is_valid: false, template_vars: {error_msg: null, org_name_before: org_name, booking_date_before: getDateForInputValue(booking_date), result_header: "Not open for appointments.", search_result: null}}
                } else {

                    let deletedNum = 0;

                    // If booking_date is today
                    if (booking_date.toDateString() === new Date().toDateString()) {
                        
                        // Remove slots that are past the current time
                        let timeNow = [new Date().getHours(), new Date().getMinutes()];
                        let initialLength = allSlots.length;
    
                        for (let i=0; i<initialLength; i++) {
                            if (orgValidator.compareTime(timeNow, allSlots[i - deletedNum][1], 4)) {
                                allSlots.splice(i - deletedNum, 1);
                                deletedNum++;
                            }
                        }
                    }
    
                    
                    // Checking if holiday
                    const special_holidays = orgObj.special_holidays;
                    let unavailable_slots = [];
                    for (let holiday_obj of special_holidays) {
                        if (holiday_obj.date.toLocaleDateString() === booking_date.toLocaleDateString()) {
                            unavailable_slots = holiday_obj.slots;
                            break;
                        }
                    }
                    
                    if (unavailable_slots === null || unavailable_slots.length === allSlots.length) {
                        return {is_valid: false, template_vars: {error_msg: null, org_name_before: org_name, booking_date_before: getDateForInputValue(booking_date), result_header: "Not open for appointments.", search_result: null}}
                    } else {

                        let availableSlots = [];
                        for (let x=0; x<allSlots.length; x++) {
                            if (unavailable_slots.includes(x+1)) continue;
                            else {
                                const existingBookingsNum = getExistingBookingNumber(orgObj, booking_date, x+1);
                                availableSlots.push({slot_no: x+deletedNum+1, from_time: allSlots[x][0], to_time: allSlots[x][1], price: allSlots[x][2], remaining: allSlots[x][3] - existingBookingsNum});
                            }
                        }

                        return {is_valid: true, orgObj: orgObj, date: booking_date, deletedNum: deletedNum, template_vars: {error_msg: null, org_name_before: _.startCase(org_name), booking_date_before: getDateForInputValue(booking_date), result_header: "Search result", search_result: availableSlots, addZero: utilPatches.addZeroToStart}}
                    }

                }

            }
        }
    }
}