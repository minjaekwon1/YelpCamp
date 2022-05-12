const mongoose = require('mongoose');
const Review = require('./review');
// Shorter way to type out 'mongoose.Schema'
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
})

// In Mongoose, a 'virtual' is a prop that is NOT stored in MongoDB & is typically used for computed props on docs
ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
})


// The schema option 'toJSON' must be passed into the schema for virtuals to be included when a doc is converted into JSON
const opts = { toJSON: { virtuals: true } };

const CampgroundSchema = new Schema({
    title: String,
    images: [ImageSchema],
    // Makes the 'geometry' prop a 'Point' (GeoJSON obj type)
    geometry: {
        type: {
            type: String, // Don't do `{ location: { type: String } }`
            enum: ['Point'], // Means 'location.type' must be 'Point'
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    price: Number,
    description: String,
    location: String,
    // Prop that stores the 'ObjectId(...)'s of the model, 'Review'
    reviews: [
        {
            // tells Mongoose 'reviews' should only contain IDs
            type: Schema.Types.ObjectId,
            // ref opt tells Mongoose which model to use for population
            ref: 'Review'
        }
    ],
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, opts);

CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
    return `
    <div class="text-center"><strong><a class="btn btn-secondary btn-sm" href="/campgrounds/${this._id}">${this.title}</a></strong></div>
    <p>${this.description.substring(0, 30)}...</p>`;
})

// 'findOneAndDelete' is a query MW func which is automatically triggered when the MW func 'findByIdAndDelete' is exe, which is found in '../app.js'
// Must be a post MW func as we don't have access to the data in the doc deleted by 'findByIdAndDelete' if it is a pre MW func
CampgroundSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        // Removing the reviews associated w/ the deleted campground from the 'Review' ('reviews' in MongoDB) collection
        await Review.deleteMany({
            // Del all reviews whose '_id' field exists in the del campgrounds 'reviews' arr
            _id: {
                $in: doc.reviews
            }
        })
    }
})

// Exporting the obj, 'Campground', to be used anywhere in the project
// 'Campground' turns into the collection, 'campgrounds', in the Mongo DB
module.exports = mongoose.model('Campground', CampgroundSchema);