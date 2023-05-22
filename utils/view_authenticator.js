
module.exports = async function(req, res, UserModel, authenticated, unauthenticatedRedirect, providers, invalidProviderRender) {
    if (authenticated === true && req.isAuthenticated() === false) {
        res.redirect(unauthenticatedRedirect);
        return false;
    } else {
        const userObj = await UserModel.findOne({_id: req.user.id});

        error = false;
        for (let x of providers) {
            if (userObj.provider !== x) {
                error = true;
            }   
        }

        if (error) {
            res.render(invalidProviderRender);
            return false;
        }
    }

    return true;
}