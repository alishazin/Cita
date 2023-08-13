
const orgValidator = require('./org_validator');
const _ = require('lodash');

var numToDay = {
    0: "sun",
    1: "mon",
    2: "tue",
    3: "wed",
    4: "thu",
    5: "fri",
    6: "sat",
}

const intToMonth = {
    0 : "Jan",
    1 : "Feb",
    2 : "Mar",
    3 : "Apr",
    4 : "May",
    5 : "Jun",
    6 : "Jul",
    7 : "Aug",
    8 : "Sep",
    9 : "Oct",
    10 : "Nov",
    11 : "Dec",
}

const intToMonthFull = {
    0 : "January",
    1 : "February",
    2 : "March",
    3 : "April",
    4 : "May",
    5 : "June",
    6 : "July",
    7 : "August",
    8 : "September",
    9 : "October",
    10 : "November",
    11 : "December",
}

module.exports = {SingleOrgGetDetails: SingleOrgGetDetails, checkIfDateFromFuture: checkIfDateFromFuture, addZeroToStart: addZeroToStart, sortMyBookingByDateAndStartTime: sortMyBookingByDateAndStartTime, addMonthStamps: addMonthStamps, getOrgName: getOrgName, getEjsFormat: getEjsFormat, getAllBookingsData: getAllBookingsData};

function SingleOrgGetDetails(orgObj) {
    var daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let upcomingHolidays = [];
    let recentHolidays = [];
    let date = new Date();

    let todaysDate = new Date(`${date.getFullYear()}-${date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}-${date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()}T00:00:00.000+00:00`);
    
    for (let x of orgObj.special_holidays) {
        let dateObj = new Date(x.date);
        if (dateObj <= todaysDate) {
            recentHolidays.push({date: `${daysShort[dateObj.getDay()]} ${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`, slots: x.slots === null ? 'All' : x.slots});
        } else {
            upcomingHolidays.push({date: `${daysShort[dateObj.getDay()]} ${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`, slots: x.slots === null ? 'All' : x.slots});
        } 
    }

    return {
        upcomingHolidays: upcomingHolidays,
        recentHolidays: recentHolidays
    }
}

function checkIfDateFromFuture(date, today) {
    let newDateObj = new Date();
    let todaysDate = new Date(`${newDateObj.getFullYear()}-${newDateObj.getMonth() + 1 < 10 ? `0${newDateObj.getMonth() + 1}` : newDateObj.getMonth() + 1}-${newDateObj.getDate() < 10 ? `0${newDateObj.getDate()}` : newDateObj.getDate()}T00:00:00.000+00:00`);
    
    if (today === true && date < todaysDate) return false;
    if (today === false && date <= todaysDate) return false;
    return true;
}

function addZeroToStart(number) {
    if (number < 10) {
        return `0${number}`
    } else {
        return String(number);
    }
}

function sortMyBookingByDateAndStartTime(array, instance) {
    
    const totalLength = array.length;
    let i,j;

    for (i=0; i<totalLength - 1; i++) {
        
        for (j=0; j<totalLength - i - 1; j++) {

            if (array[j].date.getTime() > array[j + 1].date.getTime() && instance === 1) {
                let temp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = temp;
            }
            
            else if (array[j].date.getTime() < array[j + 1].date.getTime() && instance === 2) {
                let temp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = temp;
            }

            else if (array[j].date.toDateString() === array[j + 1].date.toDateString() && instance === 1) {
                if (orgValidator.compareTime(array[j].start_time, array[j+1].start_time, 3)) {
                    let temp = array[j];
                    array[j] = array[j + 1];
                    array[j + 1] = temp;
                }
            }

            else if (array[j].date.toDateString() === array[j + 1].date.toDateString() && instance === 2) {
                if (orgValidator.compareTime(array[j].start_time, array[j+1].start_time, 1)) {
                    let temp = array[j];
                    array[j] = array[j + 1];
                    array[j + 1] = temp;
                }
            }
        }
    }

    return array;
}

function addMonthStamps(array) {

    const initialLength = array.length;
    let insertedCount = 1;

    let lastStamp = `${intToMonth[array[0].date.getMonth()]}, ${array[0].date.getFullYear()}`;
    array.splice(0, 0, lastStamp);

    for (let i=0; i<initialLength; i++) {

        let currentStamp = String(`${intToMonth[array[i + insertedCount].date.getMonth()]}, ${array[i + insertedCount].date.getFullYear()}`);

        if (currentStamp !== lastStamp) {
            array.splice(i + insertedCount, 0, currentStamp);
            lastStamp = currentStamp;
            insertedCount++;
        }

    }


    return array;
}

