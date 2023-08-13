
module.exports = {initialize: initializeViews};

const viewAuthenticator = require('../../utils/view_authenticator.js');
const orgValidator = require('../../utils/org_validator.js');
const holidayValidator = require('../../utils/holiday_validator.js');
const bookingValidator = require('../../utils/booking_validator.js');
const utilPatches = require('../../utils/patches.js');
const _ = require('lodash');
const mailClient = require('../../utils/email.js');
var mongoose = require('mongoose');
const email = require('../../utils/email.js');

function initializeViews(app, passport, UserModel, OrganizationModel) {
    bookAppointmentView(app, UserModel, OrganizationModel);
    myOrganizationsView(app, UserModel, OrganizationModel);
    myBookingsView(app, UserModel, OrganizationModel);
    settingsView(app, UserModel, OrganizationModel);
    getOnlyViews(app, UserModel, OrganizationModel);
    postOnlyViews(app, UserModel, OrganizationModel);
}

function myBookingsView(app, User, Organization) {
    app.route("/home/my-bookings")

    .get(async (req, res) => {

        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {

            const query = req.query.query;

            if (query === 'upcoming') {

                const userObj = await User.findOne({_id: req.user.id});
                const today = new Date();

                let allMyBookings = [];

                if (userObj.my_bookings.length !== 0) {
                    
                    for (let myBookingObj of userObj.my_bookings) {
    
                        if (utilPatches.checkIfDateFromFuture(myBookingObj.date, false)) {
                            allMyBookings.push(myBookingObj);
                        }
                        
                        else if (myBookingObj.date.toDateString() === today.toDateString()) {
                            if (orgValidator.compareTime(myBookingObj.start_time, [today.getHours(), today.getMinutes()], 3)) {
                                allMyBookings.push(myBookingObj);
                            }
                        }
                    }

                    if (allMyBookings.length > 0) {
                        allMyBookings = utilPatches.sortMyBookingByDateAndStartTime(allMyBookings, 1);
                        allMyBookings = utilPatches.addMonthStamps(allMyBookings);
                        allMyBookings = await utilPatches.getEjsFormat(allMyBookings, Organization, 1);
                    }
                    
                }

                res.render("home/my_bookings.ejs", {instance: 1, result: allMyBookings});
            
            } else if (query === 'recent') {

                const userObj = await User.findOne({_id: req.user.id});
                const today = new Date();

                let allMyBookings = [];

                if (userObj.my_bookings.length !== 0) {
                    
                    for (let myBookingObj of userObj.my_bookings) {
    
                        if (!utilPatches.checkIfDateFromFuture(myBookingObj.date, true)) {
                            allMyBookings.push(myBookingObj);
                        }
                        
                        else if (myBookingObj.date.toDateString() === today.toDateString()) {
                            if (orgValidator.compareTime(myBookingObj.start_time, [today.getHours(), today.getMinutes()], 1)) {
                                allMyBookings.push(myBookingObj);
                            }
                        }
                    }

                    if (allMyBookings.length > 0) {
                        allMyBookings = utilPatches.sortMyBookingByDateAndStartTime(allMyBookings, 2);
                        allMyBookings = utilPatches.addMonthStamps(allMyBookings);
                        allMyBookings = await utilPatches.getEjsFormat(allMyBookings, Organization, 2);
                    }
                    
                }

                res.render("home/my_bookings.ejs", {instance: 2, result: allMyBookings});

            } else {
                res.redirect('/home/my-bookings?query=upcoming')
            }

        }
    })

    app.route("/home/my-bookings/cancel")

    .post(async (req, res) => {

        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {

            const booking_id = req.body.booking_id;

            if (booking_id === undefined) {
                res.status(404).send();
            } else {
                
                const userObj = await User.findOne({_id: req.user.id});
                
                let myBookingObj = null;
                for (let obj of userObj.my_bookings) {
                    
                    if (obj.booking_id.toString() === booking_id && obj.status === 1) {
                        myBookingObj = obj;
                        break;
                    }
                }
                
                const today = new Date();

                if (myBookingObj === null) {
                    res.status(404).send();
                } else if (myBookingObj.status === 2) {
                    res.status(404).send();
                } else if (!utilPatches.checkIfDateFromFuture(myBookingObj.date, true)) {
                    res.status(404).send();
                } else if (myBookingObj.date.toDateString() === today.toDateString() && orgValidator.compareTime(myBookingObj.start_time, [today.getHours(), today.getMinutes()], 1)) {
                    res.status(404).send();
                } else {

                    const orgObj = await Organization.findOne({_id: myBookingObj.org_id});

                    for (let i in orgObj.bookings) {
                        if (orgObj.bookings[i].id.toString() === booking_id) {
                            orgObj.bookings.splice(i, 1);
                            break;
                        }
                    }

                    
                    myBookingObj.status = 2;
                    userObj.markModified('my_bookings');
                    
                    await orgObj.save();
                    await userObj.save();

                    res.redirect('/home/my-bookings?query=upcoming');
                }
            }


        }
    })
}

