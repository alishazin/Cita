
module.exports = {initialize: initializeViews};

const crypto = require('crypto');
const mailClient = require('../../utils/email.js');

function initializeViews(app, passport, UserModel) {
    signUpView(app, UserModel);
    verificationView(app, passport, UserModel);
    googleSignUp(app, passport, UserModel);
    LogInView(app, passport, UserModel);
}

function signUpView(app, User) {
    
    app.route("/auth/signup")

    .get(async (req, res) => {
        res.render("auth/signup", {errorMsg: null});
    })

    .post(async (req, res) => {
        const fname = req.body.fname;
        const lname = req.body.lname;
        const username = req.body.username;
        const password = req.body.password;
        const confirm_password = req.body.confirm_password;

        const duplicateVerifiedUser = await User.findOne({username: username.trim().toLowerCase(), $or: [{verified: true}, {provider: "google"}]});

        // Deleting Non-Verified User.
        await User.findOneAndRemove({username: username.trim().toLowerCase(), verified: false});

        if (password.trim() !== confirm_password.trim()) {
            res.render("auth/signup.ejs", {errorMsg: "Confirm password does not match!"});
        } else if (duplicateVerifiedUser) {
            res.render("auth/signup.ejs", {errorMsg: "User with email exist!"});
        } else if (password.length < 8) {
            res.render("auth/signup.ejs", {errorMsg: "Password should have atleast 8 characters."});
        } else {
            User.register(
                {
                    firstName: fname,
                    lastName: lname,
                    username: username,
                    verified: false,
                    provider: "local",
                }, 
                password, 
                async function (err, user) {
                    if (err) {
                        res.render("auth/signup.ejs", {errorMsg: err.message});
                    } else {
                        const UUID = crypto.randomUUID();
                        mailClient.sendEmailVerificationMail(user.username, UUID);
                        await User.findOneAndUpdate({_id: user._id}, {verification_id: {id: UUID, date_generated: new Date()}});
                        res.render("auth/email_sent.ejs", {email: user.username});
                    }
            })
        }

    });

}

function verificationView(app, passport, User) {

    const VERIFICATION_TIMEOUT_IN_MIN = 10;
    
    app.route("/auth/email_verification/:verification_id")

    .get(async (req, res) => {
        const userObj = await User.findOne({"verification_id.id" : req.params.verification_id});
        
        if (userObj) {
            const differenceInMinutes = Math.floor((new Date() - userObj.verification_id.date_generated) / (1000 * 60)); 
            if (differenceInMinutes >= VERIFICATION_TIMEOUT_IN_MIN) {
                await User.findOneAndRemove({_id: userObj._id});
                res.render("auth/email_ver_timeout.ejs");
            } else {
                userObj.verification_id = null;
                userObj.verified = true;
                await userObj.save();
                res.render("auth/email_ver_success.ejs");
            }
        } else {
            res.status(404);
            res.send();
        }
    })

}

function googleSignUp(app, passport, User) {
    app.get(
        '/auth/signup/google',
        passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    app.get(
        '/auth/signup/google/callback', 
        passport.authenticate('google', { failureRedirect: '/auth/signup/google/failed', successRedirect: '/test' })
    );

    app.get("/test", (req, res) => {
        res.send(req.user);
    })

    app.get("/auth/signup/google/failed", (req, res) => {
        res.render("auth/signup_duplicate_user.ejs");
    })
}

function LogInView(app, passport, User) {
    // app.get(
    //     '/auth/login/',
    //     (req, res) => passport.authenticate('local', { successRedirect: '/test', failureRedirect: '/auth/signup', })(req, res)
    // );
}
