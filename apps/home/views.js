
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

        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: '/auth/login?invalid=2'});
        if (authenticater) {
            res.render("home/book_appointment.ejs");
        }
    })

    app.route("/home/book-appointment/search-organization")
    // Return organization with active status.

    .get(async (req, res) => {

        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: '/auth/login?invalid=2'});
        if (authenticater) {

            const name_search = req.query.name;

            if (name_search) {
                const result = await Organization.find({name: { '$regex': `^${name_search}`, '$options': 'i' }});
                
                let returnNames = [];
                for (let x of result) returnNames.push(_.startCase(x.name));

                res.send(returnNames);
            } else {
                res.status(200).send([]);
            }

            // res.render("home/book_appointment.ejs");
        }
    })
}

function myOrganizationsView(app, User, Organization) {
    app.route("/home/my-organizations")

    .get(async (req, res) => {
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: '/auth/login?invalid=2'});
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
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: '/auth/login?invalid=2'});
        if (authenticater) {
            res.render("home/create_org.ejs", {error_msg: null});
        }
    })

    .post(async (req, res) => {
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: '/auth/login?invalid=2'});
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
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: '/auth/login?invalid=2'});
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
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: '/auth/login?invalid=2'});
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
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: '/auth/login?invalid=2'});
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
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: '/auth/login?invalid=2'});
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
                                if (!utilPatches.checkIfDateFromFuture(dateObj)) res.status(400).json({msg: "Date should be from the future."});
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