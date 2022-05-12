// 'NODE_ENV' is an envir var that is either 'development' or 'production'
//// This app is run as 'development' until it is deployed 
// If we aren't in prod, add the vars in '.env' to the 'process.env' var
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

// NodeJS's built-in 'require' func is the easiest way to include modules that exist in separate files
// It reads a JS file, exe that file, & rets the 'exports' obj
const express = require('express');
const app = express();
const mongoose = require('mongoose');
// Enables the use of all HTTP req methods
const methodOverride = require('method-override');
// To make '.ejs' files
const ejsMate = require('ejs-mate');
const path = require('path');
// For 'User' model
const User = require('./models/user');
// For error handling
const ExpressError = require('./utilities/ExpressError');
// For encapsulating the route handlers
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
// For creating cookies and session stores
const session = require('express-session');
// For creating flash msgs
const flash = require('connect-flash');
// For user authentication
const passport = require('passport');
const LocalStrategy = require('passport-local');
// For sanitizing user-supplied data to prevent MongoDB Operator Injection
const mongoSanitize = require('express-mongo-sanitize');
// To increase security by setting various HTTP headers
const helmet = require('helmet');
// To connect to MongoDB Atlas
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';
// Creates a Mongo session store
const MongoStore = require('connect-mongo');

// This is used to instantly exit the server if there is an error
main().catch(err => console.log(err));

