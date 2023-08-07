
module.exports = {validate: holidayValidator};

const utilPatches = require('./patches.js');
const mailClient = require('./email.js');

function inOperator(array, value) {
    for (let x of array) {
        if (x === value) {
            return true;
        }
    }
    return false;
}

function holidayValidator(body, orgObj) {

    // date validation
    const date = new Date(body.date);

    if (date == "Invalid Date") {
        return {is_valid: false, err_msg: "Date format is invalid!"}
    }
    
    if (!utilPatches.checkIfDateFromFuture(date, false)) {
        return {is_valid: false, err_msg: "Date should be from the future."}
    }

    if (orgObj.special_holidays.length !== 0) {
        for (let x of orgObj.special_holidays) {
            if (x.date.toLocaleDateString() == date.toLocaleDateString()) {
                return {is_valid: false, err_msg: "Date is already declared as holiday."}
            }
        }
    }
    
    // Slots validation
    let slots = body.slots;
    let filteredSlotValues = [];
    if (slots === '') {
        filteredSlotValues = null;
    } else {
        slots = String(slots);
        const slotValues = slots.split(",");

        for (let value of slotValues) {
            if (isNaN(value)) {
                return {is_valid: false, err_msg: "Slot should be numeric."}
            }
            value = Number(value);
            if (value <= 0) {
                return {is_valid: false, err_msg: "Invalid slot."}
            }
            if (inOperator(filteredSlotValues, value)) {
                return {is_valid: false, err_msg: "Slot number cannot be repeated."}
            }
            filteredSlotValues.push(value);
        }
    }

    // Availability 
    let daySchedule = orgObj.working_hours[date.getDay()];
    
    if (daySchedule === null) {
        return {is_valid: false, err_msg: "The given date has as an empty schedule."}
    }
    
    if (filteredSlotValues !== null) {
        if (daySchedule.length < Math.max(...filteredSlotValues)) {
            return {is_valid: false, err_msg: "Slot number exceeds the total slots."}
        }
    }

    return {
        is_valid: true,
        async save(UserModel) {
            if (orgObj.special_holidays.length === 0) {
                orgObj.special_holidays = [{date: date, slots: filteredSlotValues}];
            } else {
                orgObj.special_holidays.push({date: date, slots: filteredSlotValues});
            }
            await orgObj.save();

            // Delete all bookings on that slot and sending email to client
            let deletedNum = 0;
            let initialLength = orgObj.bookings.length;
            
            for (let i=0; i<initialLength; i++) {

                const bookingObj = orgObj.bookings[i - deletedNum];

                if (bookingObj === undefined) break;

                if (bookingObj.date.toLocaleDateString() === date.toLocaleDateString() && (filteredSlotValues === null || filteredSlotValues.includes(Number(orgObj.bookings[i - deletedNum].slot_no)))) {
                    
                    const userObj = await UserModel.findOne({_id: bookingObj.user});

                    // change status of myBookingObj in userObj
                    for (let myBookingObj of userObj.my_bookings) {

                        if (myBookingObj.booking_id.toString() === bookingObj.id.toString()) {
                            myBookingObj.status = 2;
                            break;
                        }
                    }
                    console.log(userObj);
                    userObj.markModified('my_bookings');
                    await userObj.save();

                    mailClient.sendEmailBookingCancelled(userObj.username, orgObj, bookingObj);

                    orgObj.bookings.splice(i - deletedNum, 1);

                    deletedNum++;
                }
            }
            await orgObj.save();

        }
    }
}