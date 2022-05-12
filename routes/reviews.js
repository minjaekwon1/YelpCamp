const express = require('express');
// Creates a new router obj (an isolated instance of MW & routes)
//// Like a 'mini-app', capable only of performing MW & routing funcs
// 'mergeParams' preserves the 'req.params' vals from the parent router
const router = express.Router({ mergeParams: true });
// For error handling
const catchAsync = require('../utilities/catchAsync');
// MW for data validation, authentication
const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware');
// Controllers for proper MVC (separating internal data models from the user interface via the controller and view)
const controllers = require('../controllers/reviews');


// Route handlers are prefixed w/ '/campgrounds/:id/reviews' in 'app.js'
//////////////////////////////// CREATING ////////////////////////////////

router.post('/', isLoggedIn, validateReview, catchAsync(controllers.createReview));

//////////////////////////////// DELETING ////////////////////////////////

router.delete('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(controllers.deleteReview));

module.exports = router;