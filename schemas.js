const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

// This is for sanitizing an input of any HTML tags
const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        // This rule sanitizes any input we add the rule on to
        escapeHTML: {
            validate(value, helpers) {
                let clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {}
                });
                // Puts '&'s back into the input after sanitization
                // Useful if we want to add smthng like 'Harold & Son'
                if (clean.includes('&amp;')) {
                    clean = clean.replace(/&amp;/g, '&');
                }
                // If the cleaned val is diff from the og val, output the msg above
                if (clean !== value) {
                    return helpers.error('string.escapeHTML', { value })
                };
                return clean;
            }
        }
        /*
        // Sanitizes the input and doesn't let '&' be used
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
        */
    }
});

// This adds our 'extension' onto any 'Joi' obj we create
const Joi = BaseJoi.extend(extension)

// 'joi' lets u build a schema that lays out req'ts for data inputs
const campgroundSchema = Joi.object({
    // 'campground' prop must be an obj & is required to be validated
    campground: Joi.object({
        title: Joi.string().required().escapeHTML(),
        // 'price' prop must be nested inside 'campground', has to be a #, is required, and its val can't be lower than 0
        price: Joi.number().required().min(0),
        // image: Joi.string().required(),
        location: Joi.string().required().escapeHTML(),
        description: Joi.string().required().escapeHTML()
    }).required(),
    deleteImages: Joi.array()
});
module.exports.campgroundSchema = campgroundSchema;

// Another way to do the same thing as above (slightly shorter syntax)
module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(0).max(5),
        body: Joi.string().required().escapeHTML()
    }).required()
})