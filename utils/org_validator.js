
module.exports = {create: createOrgValidator};

var dayValue = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
}

function compareTime(time1, time2, mode) {
    /* 
        mode = 1 (less than)
        mode = 2 (less than or equal to)
        mode = 3 (greater than)
        mode = 4 (greater than or equal to)
    */

    if (mode === 1) {
        if (time1[0] < time2[0]) return true;
        if (time1[0] > time2[0]) return false;

        if (time1[0] === time2[0]) {
            if (time1[1] < time2[1]) return true;
            if (time1[1] >= time2[1]) return false;
        }
    }

    else if (mode === 2) {
        if (time1[0] < time2[0]) return true;
        if (time1[0] > time2[0]) return false;

        if (time1[0] === time2[0]) {
            if (time1[1] < time2[1]) return true;
            if (time1[1] > time2[1]) return false;
            if (time1[1] == time2[1]) return true;
        }
    }

}

function validateWorkingDay(body, day) {

    const def_error_msg = {is_valid: false, err_msg: "Something is wrong, try refreshing the page."};
    let count = 1;
    let data = [];

    // totalCount validation
    const totalCount = body[`${day}_count`];

    if (isNaN(totalCount) || totalCount < 1) return def_error_msg

    while (count <= totalCount) {
        // From Time
        const from_time = body[`${day}_${count}_from`];

        if (from_time === undefined) {
            return def_error_msg;
        }

        if (from_time.trim() === "") {
            return {is_valid: false, err_msg: "From time cannot be blank."}
        }

        const from_time_array = from_time.split(":");

        if (from_time_array.length !== 2) return def_error_msg;

        try {
            from_time_array[0] = Number(from_time_array[0]);
            from_time_array[1] = Number(from_time_array[1]);
        } catch {
            return def_error_msg;
        }


        if (!(from_time_array[0] >= 0 && from_time_array[0] <= 23 && from_time_array[1] >= 0 && from_time_array[1] <= 59)) {
            return def_error_msg;
        }

        // To Time
        const to_time = body[`${day}_${count}_to`];

        if (to_time === undefined) {
            return def_error_msg;
        }

        if (from_time.trim() === "") {
            return {is_valid: false, err_msg: "To time cannot be blank."}
        }

        const to_time_array = to_time.split(":");

        if (to_time_array.length !== 2) return def_error_msg;

        try {
            to_time_array[0] = Number(to_time_array[0]);
            to_time_array[1] = Number(to_time_array[1]);
        } catch {
            return def_error_msg;
        }


        if (!(to_time_array[0] >= 0 && to_time_array[0] <= 23 && to_time_array[1] >= 0 && to_time_array[1] <= 59)) {
            return def_error_msg;
        }

        // Price
        let price = Number(body[`${day}_${count}_price`]);

        if (price === undefined || isNaN(price)) {
            return def_error_msg;
        }

        if (price < 0) {
            return {is_valid: false, err_msg: "Price should not be less than zero!"};
        }
        
        // Total slots
        let total_slots = Number(body[`${day}_${count}_slots`]);

        if (total_slots === undefined || isNaN(total_slots)) {
            return def_error_msg;
        }

        if (total_slots <= 0) {
            return {is_valid: false, err_msg: "Total slots should be greater than zero!"};
        }

        count++;

        data.push([from_time_array, to_time_array, price, total_slots])

    }

    // Validating order of time
    let previousToTime = null;

    for (let i of data) {

        if (!compareTime(i[0], i[1], 1)) {
            return {is_valid: false, err_msg: "From time should be before to time."};
        }
        
        if (previousToTime !== null && !compareTime(previousToTime, i[0], 2)) {
            return {is_valid: false, err_msg: "Order of time is invalid!"};
        }

        previousToTime = i[1];
    }
    

    // return {is_valid: false, err_msg: "Errorrr"}
    return {is_valid: true, data: data}

}

async function createOrgValidator(req, res, User, Organization) {
    const name = req.body.name.trim().toLowerCase();
    const status = req.body.status;

    const def_error_msg = {is_valid: false, err_msg: "Something is wrong, try refreshing the page."};

    let working_hours = {sun: null, mon: null, tue: null, wed: null, thu: null, fri: null, sat: null};

    // Name check
    if (name.length < 3) {
        return {is_valid: false, err_msg: "Name should be atleast 3 characters long"}
    }

    const orgObj = await Organization.findOne({name: name});

    if (orgObj) {
        return {is_valid: false, err_msg: "Name is already taken."}
    }

    // Status check
    if (!(status === "1" || status === "2")) {
        return def_error_msg;
    }
    
    // All Days check
    for (let x of Object.keys(working_hours)) {
        if (req.body[x] === "on") {
            const day = validateWorkingDay(req.body, x);
            
            if (!day.is_valid) {
                return {is_valid: false, err_msg: day.err_msg}
            }
            working_hours[x] = day.data;
        }
    }

    // console.log(working_hours);

    return {
        is_valid: true,
        data: {
            name: name,
            working_hours: working_hours
        }
    }
}