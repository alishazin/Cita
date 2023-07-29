
module.exports = {initialize: initializeViews};

const crypto = require('crypto');
const mailClient = require('../../utils/email.js');
const viewAuthenticator = require('../../utils/view_authenticator.js');
const { authenticate } = require('passport');

const VERIFICATION_TIMEOUT_IN_MIN = 10;
const PASS_RESET_TIMEOUT_IN_MIN = 30;

function initializeViews(app, passport, UserModel) {
    signUpView(app, UserModel);
    verificationView(app, passport, UserModel);
    googleSignIn(app, passport, UserModel);
    LogInView(app, passport, UserModel);
    forgotPasswordView(app, passport, UserModel);
    changePasswordView(app, passport, UserModel);
    logoutView(app, passport);
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
                    reset_password: false,
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
    
    app.route("/auth/email_verification/:verification_id")

    .get(async (req, res) => {
        const userObj = await User.findOne({"verification_id.id" : req.params.verification_id});
        
        if (userObj) {
            const differenceInMinutes = Math.floor((new Date() - userObj.verification_id.date_generated) / (1000 * 60)); 
            if (differenceInMinutes >= VERIFICATION_TIMEOUT_IN_MIN) {
                await User.findOneAndRemove({_id: userObj._id});
                res.render("auth/email_timeout.ejs", {keyword: "Email verification"});
            } else {
                userObj.verification_id = null;
                userObj.verified = true;
                await userObj.save();
                res.render("auth/email_success.ejs", {keyword: "Email verification"});
            }
        } else {
            res.status(404);
            res.send();
        }
    })

}