function bookAppointmentView(app, User, Organization) {
    app.route("/home/book-appointment")

    .get(async (req, res) => {

        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {
            if (req.query.msg === 'bookingfailed') {
                res.render("home/book_appointment.ejs", {error_msg: "Booking failed", org_name_before: null, booking_date_before: null, result_header: null, search_result: null, _: _});
            } else {
                res.render("home/book_appointment.ejs", {error_msg: null, org_name_before: null, booking_date_before: null, result_header: null, search_result: null, _: _});
            }
        }
    })

    .post(async (req, res) => {

        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {
            
            const validator = await bookingValidator.validate(req, Organization);
            validator.template_vars._ = _;
            res.render("home/book_appointment.ejs", validator.template_vars);
            
        }
    })

    app.route("/home/book-appointment/search-organization")

    .get(async (req, res) => {

        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {

            const name_search = req.query.name;

            if (name_search) {
                const result = await Organization.find({name: { '$regex': `^${name_search}`, '$options': 'i' }, status: 2});
                
                let returnNames = [];
                for (let x of result) returnNames.push(_.startCase(x.name));

                res.send(returnNames);
            } else {
                res.status(200).send([]);
            }
        }
    })

    app.route("/home/book-appointment/book")

    .post(async (req, res) => {

        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {

            const validator = await bookingValidator.validate(req, Organization);
            if (!validator.is_valid) {
                res.redirect('/home/book-appointment?msg=bookingfailed');
            } else {

                const slot_no = req.body.slot_no;

                let found = false;
                for (let slotObj of validator.template_vars.search_result) {
                    if (slotObj.slot_no == slot_no) found = true;
                }

                if (!found) {
                    res.redirect('/home/book-appointment?msg=bookingfailed');
                } else {

                    const existingBookingNumber = bookingValidator.getExistingBookingNumber(validator.orgObj, validator.date, slot_no);
                    const slot_details = validator.orgObj.working_hours[validator.date.getDay()][slot_no - 1 - validator.deletedNum];
                    if (existingBookingNumber === Number(slot_details[3])) {
                        res.redirect('/home/book-appointment?msg=bookingfailed');
                    } else {

                        const bookingId = new mongoose.mongo.ObjectId();

                        const bookingObj = {
                            id: bookingId,
                            user: req.user.id,
                            date: validator.date,
                            slot_no: Number(slot_no),
                        };
                        
                        const myBookingObj = {
                            booking_id: bookingId,
                            org_id: validator.orgObj.id,
                            status: 1,
                            date: validator.date,
                            start_time: slot_details[0],
                            end_time: slot_details[1],
                            price: slot_details[2],
                        };

                        const userObj = await User.findOne({_id: req.user.id});
    
                        validator.orgObj.bookings.push(bookingObj);
                        userObj.my_bookings.push(myBookingObj);
                        await validator.orgObj.save();
                        await userObj.save();
                        
                        res.render("home/booked.ejs", {org_name: _.startCase(validator.orgObj.name), date_string: validator.date.toDateString(), time: `${utilPatches.addZeroToStart(slot_details[0][0])}:${utilPatches.addZeroToStart(slot_details[0][1])} - ${utilPatches.addZeroToStart(slot_details[1][0])}:${utilPatches.addZeroToStart(slot_details[1][1])}`, price: slot_details[2]});
                    }

                }

            }

        }
    })
}

