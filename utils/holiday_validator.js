
module.exports = {validate: holidayValidator};

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
    
    let newDateObj = new Date();
    let todaysDate = new Date(`${newDateObj.getFullYear()}-${newDateObj.getMonth() + 1 < 10 ? `0${newDateObj.getMonth() + 1}` : newDateObj.getMonth()}-${newDateObj.getDate()}T00:00:00.000+00:00`);
    
    if (date <= todaysDate) {
        return {is_valid: false, err_msg: "Date should be from the future."}
    }

    if (orgObj.special_holidays !== null) {
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
        async save() {
            if (orgObj.special_holidays.length === 0) {
                orgObj.special_holidays = [{date: date, slots: filteredSlotValues}];
            } else {
                orgObj.special_holidays.push({date: date, slots: filteredSlotValues});
            }
            await orgObj.save();

            // Delete all bookings on that slot
        }
    }
}