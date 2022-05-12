// For 'Campground' model
const Campground = require('./models/campground');
// For 'Review' model
const Review = require('./models/review');
// For error handling
const ExpressError = require('./utilities/ExpressError');
// For data validation
const { campgroundSchema, reviewSchema } = require('./schemas.js');


////////////////////// DATA VALIDATION FOR CAMPGROUNDS ////////////////////
// MW func that will be used for server-side data validation
// 'joi' lets u build a schema that lays out req'ts for data inputs
module.exports.validateCampground = (req, res, next) => {
    // Uses the schema (from '../schemas.js') to check the 'req.body' and destructures the 'error' prop out of the created obj
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        // Used to pull the err msgs out of 'error' to pass into our custom 'Error' obj (ExpressError)
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        // Must call 'next()' if we want to move on to the rest of the route handler if there is no err
        next();
    }
}

/////////////////////// DATA VALIDATION FOR REVIEWS ///////////////////////
// MW func that will be used for server-side data validation
// 'joi' lets u build a schema that lays out req'ts for data inputs
module.exports.validateReview = (req, res, next) => {
    // Uses the schema (from '../schemas.js') to check the 'req.body' and destructures the 'error' prop out of the created obj
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        // Used to pull the err msgs out of 'error' to pass into our custom 'Error' obj (ExpressError)
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        // Must call 'next()' if we want to move on to the rest of the route handler if there is no err
        next();
    }
}

// Authentication is the process of verifying who a particular user is
/////////////////////////// USER AUTHENTICATION ///////////////////////////
// '.isAuthenticated()' is added to 'req' when you log in using 'passport'
//// Uses a sess ID to keep track of whether someone has logged in
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}

// Authorization is verifying what a specific user has access to
//////////////////////// CAMPGROUND AUTHORIZATION /////////////////////////
module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    // Checks to see if the campground's author ID is same as the sess ID
    if (!campground.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

////////////////////////// REVIEW AUTHORIZATION ///////////////////////////
module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    // Checks to see if the review's author ID is same as the sess ID
    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}