function myOrganizationsView(app, User, Organization) {
    app.route("/home/my-organizations")

    .get(async (req, res) => {
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {
            const resultDB = await Organization.find({admin: req.user.id});
            let result = [];
            
            for (let x of resultDB) {
                result.push({name: x.name, created_on: x.created_on, status: x.status})
            }

            res.render("home/my_organizations.ejs", {myOrgs: result});
        }
    })
    
    app.route("/home/my-organizations/create-org")
    
    .get(async (req, res) => {
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {
            res.render("home/create_org.ejs", {error_msg: null});
        }
    })

    .post(async (req, res) => {
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {
            const validator = await orgValidator.create(req, res, User, Organization, false, null);

            if (validator.is_valid) {

                const org = new Organization({
                    admin: req.user.id,
                    name: validator.data.name,
                    working_hours: validator.data.working_hours,
                    status: validator.data.status,
                    created_on: new Date()
                });
                await org.save();

                res.redirect('/home/my-organizations');


            } else {
                res.render("home/create_org.ejs", {error_msg: validator.err_msg});
            }
        }
    })

    app.route("/home/my-organizations/:name")
    
    .get(async (req, res) => {
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {
            const orgObj = await Organization.findOne({name: req.params.name.toLowerCase(), admin: req.user.id});
            if (!orgObj) {
                res.status(404).send();
            } else {

                const returnValue = utilPatches.SingleOrgGetDetails(orgObj)
                if (req.query.flag == 1) {
                    res.render("home/single_org.ejs", {org_name: _.startCase(req.params.name), weeklySchedule: orgObj.working_hours, upcomingHolidays : returnValue.upcomingHolidays, recentHolidays : returnValue.recentHolidays, addHolidayErrorMsg: '', all_bookings_error_msg: "Invalid Date!"});
                } else {
                    res.render("home/single_org.ejs", {org_name: _.startCase(req.params.name), weeklySchedule: orgObj.working_hours, upcomingHolidays : returnValue.upcomingHolidays, recentHolidays : returnValue.recentHolidays, addHolidayErrorMsg: '', all_bookings_error_msg: null});
                }
            }
        }
    })
    
    .post(async (req, res) => {
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {
            let orgObj = await Organization.findOne({name: req.params.name.toLowerCase(), admin: req.user.id});
            if (!orgObj) {
                res.status(404).send();
            } else {

                const validator = holidayValidator.validate(req.body, orgObj);
                
                if (validator.is_valid) {
                    await validator.save(User); 
                    res.redirect(`/home/my-organizations/${orgObj.name.toLowerCase()}`);
                } else {
                    const returnValue = utilPatches.SingleOrgGetDetails(orgObj)
                    res.render("home/single_org.ejs", {org_name: _.startCase(req.params.name), weeklySchedule: orgObj.working_hours, upcomingHolidays : returnValue.upcomingHolidays, recentHolidays : returnValue.recentHolidays, addHolidayErrorMsg: validator.err_msg, all_bookings_error_msg: null});
                }
                
            }
        }
    })

    app.route("/home/my-organizations/:name/delete-org")
    
    .post(async (req, res) => {
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {
            const orgObj = await Organization.findOne({name: req.params.name.toLowerCase(), admin: req.user.id});
            if (!orgObj) {
                res.status(404).send();
            } else {

                for (let bookingObj of orgObj.bookings) {
                    
                    const clientObj = await User.findOne({_id: bookingObj.user});

                    for (let clientBookingObj of clientObj.my_bookings) {
                        if (clientBookingObj.booking_id.toString() === bookingObj.id.toString()) {
                            clientBookingObj.status = 2;
                            email.sendEmailOrgDeleted(clientObj.username, orgObj, bookingObj);
                            break;
                        }
                    }

                    clientObj.markModified('my_bookings');
                    await clientObj.save();
                    
                }

                await Organization.findByIdAndDelete(orgObj._id);

                res.redirect("/home/my-organizations/");
            }
        }
    })

    app.route("/home/my-organizations/:name/all-bookings")

    .get(async (req, res) => {
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {
            const orgObj = await Organization.findOne({name: req.params.name.toLowerCase(), admin: req.user.id});
            if (!orgObj) {
                res.status(404).send();
            } else {

                const date = new Date(req.query.date);

                if (date == "Invalid Date") {
                    res.redirect(`/home/my-organizations/${orgObj.name}?flag=1`);
                } else {

                    const contentObj = await utilPatches.getAllBookingsData(date, orgObj, User);

                    if (req.query.flag === '1') contentObj.error = true; 
                    else contentObj.error = false;

                    res.render("home/all_bookings.ejs", contentObj);
                }

            }
        }
    })

    app.route("/home/my-organizations/:name/all-bookings/cancel-one")

    .post(async (req, res) => {
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {
            const orgObj = await Organization.findOne({name: req.params.name.toLowerCase(), admin: req.user.id});
            if (!orgObj) {
                res.status(404).send();
            } else {

                const id = req.body.id;
                const date = req.body.date;

                let bookingObj = null;
                let count = 0;
                for (let obj of orgObj.bookings) {
                    if (obj.id.toString() === id) {
                        bookingObj = obj;
                        orgObj.bookings.splice(count, 1);
                        break;
                    }
                    count++;
                }

                if (bookingObj === null) {
                    res.redirect(`/home/my-organizations/${orgObj.name}/all-bookings?date=${date}&flag=1`);
                } else {

                    await orgObj.save();

                    const clientObj = await User.findOne({_id: bookingObj.user});

                    for (let clientBookingObj of clientObj.my_bookings) {
                        if (clientBookingObj.booking_id.toString() === id) {
                            clientBookingObj.status = 2;
                            email.sendEmailBookingCancelled(clientObj.username, orgObj, bookingObj);
                            break;
                        }
                    }

                    clientObj.markModified('my_bookings');
                    await clientObj.save();

                    res.redirect(`/home/my-organizations/${orgObj.name}/all-bookings?date=${date}`);
                }

            }
        }
    })

    app.route("/home/my-organizations/:name/edit")

    .get(async (req, res) => {
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {
            const orgObj = await Organization.findOne({name: req.params.name.toLowerCase(), admin: req.user.id});
            if (!orgObj) {
                res.status(404).send();
            } else {

                res.render("home/single_org_edit.ejs", {org_name: _.startCase(req.params.name), error_msg: null, orgObj: orgObj, addZero: utilPatches.addZeroToStart});
            }
        }
    })

    .post(async (req, res) => {
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {
            const orgObj = await Organization.findOne({name: req.params.name.toLowerCase(), admin: req.user.id});
            if (!orgObj) {
                res.status(404).send();
            } else {

                const validator = await orgValidator.create(req, res, User, Organization, true, orgObj.name);

                if (validator.is_valid) {

                    const whOld = orgObj.working_hours;
                    const whNew = validator.data.working_hours;

                    let updatedDays = [];
                    for (let i=0; i<7; i++) {
                        if (JSON.stringify(whOld[i]) !== JSON.stringify(whNew[i])) {
                            updatedDays.push(i);
                        }
                    }

                    if (updatedDays.length > 0) {

                        // Delete all exisiting bookings and send email to client
                        let deletedNum = 0;
                        let initialLength = orgObj.bookings.length;

                        for (let i=0; i<initialLength; i++) {

                            const bookingObj = orgObj.bookings[i - deletedNum];

                            if (bookingObj === undefined) break;

                            let bookingDate = bookingObj.date;

                            const userObj = await User.findOne({_id: bookingObj.user});

                            if (utilPatches.checkIfDateFromFuture(bookingDate, true) && updatedDays.includes(bookingDate.getDay())) {

                                // change status of myBookingObj in userObj
                                for (let myBookingObj of userObj.my_bookings) {

                                    if (myBookingObj.booking_id.toString() === bookingObj.id.toString()) {
                                        myBookingObj.status = 2;
                                        break;
                                    }
                                }
                                userObj.markModified('my_bookings');
                                await userObj.save();
                                
                                mailClient.sendEmailBookingCancelled(userObj.username, orgObj, bookingObj);
                                
                                orgObj.bookings.splice(i - deletedNum, 1);
                                deletedNum++;
                            }
                        }
    
                        // Update working_hours of orgObj
                        orgObj.working_hours = validator.data.working_hours;

                        // Delete special_holidays on edited day
                        deletedNum = 0;
                        initialLength = orgObj.special_holidays.length;

                        for (let i=0; i<initialLength; i++) {
                            
                            const holidayObj = orgObj.special_holidays[i - deletedNum];

                            if (holidayObj === undefined) break;

                            if (updatedDays.includes(holidayObj.date.getDay())) {
                                orgObj.special_holidays.splice(i - deletedNum, 1);
                                deletedNum++;
                            }
                        }
    
                    }

                    // Update the status if or if not changed
                    orgObj.status = validator.data.status;

                    await orgObj.save();

                    res.redirect('/home/my-organizations');

                } else {
                    res.render("home/single_org_edit.ejs", {org_name: _.startCase(req.params.name), error_msg: validator.err_msg, orgObj: orgObj, addZero: utilPatches.addZeroToStart});
                }

            }
            
        }
    })

}

