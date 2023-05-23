
module.exports = async function(options) {

    // parameter handling

    allParams = ['req', 'res', 'UserModel', 'authenticated', 'unauthenticatedRedirect', 'providers', 'invalidProviderRender']

    defaultParams = {
        authenticated: true,
        unauthenticatedRedirect: null,
        providers: ["local", "google"],
        invalidProviderRender: null
    }

    for (let x of allParams) {
        if (options[x] === undefined) {
            if (defaultParams[x] === undefined) {
                console.log("Invalid parameter in view_authenticator");
                return false;
            } else {
                options[x] = defaultParams[x]
            }
        } 
    }

    // ----------------------------------------------

    if (options.authenticated === true && options.req.isAuthenticated() === false) {
        options.res.redirect(options.unauthenticatedRedirect);
        return false;
    } else {
        const userObj = await options.UserModel.findOne({_id: options.req.user.id});

        error = true;
        for (let x of options.providers) {
            if (userObj.provider === x) {
                error = false;
                break;
            }
        }

        if (error) {
            options.res.render(options.invalidProviderRender);
            return false;
        }
    }

    return true;
}