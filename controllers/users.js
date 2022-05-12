// For 'User' model
const User = require('../models/user');

/////////////////////////////// REGISTERING ///////////////////////////////

module.exports.renderRegisterForm = (req, res) => {
    res.render('users/register');
}

module.exports.register = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        // '.register()' registers (saves to the DB) a new 'User' instance w/ the given 'password' after checking if the 'username' is unique
        const registeredUser = await User.register(user, password);
        // 'passport' adds 'login()' on 'req' to establish a login session
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Yelp Camp!');
            res.redirect('/campgrounds');
        })
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
}

/////////////////////////////// LOGGING IN ///////////////////////////////

module.exports.renderLoginForm = (req, res) => {
    res.render('users/login');
}

module.exports.login = (req, res) => {
    req.flash('success', 'Welcome back!');
    // 'redirectUrl' will contain the path to the page u were at before being asked to log in, or if 'undefined', it'll be '/campgrounds'
    const redirectUrl = req.session.returnTo || '/campgrounds';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

/////////////////////////////// LOGGING OUT ///////////////////////////////

module.exports.logout = (req, res) => {
    // The method, '.logout()', is auto added to the 'req' obj by 'passport' after authentication (logging in) to logout easily
    req.logout();
    req.flash('success', 'Successfully logged out.');
    res.redirect('./campgrounds');
}