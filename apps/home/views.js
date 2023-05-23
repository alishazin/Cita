
module.exports = {initialize: initializeViews};

const viewAuthenticator = require('../../utils/view_authenticator.js');

function initializeViews(app, passport, UserModel) {
    bookAppointmentView(app, UserModel);
    myOrganizationsView(app, UserModel);
    settingsView(app, UserModel);
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