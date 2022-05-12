const express = require('express');
// Creates a new router obj (an isolated instance of MW & routes)
//// Like a 'mini-app', capable only of performing MW & routing funcs
const router = express.Router();
// For error handling
const catchAsync = require('../utilities/catchAsync');
// MW for authentication, authorization, and data validation respectively
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware');
// Controllers for proper MVC (separating internal data models from the user interface via the controller and view)
const controllers = require('../controllers/campgrounds');
// For uploading files (imgs) & storing them
const multer = require('multer');
const { storage } = require('../cloudinary'); // don't need to add '/index' as Node auto looks for a 'index.js' file when it is not specified
// Tells 'multer' to look inside the cloudinary storage for files
const upload = multer({ storage });


// Route handlers are prefixed w/ '/campgrounds' in 'app.js'

// Can chain on route handlers that process reqs from the same path
router.route('/')
    .get(catchAsync(controllers.index))
    // Can pass in our MW, 'isLoggedIn' & 'validateCampground', as args and the route handler will exe them before 'catchAsync()'
    // 'upload' stores data from the form input w/ 'name="image"' in an obj called 'req.files' while the rest is stored in 'req.body'
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(controllers.createCampground))

router.get('/new', isLoggedIn, controllers.renderNewForm);

router.route('/:id')
    .get(catchAsync(controllers.showCampground))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(controllers.updateCampground))
    .delete(isLoggedIn, isAuthor, catchAsync(controllers.deleteCampground))

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(controllers.renderEditForm));

module.exports = router;