async function getOrgName(id, Organization) {
    const orgObj = await Organization.findOne({_id: id});
    if (orgObj === null) {
        return '[ Deleted Organization ]'
    } else {
        return _.startCase(orgObj.name);
    }
}

async function getEjsFormat(array, Organization, instance) {

    let ejsFormat = [];

    for (let myBookingObj of array) {

        if (typeof myBookingObj === 'string' || myBookingObj instanceof String) {
            ejsFormat.push({type: 0, content: myBookingObj})
        } else {

            let obj = {};

            if (myBookingObj.status === 1 && instance === 1) {
                obj.class_name = 'active';
            } else if (myBookingObj.status === 1 && instance === 2) {
                obj.class_name = 'compromised';
            } else if (myBookingObj.status === 2) {
                obj.class_name = 'cancelled';
            }

            obj.day_name = _.startCase(numToDay[String(myBookingObj.date.getDay())]);
            obj.date = myBookingObj.date.getDate();
            obj.org_name = await getOrgName(myBookingObj.org_id, Organization);
            obj.time = `${addZeroToStart(myBookingObj.start_time[0])}:${addZeroToStart(myBookingObj.start_time[1])} - ${addZeroToStart(myBookingObj.end_time[0])}:${addZeroToStart(myBookingObj.end_time[1])}`;
            obj.price = myBookingObj.price;
            obj.booking_id = myBookingObj.booking_id;

            ejsFormat.push({type: 1, content: obj});
        }
    }

    return ejsFormat;

}

async function getAllBookingsData(date, orgObj, UserModel) {

    let returnObj = {}
    // {
    //     org_name: ,
    //     date_string: ,
    //     total_slots: ,
    //     slot_details: {
    //         '1' : {
    //             timing: String,
    //             filled_bookings: ,
    //             total_available: ,
    //             cancellable: Bool,
    //             bookings: [
    //                 {name: , email: , id: },
    //                 {name: , email: , id: },
    //             ]
    //         }, 
    //         '2': ..
    //     }
    // }

    returnObj.org_name = _.startCase(orgObj.name);
    returnObj.date_string = `${intToMonth[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    returnObj.date = `${date.getFullYear()}-${addZeroToStart(date.getMonth() + 1)}-${addZeroToStart(date.getDate())}`;

    const working_hours = orgObj.working_hours[date.getDay()];

    returnObj.total_slots = working_hours === null ? 0 : working_hours.length;
    returnObj.slot_details = {};

    for (let i=0; i<returnObj.total_slots; i++) {

        returnObj.slot_details[i+1] = {};

        returnObj.slot_details[i+1].timing = `${addZeroToStart(working_hours[i][0][0])}:${addZeroToStart(working_hours[i][0][1])} - ${addZeroToStart(working_hours[i][1][0])}:${addZeroToStart(working_hours[i][1][1])}`;
        returnObj.slot_details[i+1].total_available = working_hours[i][3];
        returnObj.slot_details[i+1].filled_bookings = 0;

        if (checkIfDateFromFuture(date, false)) {
            returnObj.slot_details[i+1].cancellable = true;    
        } else {

            const today = new Date();
            if (date.toDateString() === today.toDateString()) {
                if (orgValidator.compareTime(working_hours[i][0], [today.getHours(), today.getMinutes()], 3)) {
                    returnObj.slot_details[i+1].cancellable = true;    
                } else {
                    returnObj.slot_details[i+1].cancellable = false;    
                }
            } else {
                returnObj.slot_details[i+1].cancellable = false;    
            }
        }
        
        returnObj.slot_details[i+1].bookings = [];

        for (let bookingObj of orgObj.bookings) {
            if (bookingObj.slot_no === Number(i+1) && bookingObj.date.toDateString() === date.toDateString()) {
                const clientUserObj = await UserModel.findOne({_id: bookingObj.user});
                returnObj.slot_details[i+1].bookings.push({
                    name: `${clientUserObj.firstName} ${clientUserObj.lastName}`,
                    email: clientUserObj.username,
                    id: bookingObj.id,
                });
                returnObj.slot_details[i+1].filled_bookings++;
            }
        }

    }

    return returnObj
}