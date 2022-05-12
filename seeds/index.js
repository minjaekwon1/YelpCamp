const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');

// This is used to instantly exit the server if there is an error
main().catch(err => console.log(err));

async function main() {
    // The URI (uniform resource identifier) below identifies where to find MongoDB locally on my PC and the DB to create/use, 'yelp-camp' DB
    await mongoose.connect('mongodb://localhost:27017/yelp-camp');

    // Keep code inside main() if you don't want it to run if there's an error somewhere 

    const sample = arr => arr[Math.floor(Math.random() * arr.length)];

    const seedDB = async () => {
        await Campground.deleteMany({});
        for (let i = 0; i < 50; i++) {
            const random1000 = Math.floor(Math.random() * 1000);
            const price = Math.floor(Math.random() * 20) + 10;
            const camp = new Campground({
                author: '626b2c785192b443c4808d6a',
                location: `${cities[random1000].city}, ${cities[random1000].state}`,
                title: `${sample(descriptors)} ${sample(places)}`,
                description: 'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Facere tempore animi, dolore soluta, consequatur explicabo magnam optio harum ut ea excepturi voluptas quod expedita. Asperiores alias fugiat quos aliquid odio?',
                price: price,
                geometry: {
                    type: 'Point',
                    coordinates: [
                        cities[random1000].longitude,
                        cities[random1000].latitude,
                    ]
                },
                images: [
                    {
                        url: 'https://res.cloudinary.com/dfvxa9dip/image/upload/v1651706119/YelpCamp/ll5zslfuuoqcqfkmmxsa.png',
                        filename: 'YelpCamp/ll5zslfuuoqcqfkmmxsa'
                    },
                    {
                        url: 'https://res.cloudinary.com/dfvxa9dip/image/upload/v1651706119/YelpCamp/bky4i0lhsj5da8qreuoy.png',
                        filename: 'YelpCamp/bky4i0lhsj5da8qreuoy'
                    }
                ],
            })
            await camp.save();
        }
    }

    // Run the func, then close out of Mongoose
    seedDB().then(() => {
        mongoose.connection.close();
    })
}