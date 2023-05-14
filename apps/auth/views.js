
module.exports = {initialize: initializeUrls};

function initializeUrls(app) {

    app.get("/signup", async (req, res) => {
        res.render("auth/signup");
    });

}