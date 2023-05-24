
module.exports = {initialize: initializeViews};

const viewAuthenticator = require('../../utils/view_authenticator.js');

function initializeViews(app, passport, UserModel) {
    bookAppointmentView(app, UserModel);
    myOrganizationsView(app, UserModel);
    settingsView(app, UserModel);
    getOnlyViews(app, UserModel);
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

function myOrganizationsView(app, User) {
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
            res.render("home/create_org.ejs");
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

function getOnlyViews(app, User) {
    app.route("/home/my-organisations/check-name-exist")

    .get(async (req, res) => {
        res.send({exist: true, name: req.query.name});

    })
}