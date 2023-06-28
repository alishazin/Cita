
module.exports = {SingleOrgGetDetails: SingleOrgGetDetails};

function SingleOrgGetDetails(orgObj) {
    var daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let upcomingHolidays = [];
    let recentHolidays = [];
    let date = new Date();

    let todaysDate = new Date(`${date.getFullYear()}-${date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth()}-${date.getDate()}T00:00:00.000+00:00`);
    
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