function settingsView(app, User, Organization) {
    app.route("/home/settings")

    .get(async (req, res) => {
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {
            res.render("home/settings.ejs");
        }
    })
    
    app.route("/home/settings/delete-account")

    .post(async (req, res) => {
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {

            const userObj = await User.findOne({_id: req.user.id});

            let cancelledBookings = [];

            for (let myBookingObj of userObj.my_bookings) {

                if (myBookingObj.status === 2) continue;

                const orgObj = await Organization.findOne({_id: myBookingObj.org_id});

                for (let i=0; i<orgObj.bookings.length; i++) {
                    if (orgObj.bookings[i].id.toString() === myBookingObj.booking_id.toString()) {
                        cancelledBookings.push({
                            org_name: _.startCase(orgObj.name),
                            date: myBookingObj.date.toDateString(),
                            time: `${utilPatches.addZeroToStart(myBookingObj.start_time[0])}:${utilPatches.addZeroToStart(myBookingObj.start_time[1])} - ${utilPatches.addZeroToStart(myBookingObj.end_time[0])}:${utilPatches.addZeroToStart(myBookingObj.end_time[1])}`,
                            price: myBookingObj.price,
                        });
                        orgObj.bookings.splice(i, 1);
                        break;
                    }
                }
            
                await orgObj.save();

            }

            console.log(cancelledBookings);
            email.sendEmailUserDeleted(userObj.username, cancelledBookings);
 
            await User.findByIdAndDelete(userObj._id);

            res.redirect("/auth/login/");
        }
    })
}

