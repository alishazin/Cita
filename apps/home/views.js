
module.exports = {initialize: initializeViews};

const viewAuthenticator = require('../../utils/view_authenticator.js');
const orgValidator = require('../../utils/org_validator.js');

function initializeViews(app, passport, UserModel, OrganizationModel) {
    bookAppointmentView(app, UserModel);
    myOrganizationsView(app, UserModel, OrganizationModel);
    settingsView(app, UserModel);
    getOnlyViews(app, UserModel, OrganizationModel);
}

function bookAppointmentView(app, User) {
    app.route("/home/book-appointment")

    .get(async (req, res) => {

        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: '/auth/login?invalid=2'});
        if (authenticater) {
            res.render("home/book_appointment.ejs");
        }
    })
}

function myOrganizationsView(app, User, Organization) {
    app.route("/home/my-organizations")

    .get(async (req, res) => {
        const authenticater = await viewAuthenticator({req: req, res: res, UserModel: User, unauthenticatedRedirect: '/auth/login?invalid=2'});
        if (authenticater) {
            res.render("home/my_organizations.ejs");
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
                });
                await org.save();

                res.redirect('/home/my-organizations');


            } else {
                res.render("home/create_org.ejs", {error_msg: validator.err_msg});
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
    app.route("/home/my-organisations/check-name-exist")

    .get(async (req, res) => {
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