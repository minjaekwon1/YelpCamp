// For 'Campground' model
const Campground = require('../models/campground');
// For image storage
const { cloudinary } = require('../cloudinary');
// For geocoding
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
//// Passes in the Token when a new instance of 'mbxGeocoding' is created
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });


//////////////////////////////// CREATING ////////////////////////////////

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
}

module.exports.createCampground = async (req, res, next) => {
    // W/ mapbox, find the coordinates of a location based on an address, city name, country, etc. (will choose a point if given broad params) 
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send();
    // 'req.body' obj lets u access data in a str or JSON obj from the client side, usually for POST or PUT reqs
    // 'req.body' contains key-val pairs of the data from the form 
    const newCampground = new Campground(req.body.campground);
    // Adds the props needed to create a GeoJSON 'Point' obj
    newCampground.geometry = geoData.body.features[0].geometry;
    // 'req.files' (which has img data) is pop by 'multer' w/ 'upload'
    // Loops over the objs in 'req.files' & maps the vals in the obj's props 'path' & 'filename' to the nested props in the 'images' prop
    newCampground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    console.log(newCampground);
    // Makes the logged in user the author of the newly created campground
    newCampground.author = req.user._id;
    await newCampground.save();
    // msg is stored in the sess (data) store w/ this line
    // 'success' is the key & the 2nd str is the val
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`/campgrounds/${newCampground._id}`);
}

///////////////////////////////// READING /////////////////////////////////

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds })
}

module.exports.showCampground = async (req, res) => {
    // 'req.params' obj captures data based on params specified in URL
    // 'req.params.id' specifically pulls the data replacing ':id'
    const campground = await Campground.findById(req.params.id)
        // '.populate()' finds & fills in the 'reviews' prop w/ the rest of the 'Review' model's props ('body', 'rating', 'author') as 'campground' only contains the '_id' of a 'Review' w/o the method
        // then the nested 'populate:' fills each one of those reviews w/ the rest of its author's 'User' model props ('email', 'username')
        .populate({
            path: 'reviews',
            populate: {
                path: 'author'
            }
        })
        // 2nd '.populate()' adds in the 'User' model's props
        .populate('author');
    if (!campground) {
        req.flash('error', 'Campground no longer exists!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground });
}

//////////////////////////////// UPDATING ////////////////////////////////

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash('error', 'Campground no longer exists!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground });
}

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
    const updatedCampground = await Campground.findByIdAndUpdate(id, req.body.campground, { runValidators: true });
    // 'req.files' vals are mapped onto the 'images' prop
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    console.log(imgs);
    // Spreading the arr into 'images'
    updatedCampground.images.push(...imgs);
    await updatedCampground.save();
    if (req.body.deleteImages) {
        // Deletes imgs in 'deleteImages' (from the form) from Cloudinary
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        // Pulls imgs whose 'filename' is in the 'deleteImages' arr out of the 'images' arr, deleting them from MongoDB
        await updatedCampground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
    }
    req.flash('success', 'Successfully updated the campground!');
    res.redirect(`/campgrounds/${id}`);
}

//////////////////////////////// DELETING ////////////////////////////////

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    const deletedCampground = await Campground.findByIdAndDelete(id);
    // for (let img of deletedCampground.images) {
    //     await cloudinary.uploader.destroy(img.filename);
    // }
    req.flash('success', 'Successfully deleted the campground!');
    res.redirect('/campgrounds');
}