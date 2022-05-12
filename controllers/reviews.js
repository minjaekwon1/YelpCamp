// For 'Campground' model
const Campground = require('../models/campground');
// For 'Review' model
const Review = require('../models/review');

//////////////////////////////// CREATING ////////////////////////////////

module.exports.createReview = async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    // Makes the logged in user the author of the newly created review
    review.author = req.user._id;
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash('success', 'Created new review!');
    res.redirect(`/campgrounds/${campground._id}`);
}

//////////////////////////////// DELETING ////////////////////////////////

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;
    // $pull operator removes from an existing array all instances of a value or values that match a specified condition
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } })
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted the review!');
    res.redirect(`/campgrounds/${id}`);
}