const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const emitter = require('./socketIoEmitter.js');
const express = require('express');
const dust = require('klei-dust');
const logger = require('morgan');
const path = require('path');
const app = express();

// Models
require('./models/ClientInfo.js');
require('./models/Credential.js');
require('./models/UserAccount.js');
require('./models/CoachClients.js');
require('./models/Transaction.js');
require('./models/MoneyAccount.js');

require('dotenv').config(); //

// Mongoose connection to MongoDB and Collection name declaration
mongoose.connect('mongodb://localhost/PushApp', {useNewUrlParser: true, useUnifiedTopology: true});

// Dust views rendering engine
app.set('view engine', 'dust');
app.set('views', __dirname + '/views');
app.engine('dust', dust.dust);

// Configure app
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// Override with POST having ?_method=DELETE or ?_method=PUT
app.use(methodOverride('_method'));

//for passport js
app.use(require('express-session')({
    secret: 'secretcode',
    resave: true,
    saveUninitialized: true,
    maxAge: 24 * 60 * 60 * 1000/*a day long*/
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Middleware
app.use(bodyParser.json({limit: '50mb'}));
app.use(cookieParser());
app.use(bodyParser.text({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

require('./config/passport')(passport);
require('./routes/index.js')(app, passport);

// Initialize routers here
const routers = require('./routes/routers');
app.use('/', routers.root);
app.use('/auth', routers.auth);
app.use('/clients', routers.client);
app.use('/admin', routers.admin);
app.use('/coaches', routers.coach);
app.use('/workouts', routers.workout);
app.use('/checkout', routers.checkout);
app.use('/money', routers.money);
app.use('/statistics', routers.statistics);

// Catch 404 and forward to error handler
// This should be configured after all 200 routes
app.use(function (req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

const admin = initAdmin();
console.log("The server is running on port 5000");

async function initAdmin() {
    try {
        let Credentials = mongoose.model('Credentials');
        let existingAdmin = await Credentials.findOne({username: 'admin'});
        if (!existingAdmin) {
            console.log('Admin user not found! Initializing default admin... ');
            let UserAccount = mongoose.model('UserAccount');
            let MoneyAccount = mongoose.model('MoneyAccount');
            const bcrypt = require('bcrypt');

            let newAdmin = new UserAccount({
                firstName: 'Admin',
                lastName: 'PushApp',
                description: 'System Admin',
                birthday: 20 - 12 - 2019,
                sex: 'none',
                email: 'admin@pushapp.com',
                phone: '+41 800 PUSHAPP',
                address1: 'Via Buffi 13',
                city: 'Lugano',
                state: 'Ticino',
                zipCode: '6900',
                country: 'Switzerland',
                currency: 'chf',
                localization: 'en-US',
                accountType: 'admin',
                photo: '/img/logoPushAppWhite.svg',
                form: 'square'
            });

            // Remember to move admin's password to .ENV file
            let savedAdmin = await newAdmin.save();
            let saltedPass = bcrypt.hashSync('admin123', bcrypt.genSaltSync(8), null);
            let newCredentials = new Credentials({
                username: 'admin',
                password: saltedPass,
                _userAccountId: savedAdmin._id
            });
            await newCredentials.save();

            let newMoneyAccount = new MoneyAccount({
                _userAccountId: savedAdmin._id,
                currency: savedAdmin.currency
            });
            await newMoneyAccount.save();

            console.log('Admin user initialized successfully!')
        } else {
            console.log('Admin user active!')
        }
    } catch (e) {
        console.log(e);
    }
}

module.exports = app;
