
module.exports = {SingleOrgGetDetails: SingleOrgGetDetails, checkIfDateFromFuture: checkIfDateFromFuture, addZeroToStart: addZeroToStart};

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