
module.exports = {initialize: initializeViews};

function initializeViews(app, passport, UserModel) {
    bookAppointment(app, UserModel);
}

function bookAppointment(app, User) {
    app.route("/home/book-appointment")

    .get((req, res) => {
        res.render("home/book_appointment.ejs");
    })
}