function getOnlyViews(app, User, Organization) {

    app.get("/home/my-organizations/create-org/check-name-exist", async (req, res) => {
        if (req.query.name === undefined) {
            res.status(400).json("'name' should be a query param.");
        } else {
            const orgObj = await Organization.findOne({name: req.query.name.toLowerCase()});

            if (orgObj) {
                res.status(200).json({exist: true, name: req.query.name.toLowerCase()});
            } else {
                res.status(200).json({exist: false, name: req.query.name.toLowerCase()});
            }
        }
    })
}

function postOnlyViews(app, User, Organization) {

    app.post("/home/my-organizations/:name/delete-holiday", async (req, res) => {
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, is_rest: true, rest_err_msg: "Access denied!"});
        if (authenticater) {
            const orgObj = await Organization.findOne({name: req.params.name.toLowerCase(), admin: req.user.id});
            if (!orgObj) {
                res.status(404).send();
            } else {

                const date = req.body.date;
                let dateArrayInitial = date.split(" ");

                if (dateArrayInitial.length !== 2) res.status(400).json({msg: "Invalid date."});
                else {
                    let dateArrayFinal = dateArrayInitial[1].split("/");
                    if (dateArrayFinal.length !== 3) res.status(400).json({msg: "Invalid date."});
                    else {
                        
                        let error = false;
                        for (let x in dateArrayFinal) {
                            if (isNaN(dateArrayFinal[x])) {
                                error = true;
                            } else dateArrayFinal[x] = Number(dateArrayFinal[x]);
                        }

                        if (error) res.status(400).json({msg: "Invalid date."});
                        else {
                            let dateObj = new Date(`${dateArrayFinal[2]}-${dateArrayFinal[1] < 10 ? `0${dateArrayFinal[1]}` : dateArrayFinal[1]}-${dateArrayFinal[0] < 10 ? `0${dateArrayFinal[0]}` : dateArrayFinal[0]}T00:00:00.000+00:00`);
                            if (dateObj == "Invalid Date") res.status(400).json({msg: "Invalid date."});
                            else {
                                if (!utilPatches.checkIfDateFromFuture(dateObj, false)) res.status(400).json({msg: "Date should be from the future."});
                                else {
                                    const result = await Organization.updateOne({ _id: orgObj._id }, {
                                        $pull: {
                                            special_holidays: {date: dateObj},
                                        },
                                    });

                                    if (result.modifiedCount === 1) res.status(200).json({msg: "Successfully deleted."});
                                    else res.status(400).json({msg: "The date is not a holiday."});
                                }
                            }
                        }
                    }
                }
                
            }
        }
    })
}