async function main() {
    // The URI (uniform resource identifier) below identifies where to find MongoDB locally on my PC and the DB to create/use, 'yelp-camp' DB
    // await mongoose.connect('mongodb://localhost:27017/yelp-camp');

    // To connect to MongoDB Atlas (DB on the cloud)
    await mongoose.connect(dbUrl);

    // Keep code inside main() if you don't want it to run if there's an error somewhere 

    ///////////////////////////////// EJS ////////////////////////////////
    // Makes 'ejsMate' the default engine to run, parse, make sense of EJS
    app.engine('ejs', ejsMate);
    // Makes the default 'view engine' the npm pack 'ejs' 
    app.set('view engine', 'ejs');
    // This is to make it so 'ejs' looks for the 'views' folder in the correct location no matter what the cd is in the CLI
    app.set('views', path.join(__dirname, 'views'));

    /////////////////////////// METHOD OVERRIDE //////////////////////////
    // 'app.use()' runs on EVERY SINGLE incoming HTTP req including actions like refreshing the page, clicking links, or submitting a form
    // Enables you to use a query string value to override the method
    // For (EX), can override 'POST' by adding '?_method=DELETE' to URL
    app.use(methodOverride('_method'));

    ////////////////////////////// PARSING ///////////////////////////////
    // Express Method to recog the incoming 'Request Object' as strs or arrs to populate the 'req.body' w/ the data we need
    app.use(express.urlencoded({ extended: true }));

    ////////////////////////// SERVING STATIC FILES //////////////////////////
    // Used to serve (present) static files such as imgs, CSS files, & JS files found inside './public'
    app.use(express.static(path.join(__dirname, 'public')));

    ////////////////////////////// SESSIONS //////////////////////////////
    const secret = process.env.SECRET || 'thisshouldbeabettersecret';

    // Used to store the sess ID in MongoDB
    const store = new MongoStore({
        mongoUrl: dbUrl,
        // Saying sess should be updated only one time in a period of 24 hours unless the sess data is changed (ignores page refreshes)
        touchAfter: 24 * 3600, // time period in seconds,
        crypto: {
            secret
        }
    });
    store.on('error', function (e) {
        console.log('Session store error!', e);
    })

    // The required option, 'secret', is used to sign the session ID cookie
    // the sess ID cookie is like a 'key' for the data store in the server
    const sessionConfig = {
        store, // Sem thing as 'store: store'
        name: 'session', // Changes the default name for extra security
        secret,
        resave: false, // Forces sess to be saved back to sess store even if nothing was mod; defaults to true, but want false
        saveUninitialized: true, // Forces 'uninitialized' sess to be saved to the store
        cookie: {
            httpOnly: true, // Can't be accessed thru client-side script
            // secure: true, // Cookie can only be config thru a secure connection -> 'https://'
            expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
            maxAge: 1000 * 60 * 60 * 24 * 7 // Will expire in a week
        }
    }
    // Sess's are server-side data stores that we use to make HTTP stateful
    // Instead of storing data using cookies, store it on the server-side & then send the browser a cookie that can be used to retrieve the data
    app.use(session(sessionConfig));

    /////////////////// PASSPORT (USER AUTHENTICATION) ///////////////////
    // 'passport.initialize()' MW is required to initialize 'Passport'
    app.use(passport.initialize());
    // MW is required if persistent login sessions are used
    app.use(passport.session());
    // Telling 'passport' we would like to use 'LocalStrategy', whose auth method will be located on our 'User' model
    // This method was auto-gen by the 'UserSchema.plugin(passport);' line
    passport.use(new LocalStrategy(User.authenticate()));
    // Tells 'passport' how to serialize (store) users into the session
    passport.serializeUser(User.serializeUser());
    // Tells 'passport' how to get users out of that session
    passport.deserializeUser(User.deserializeUser());

    /////////////////////////////// FLASH ////////////////////////////////
    // The flash is a special area of the sess used for storing msgs
    // Msgs are written to the flash and cleared after shown to user
    app.use(flash());
    // Vars set on 'res.locals' are avail within a single req-res cycle
    //// Vars are accessible in any template rendered w/ 'res.render()'
    // This makes it easy to access flash msgs after creating them
    app.use((req, res, next) => {
        res.locals.success = req.flash('success');
        res.locals.error = req.flash('error');
        // For USER AUTH, but breaks app if put in a separate 'app.use()'
        res.locals.currentUser = req.user;
        next();
    })
    // Put before the route handlers below so they have access to FLASH

    /////////////////////////// EXPRESS ROUTER ///////////////////////////
    // prefixes '/campgrounds' onto the beg of the paths used by the route handlers in './routes/campgrounds.js'
    app.use('/campgrounds', campgroundRoutes);
    // prefixes '/campgrounds/:id/reviews' onto the beg of the paths
    app.use('/campgrounds/:id/reviews', reviewRoutes);
    app.use('/', userRoutes);

    ///////////////////////// DATA SANITIZATION //////////////////////////
    // Searches for any keys (in objs) that begin with '$' or contain '.' in 'req.body', 'req.query' or 'req.params' & removes them
    app.use(mongoSanitize());

    ///////////////////////////// SECURITY //////////////////////////////
    app.use(helmet());
    // Lets the app fetch data from the following websites
    const scriptSrcUrls = [
        "https://stackpath.bootstrapcdn.com/",
        "https://api.tiles.mapbox.com/",
        "https://api.mapbox.com/",
        "https://kit.fontawesome.com/",
        "https://cdnjs.cloudflare.com/",
        "https://cdn.jsdelivr.net",
    ];
    const styleSrcUrls = [
        "https://kit-free.fontawesome.com/",
        "https://stackpath.bootstrapcdn.com/",
        "https://api.mapbox.com/",
        "https://api.tiles.mapbox.com/",
        "https://fonts.googleapis.com/",
        "https://use.fontawesome.com/",
        "https://cdn.jsdelivr.net",
    ];
    const connectSrcUrls = [
        "https://api.mapbox.com/",
        "https://a.tiles.mapbox.com/",
        "https://b.tiles.mapbox.com/",
        "https://events.mapbox.com/",
    ];
    const fontSrcUrls = [];
    app.use(
        helmet.contentSecurityPolicy({
            directives: {
                defaultSrc: [],
                connectSrc: ["'self'", ...connectSrcUrls],
                scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
                styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
                workerSrc: ["'self'", "blob:"],
                objectSrc: [],
                imgSrc: [
                    "'self'",
                    "blob:",
                    "data:",
                    "https://res.cloudinary.com/dfvxa9dip/",
                    "https://images.unsplash.com/",
                ],
                fontSrc: ["'self'", ...fontSrcUrls],
            },
        })
    );

    ///////////////////////////// HOME PAGE /////////////////////////////

    app.get('/', (req, res) => {
        res.render('home');
    })

    /////////////////////////// ERROR HANDLING ///////////////////////////

    // Put at the end so if nothing matches, this triggers as a stopgap
    // If you pass anything to 'next()', Express regards the cur req as an err & will skip any remaining non-err handling routing and MW funcs
    app.all('*', (req, res, next) => {
        // This obj is sent to the MW below & becomes the 'err' param
        next(new ExpressError('Page Not Found', 404));
    })

    // A custom Error Handler used to process errs sent by 'next()'
    app.use((err, req, res, next) => {
        const { statusCode = 500 } = err;
        if (!err.message)
            err.message = 'Something went wrong'
        res.status(statusCode).render('error', { err });
    })

    ////////////////////////// SERVER CONNECTION //////////////////////////

    // The 'port' var is auto set by Heroku (usually 80)
    const port = process.env.PORT || 3000;
    // '.listen()' enables JS to connect to the server at 'http://localhost:3000/' by using 'nodemon app.js' in the CLI
    app.listen(port, () => {
        console.log(`Serving on port ${port}`);
    })
}