
module.exports = {initialize: initializeViews};

function initializeViews(app, passport, UserModel) {
    bookAppointment(app, UserModel);
    myOrganizations(app, UserModel);
    settings(app, UserModel);
}

function bookAppointment(app, User) {
    app.route("/home/book-appointment")

    .get((req, res) => {
        res.render("home/book_appointment.ejs");
    })
}

function myOrganizations(app, User) {
    app.route("/home/my-organizations")

    .get((req, res) => {
        res.render("home/my_organizations.ejs");
    })
}

function settings(app, User) {
    app.route("/home/settings")

    .get((req, res) => {
        res.render("home/settings.ejs");
    })
}