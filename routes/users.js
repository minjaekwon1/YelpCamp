const express = require('express');
const router = express.Router();
// For error handling
const catchAsync = require('../utilities/catchAsync');
// For authentication & authorization
const passport = require('passport');
// Controllers for proper MVC (separating internal data models from the user interface via the controller and view)
const controllers = require('../controllers/users');

/////////////////////////////// REGISTERING ///////////////////////////////

// Can chain on route handlers that process reqs from the same path
router.route('/register')
    .get(controllers.renderRegisterForm)
    .post(catchAsync(controllers.register));

/////////////////////////////// LOGGING IN ///////////////////////////////

router.route('/login')
    .get(controllers.renderLoginForm)
    // '.authenticate('local')' is MW which will auth the req in Express
    //// Can specify other auth methods such as w/ 'facebook' or 'google'
    // 'failureFlash' will flash a msg for us automatically if auth fails
    // 'failureRedirect' exe 'res.redirect('/login')' auto if auth fails
    .post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), controllers.login);

/////////////////////////////// LOGGING OUT ///////////////////////////////

router.get('/logout', controllers.logout);

module.exports = router;