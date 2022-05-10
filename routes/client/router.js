/** @module root/router */
'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
let ObjectId = require('mongodb').ObjectID;
const dust = require('dustjs-helpers');//used for helper function inside dust files

require('../../models/UserAccount.js');
require('../../models/Credential.js');
require('../../models/ClientInfo.js');
require('../../models/CoachClients.js');
require('../../models/Rating.js');
require('../../models/MoneyAccount.js');

let UserAccount = mongoose.model('UserAccount');
let ClientInfo = mongoose.model('ClientInfo');
let Credentials = mongoose.model('Credentials');
let CoachClients = mongoose.model('CoachClients');
let MoneyAccount = mongoose.model('MoneyAccount');
let Rating = mongoose.model('Rating');

// GET all
router.get('/', async (req, res) => {
    try {
        let clients = await UserAccount.find({});
        let result = await clients.filter((o) => {
            return (o.isDeleted === false);
        });

        if (req.accepts("text/html")) {
            // let usersModel = {
            //   users: users,
            //   title: "My Canvas"
            // };
            // res.render("result", usersModel);
        } else if (req.accepts("application/json")) {
            res = setResponse('json', 200, res, result);
        } else {
            res.status(400);
        }
        res.end();
    } catch (err) {
        console.log(err);
        res.status(500);
        res.end();
    }
});

// Creates a new client
router.post('/new', async (req, res) => {
    try {
        if ((req.get('Content-Type') === "application/json" && req.accepts("application/json")) || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.body !== undefined)) {
            console.log('Creating new users...');

            if (req.body.firstName === undefined &&
                req.body.lastName === undefined &&
                req.body.birthday === undefined &&
                req.body.sex === undefined &&
                req.body.email === undefined &&
                req.body.address1 === undefined &&
                req.body.city === undefined &&
                req.body.state === undefined &&
                req.body.zipCode === undefined &&
                req.body.country === undefined &&
                req.body.currency === undefined) {
                res = setResponse('json', 400, res, {Error: "Username, password, first name, last name, birthday, sex, email, address1, city, state, zip code, country, and currency must be provided"});
                res.end();
            } else {

                let userAccount = new UserAccount({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    description: req.body.description,
                    birthday: req.body.birthday,
                    sex: req.body.sex,
                    email: req.body.email,
                    phone: req.body.phone,
                    address1: req.body.address1,
                    address2: req.body.address2,
                    city: req.body.city,
                    state: req.body.state,
                    zipCode: req.body.zipCode,
                    country: req.body.country,
                    currency: req.body.currency,
                    localization: req.body.localization,
                    accountType: 'client',
                    creationDate: Date.now()
                });
                if (typeof req.body.photo == "undefined" || req.body.photo == null || req.body.photo === "") {
                    userAccount.photo = getPhotoPlaceholder(req.body.sex);
                    userAccount.form = 'square';
                } else {
                    userAccount.photo = req.body.photo;
                    userAccount.form = req.body.form;
                }

                let savedUserAccount = await userAccount.save();

                let clientInfo = new ClientInfo({
                    _clientId: savedUserAccount._id,
                    height: req.body.height,
                    weight: req.body.weight,
                    unitSystem: req.body.unitSystem
                });

                let savedClientInfo = await clientInfo.save();

                // Creates MoneyAccount for client
                /*let newMoneyAccount = new MoneyAccount({
                    _userAccountId: savedUserAccount._id,
                    currency: savedUserAccount.currency
                });
                await newMoneyAccount.save();
                console.log('Money account created for this client');*/

                if (req.accepts("text/html")) {
                    res.render('register_forms/register-credentials.dust', {accID: (savedUserAccount._id).toString()});
                } else if (req.accepts("application/json")) {
                    savedUserAccount._credentials = 'private';
                    res = setResponse('json', 201, res, {
                        userAccount: savedUserAccount,
                        clientInfo: savedClientInfo
                    });
                }
                res.end();
            }
        } else {
            res = setResponse('json', 400, res, {Error: "Only application/json and application/x-www-form-urlencoded 'Content-Type' is allowed."});
            res.end();
        }
    } catch (err) {
        console.log(err);
        res.status(500).end();
    }
});