function googleSignIn(app, passport, User) {
    app.get(
        '/auth/signup/google',
        passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    app.get(
        '/auth/signup/google/callback', 
        passport.authenticate('google', { failureRedirect: '/auth/signup/google/failed', successRedirect: '/test' })
    );

    app.get("/test", async (req, res) => {
        res.send(req.user);
    })

    app.get("/auth/signup/google/failed", (req, res) => {
        res.render("auth/signup_duplicate_user.ejs");
    })
}

function LogInView(app, passport, User) {

    app.route("/auth/login")

    .get(async (req, res) => {
        if (req.query.invalid === '1') {
            res.render("auth/login.ejs", {errorMsg: "Invalid credentials."});
        } else if (req.query.invalid === '2') {
            res.render("auth/login.ejs", {errorMsg: "Unauthorized access."});
        } else if (req.query.invalid === '3') {
            res.render("auth/login.ejs", {errorMsg: "Password changed successfully."});
        } else {
            res.render("auth/login.ejs", {errorMsg: null});
        }
    })

    .post(async (req, res) => {
        const username = req.body.username.trim().toLowerCase();

        let redirect = req.query.redirect;

        const userObj = await User.findOne({username: username});

        if (!userObj) {
            res.render("auth/login.ejs", {errorMsg: "User does not exist!"});
        } else if (userObj.provider == "google") {
            res.render("auth/login.ejs", {errorMsg: "Log in using google."});
        } else if (userObj.verified == false) {
            const differenceInMinutes = Math.floor((new Date() - userObj.verification_id.date_generated) / (1000 * 60)); 
            if (differenceInMinutes >= VERIFICATION_TIMEOUT_IN_MIN) {
                await User.findOneAndRemove({_id: userObj._id});
                res.render("auth/login.ejs", {errorMsg: "User does not exist!"});
            } else {
                res.render("auth/login.ejs", {errorMsg: "User email is not verified. Check your email."});
            }
        } else {
            passport.authenticate("local", { failureRedirect: '/auth/login?invalid=1', failureMessage: true })(req, res, function() {
                if (redirect) res.redirect(redirect);
                else res.redirect("/test");
            });
        }
    });
}

function forgotPasswordView(app, passport, User) {

    app.route("/auth/forgot-password")

    .get((req, res) => {
        res.render("auth/forgot_pass_1.ejs", {errorMsg: null});
    })
    
    .post(async (req, res) => {
        const username = req.body.username.trim().toLowerCase();
        
        const userObj = await User.findOne({username: username});
        
        if (!userObj) {
            res.render("auth/forgot_pass_1.ejs", {errorMsg: "User does not exist!"});
        } else if (userObj.provider === "google") {
            res.render("auth/forgot_pass_1.ejs", {errorMsg: "User is authenticated using google."});
        } else if (userObj.verified === false) {
            res.render("auth/forgot_pass_1.ejs", {errorMsg: "User email is not verified."});
        } else {
            const UUID = crypto.randomUUID();
            userObj.reset_password = {
                token: UUID,
                date_generated: new Date(),
            }
            await userObj.save();
            mailClient.sendEmailResetPass(userObj.username, UUID);
            res.render("auth/forgot_pass_2.ejs", {email: userObj.username});
        }
    })


    app.route("/auth/reset-password/:token")

    .get(async (req, res) => {
        const token = req.params.token;

        const userObj = await User.findOne({"reset_password.token": token});

        if (userObj) {
            const differenceInMinutes = Math.floor((new Date() - userObj.reset_password.date_generated) / (1000 * 60)); 
            if (differenceInMinutes >= PASS_RESET_TIMEOUT_IN_MIN) {
                userObj.reset_password = null;
                await userObj.save();
                res.render("auth/email_timeout.ejs", {keyword: "Password reset"});
            } else {
                res.render("auth/forgot_pass_3.ejs", {errorMsg: null});
            }
        } else {
            res.status(404);
            res.send();
        }
    })

    .post(async (req, res) => {
        const token = req.params.token;

        const userObj = await User.findOne({"reset_password.token": token});

        if (userObj) {
            const differenceInMinutes = Math.floor((new Date() - userObj.reset_password.date_generated) / (1000 * 60)); 
            if (differenceInMinutes >= PASS_RESET_TIMEOUT_IN_MIN) {
                userObj.reset_password = null;
                await userObj.save();
                res.render("auth/email_timeout.ejs", {keyword: "Password reset"});
            } else {
                const password = req.body.new_password;
                const confirm_password = req.body.confirm_password;
                
                if (password.length < 8 || confirm_password.length < 8) {
                    res.render("auth/forgot_pass_3.ejs", {errorMsg: "Password should have atleast 8 characters."});
                } else if (password !== confirm_password) {
                    res.render("auth/forgot_pass_3.ejs", {errorMsg: "Confirm password does not match!"});
                } else {
                    userObj.reset_password = null;
                    userObj.setPassword(password, async function(){
                        await userObj.save();
                        res.render("auth/forgot_pass_4.ejs");
                    });
                }
            }
        } else {
            res.status(404);
            res.send();
        }
    });

}

function changePasswordView(app, passport, User) {
    app.route("/auth/change-password")

    .get(async (req, res) => {
        const authenticater = await viewAuthenticator({req:req, res:res, UserModel:User, unauthenticatedRedirect:`/auth/login?invalid=2&redirect=${req.url}`, providers:["local"], invalidProviderRender:'auth/change_pass_err.ejs'});
        if (authenticater) {
            res.render("auth/change_pass.ejs", {errorMsg: null});
        }
    })
    
    .post(async (req, res) => {
        const authenticater = await viewAuthenticator({req:req, res:res, UserModel:User, unauthenticatedRedirect:`/auth/login?invalid=2&redirect=${req.url}`, providers:["local"], invalidProviderRender:'auth/change_pass_err.ejs'});
        if (authenticater) {
            
            const old_password = req.body.old_password;
            const new_password = req.body.new_password;
            
            if (new_password.length < 8) {
                res.render("auth/change_pass.ejs", {errorMsg: "Password should have atleast 8 characters."});
            } else {
                
                const userObj = await User.findOne({_id: req.user.id});
                
                userObj.changePassword(old_password, new_password, (err) => {
                    if (err) {
                        res.render("auth/change_pass.ejs", {errorMsg: "Old password is incorrect."});
                    } else {
                        req.logout((err) => {
                            if (err) {
                                res.send(err);
                            } else {
                                res.redirect("/auth/login?invalid=3");
                            }
                        });
                    }
                });
            }
        }
    });
}

function logoutView(app, passport) {
    
    app.get("/auth/logout", (req, res) => {
        req.logout((err) => {
            if (err) {
                res.send(err);
            } else {
                res.redirect("/auth/login");
            }
        });
    })

}