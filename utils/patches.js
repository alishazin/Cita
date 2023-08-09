
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

module.exports = {SingleOrgGetDetails: SingleOrgGetDetails, checkIfDateFromFuture: checkIfDateFromFuture, addZeroToStart: addZeroToStart, sortMyBookingByDateAndStartTime: sortMyBookingByDateAndStartTime, addMonthStamps: addMonthStamps, getOrgName: getOrgName, getEjsFormat: getEjsFormat};

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

function sortMyBookingByDateAndStartTime(array) {
    
    const totalLength = array.length;
    let i,j;

    for (i=0; i<totalLength - 1; i++) {
        
        for (j=0; j<totalLength - i - 1; j++) {

            if (array[j].date.getTime() > array[j + 1].date.getTime()) {
                let temp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = temp;
            }

            else if (array[j].date.toDateString() === array[j + 1].date.toDateString()) {
                if (orgValidator.compareTime(array[j].start_time, array[j+1].start_time, 3)) {
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
    return _.startCase(orgObj.name);
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

            ejsFormat.push({type: 1, content: obj});
        }
    }

    return ejsFormat;

}