router.get('/edit', isLoggedIn, async (req, res) => {
    console.log(req.user);
    let found = await UserAccount.findById(req.user._userAccountId);
    let oldAccount = {
        firstName: found.firstName,
        lastName: found.lastName,
        sex: found.sex,
        email: found.email,
        phone: found.phone,
        address1: found.address1,
        city: found.city,
        state: found.state,
        zipCode: found.zipCode,
        country: found.country,
        currency: found.currency,
        localization: found.localization
    };
    console.log("OLD", oldAccount);
    if (typeof found.description != "undefined") {
        oldAccount.description = found.description;
    }
    if (typeof found.photo != "undefined" && found.photo !== "" && found.photo != null) {
        oldAccount.photo = found.photo;
        oldAccount.form = found.form;
    }
    if (typeof found.address2 != "undefined") {
        oldAccount.address2 = found.address2;
    }
    let foundInfo = await ClientInfo.findOne({_clientId: found._id});
    console.log("INFO", foundInfo);

    if (foundInfo.height !== undefined) {
        oldAccount.height = foundInfo.height;
    }
    if (typeof foundInfo.weight != "undefined") {
        oldAccount.weight = foundInfo.weight;
    }
    if (typeof foundInfo.unitSystem != "undefined") {
        oldAccount.unitSystem = foundInfo.unitSystem;
    }
    oldAccount.thisId = found._id.toString();
    console.log("to print", oldAccount);
    if (req.accepts("text/html")) {
        res.render('register_forms/client-settings.dust', oldAccount);
    }
});

//search for clients
router.get('/search', isLoggedIn, function (req, res) {
    let filter = getFilter(req);
    UserAccount.find(filter)
        .then((clients) => {
            if (clients.length > 0) {
                let length = clients.length;
                console.log(length + " clients has been found!");
                if (req.accepts('html')) {
                    res = setResponse('json', 200, res, clients);
                    res.status(200);
                    //render
                } else if (req.accepts('json')) {
                    res = setResponse('json', 200, res, clients);
                }
                res.end();
            } else {
                res = setResponse('error', 404, res, clients);
                res.end();
            }
        })
        .catch((err) => {
            console.log("0 clients has been found!");
            res.status(500).end()
        })
});

// Edit an user
router.put('/edit/:id', async (req, res) => {
    if (req.accepts("json")) {
        if (req.params.id !== undefined && !mongoose.Types.ObjectId.isValid(req.params.id)) {
            res.status(400).end();
        } else {
            try {
                console.log('Searching for user with ID: ' + req.params.id + '.');
                let foundClient = await UserAccount.findById(ObjectId(req.params.id));
                if (foundClient !== null) {
                    foundClient.firstName = req.body.firstName;
                    foundClient.lastName = req.body.lastName;
                    foundClient.description = req.body.description;
                    foundClient.sex = req.body.sex;
                    foundClient.email = req.body.email;
                    foundClient.phone = req.body.phone;
                    foundClient.address1 = req.body.address1;
                    foundClient.address2 = req.body.address2;
                    foundClient.city = req.body.city;
                    foundClient.state = req.body.state;
                    foundClient.zipCode = req.body.zipCode;
                    foundClient.country = req.body.country;
                    foundClient.currency = req.body.currency;
                    foundClient.localization = req.body.localization;
                    if (typeof req.body.photo == "undefined" || req.body.photo == null || req.body.photo === "") {
                        foundClient.photo = getPhotoPlaceholder(req.body.sex);
                        foundClient.form = 'square';
                    } else {
                        foundClient.photo = req.body.photo;
                        foundClient.form = req.body.form;
                    }

                    let savedClient = await foundClient.save();
                    let foundClientInfo = await ClientInfo.findOne({_clientId: req.params.id});

                    foundClientInfo.height = req.body.height;
                    foundClientInfo.weight = req.body.weight;
                    foundClientInfo.unitSystem = req.body.unitSystem;

                    let savedClientInfo = await foundClientInfo.save();

                    console.log('User with ID: ' + req.params.id + ' updated!');
                    if (req.accepts("text/html")) {
                        res = setResponse('html', 201, res);
                        res.redirect('/' + req.user.username);
                    } else if (req.accepts("application/json")) {
                        // delete savedClient._doc['_credentials'];
                        res = setResponse('json', 201, res, {
                            userAccount: savedClient,
                            clientInfo: savedClientInfo
                        });
                        res.end();
                    }
                } else {
                    res = setResponse('error', 404, res, {Error: 'Client not found!'});
                    res.end();
                }
            } catch
                (err) {
                console.log(err);
                res.status(500);
                res.end();
            }
        }
    }
});

