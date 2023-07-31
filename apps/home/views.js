
module.exports = {initialize: initializeViews};

const viewAuthenticator = require('../../utils/view_authenticator.js');
const orgValidator = require('../../utils/org_validator.js');
const holidayValidator = require('../../utils/holiday_validator.js');
const utilPatches = require('../../utils/patches.js');
const _ = require('lodash');

function initializeViews(app, passport, UserModel, OrganizationModel) {
    bookAppointmentView(app, UserModel, OrganizationModel);
    myOrganizationsView(app, UserModel, OrganizationModel);
    settingsView(app, UserModel);
    getOnlyViews(app, UserModel, OrganizationModel);
    postOnlyViews(app, UserModel, OrganizationModel);
}

function bookAppointmentView(app, User, Organization) {
    app.route("/home/book-appointment")

    .get(async (req, res) => {

        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {
            res.render("home/book_appointment.ejs", {error_msg: null, org_name_before: null, booking_date_before: null, result_header: null, search_result: null});
        }
    })

    .post(async (req, res) => {

        const getDateForInputValue = (booking_date) => {
            return `${booking_date.getFullYear()}-${utilPatches.addZeroToStart(booking_date.getMonth() + 1)}-${utilPatches.addZeroToStart(booking_date.getDate())}`
        }

        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {

            let org_name = req.body.org_name;
            let booking_date = req.body.booking_date;

            if (!org_name || !booking_date) {
                res.render("home/book_appointment.ejs", {error_msg: "Something went wrong, refresh the page and try again.", org_name_before: null, booking_date_before: null, result_header: null, search_result: null});
            } else {

                // booking_date validation
                booking_date = new Date(booking_date);
                if (booking_date == "Invalid Date") {
                    res.render("home/book_appointment.ejs", {error_msg: "Invalid date.", org_name_before: null, booking_date_before: null, result_header: null, search_result: null});
                } else if (!utilPatches.checkIfDateFromFuture(booking_date, true)) {
                    res.render("home/book_appointment.ejs", {error_msg: "Date shouldn't be from the past.", org_name_before: null, booking_date_before: null, result_header: null, search_result: null});
                } else {

                    // org_name validation
                    org_name = String(org_name).trim().toLowerCase();
                    const orgObj = await Organization.findOne({name: org_name, status: 2});
                    
                    if (orgObj === null) {
                        res.render("home/book_appointment.ejs", {error_msg: "Organization with the given name does not exist.", org_name_before: org_name, booking_date_before: getDateForInputValue(booking_date), result_header: null, search_result: null});
                    } else {
                        
                        // Checking availability
                        
                        // checking all slots
                        const allSlots = orgObj.working_hours[booking_date.getDay()];
                        if (allSlots === null) {
                            res.render("home/book_appointment.ejs", {error_msg: null, org_name_before: org_name, booking_date_before: getDateForInputValue(booking_date), result_header: "Not open for appointments.", search_result: null});
                        } else {
                            
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
                                res.render("home/book_appointment.ejs", {error_msg: null, org_name_before: org_name, booking_date_before: getDateForInputValue(booking_date), result_header: "Not open for appointments.", search_result: null});
                            } else {

                                let availableSlots = [];
                                for (let x=0; x<allSlots.length; x++) {
                                    if (unavailable_slots.includes(x+1)) continue;
                                    else {
                                        availableSlots.push({slot_no: x+1, from_time: allSlots[x][0], to_time: allSlots[x][1], price: allSlots[x][2], remaining: allSlots[x][3]});
                                    }
                                }

                                console.log(availableSlots);

                                res.render("home/book_appointment.ejs", {error_msg: null, org_name_before: org_name, booking_date_before: getDateForInputValue(booking_date), result_header: "Search result", search_result: availableSlots, addZero: utilPatches.addZeroToStart});
                            }

                        }

                    }
                }
            }
        }
    })

    app.route("/home/book-appointment/search-organization")
    // Return organization with active status.

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

            // Checking everything again and add to db (make a plan)

            console.log(req.body);

            res.send("AAA");
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
            const validator = await orgValidator.create(req, res, User, Organization);

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
                res.render("home/single_org.ejs", {org_name: _.capitalize(req.params.name), weeklySchedule: orgObj.working_hours, upcomingHolidays : returnValue.upcomingHolidays, recentHolidays : returnValue.recentHolidays, addHolidayErrorMsg: ''});
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
                    await validator.save(); 
                    res.redirect(`/home/my-organizations/${orgObj.name.toLowerCase()}`);
                } else {
                    const returnValue = utilPatches.SingleOrgGetDetails(orgObj)
                    res.render("home/single_org.ejs", {org_name: _.capitalize(req.params.name), weeklySchedule: orgObj.working_hours, upcomingHolidays : returnValue.upcomingHolidays, recentHolidays : returnValue.recentHolidays, addHolidayErrorMsg: validator.err_msg});
                }
                
            }
        }
    })
}

function settingsView(app, User) {
    app.route("/home/settings")

    .get(async (req, res) => {
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: `/auth/login?invalid=2&redirect=${req.url}`});
        if (authenticater) {
            res.render("home/settings.ejs");
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