// Wipes client's userAccount and info without deleting the objects.
router.delete('/delete/:id', async (req, res) => {
    try {
        if (req.accepts("json")) {
            console.log('Searching for user with ID: ' + req.params.id + '.');
            let foundClient = await UserAccount.findById({_id: req.params.id});
            if (foundClient !== null && foundClient.accountType === 'client') {
                foundClient.firstName = 'anonymous';
                foundClient.lastName = ' ';
                foundClient.description = '';
                foundClient.photo = '';
                foundClient.email = ' ';
                foundClient.phone = ' ';
                foundClient.address1 = ' ';
                foundClient.address2 = '';
                foundClient.isDeleted = true;

                let foundCredential = await Credentials.findOne({_userAccountId: req.params.id});
                await foundClient.save();

                if (foundCredential !== undefined) {
                    await foundCredential.remove();
                }
                console.log('Client with ID ' + req.params.id + ' was successfully deleted!');
                if (req.accepts("text/html")) {
                    res = setResponse('html', 200, res);
                } else if (req.accepts("application/json")) {
                    res = setResponse('json', 200, res, {Result: `Client with ID ` + foundClient._id.toString() + ` was successfully deleted!`});
                    res.end();
                }
            } else {
                res = setResponse('error', 404, res, {Error: 'Client not found!'});
                res.end();
            }
        } else {
            res = setResponse('error', 400, res);
            res.end();
        }
    } catch
        (err) {
        console.log(err);
        res.status(500);
        res.end();
    }
});

router.get('/rating', isLoggedIn, async (req, res) => {
    try {
        //user have only one relation
        let clientCoachRelation = await CoachClients.findOne({_clientId: req.user._userAccountId});
        let thisCoachId = clientCoachRelation._coachId.toString();
        //find all ratings have every been given by this client
        let rating = await Rating.find({_clientId: req.user._userAccountId});
        let name = await UserAccount.findById(clientCoachRelation._coachId);
        name = name.firstName;
        if (rating.length !== 0) {
            //new rating object was not created yet
            //ask if user want to rate the coach again
            for (let i = 0; i < rating.length; i++) {
                if (thisCoachId === (rating[i]._coachId).toString()) {
                    res.render('rating/rating-again.dust', {
                        score: rating[i].score,
                        comment: rating[i].comment,
                        title: rating[i].title,
                        name: name,
                        objId: (rating[i]._id).toString()
                    })
                }
            }
        } else {
            //render the rating page
            res.render('rating/rating-first.dust', {id: thisCoachId, name : name})
        }
    } catch (e) {
        console.log(e);
        res.status(500).end();
    }
})

// Creates filter for searching users on the database
function getFilter(req) {
    const filter = {};
    let request;

    if (Object.keys(req.body).length > 0) {
        request = req.body;
    } else if (Object.keys(req.query).length > 0) {
        request = req.query;
    } else if (Object.keys(req.params).length > 0) {
        request = req.params;
    }

    if (request !== undefined) {
        // Filter by user ID
        if (request.id !== undefined && mongoose.Types.ObjectId.isValid(request.id)) {
            filter._id = request.id;
        }

        // Filter by user's last name
        if (request.lastName !== undefined) {
            filter.lastName = request.lastName;
        }

        // Filter by user's first name
        if (request.firstName !== undefined) {
            filter.firstName = request.firstName;
        }

        // Search by country
        if (request.country !== undefined) {
            filter.country = request.country;
        }

        // Search by sex
        if (request._clientId !== undefined) {
            filter._clientId = request._clientId;
        }
        // Search non deleted
        if (request.isDeleted === undefined) {
            filter.isDeleted = false;
        } else {
            filter.isDeleted = request.isDeleted;
        }
        return filter;
    }
}

// Creates custom responses
function setResponse(type, code, res, msg) {
    res.status(code);
    switch (type) {
        case 'json':
            res.set('Content-Type', 'application/json');
            res.json(msg);
            return res;
        case 'html':
            return res.set('Content-Type', 'text/html');
        case 'error':
            res.json(msg);
            return res;
        default:
            break;
    }
}

//todo delete function getImage here

function isLoggedIn(req, res, next) {
    if (!req.user) {
        req.flash('loginMessage', 'please login');
        res.redirect('/login');
    } else if (req.isAuthenticated()) {
        return next();
    } else {
        // if they aren't render login page
        req.flash('loginMessage', 'Not authorized');
        res.redirect('/login');
    }
}

function getPhotoPlaceholder(sex) {
    switch (sex) {
        case 'female':
            return '/img/placeholders/client_female.jpg';
        case 'male':
            return '/img/placeholders/client_male.jpg';
    }
}

module.exports = router;
