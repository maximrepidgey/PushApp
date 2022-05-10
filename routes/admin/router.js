/** @module root/router */
'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('dustjs-helpers');//used for helper function inside dust files

require('../../models/UserAccount.js');
let UserAccount = mongoose.model('UserAccount');


// GET all the information of thea admin and render the setting page so that the user can modify his data
router.get('/edit', isLoggedIn, async (req, res) => {
    let found = await UserAccount.findById(req.user._userAccountId);
    let accountToModify = {
        firstName: found.firstName,
        lastName: found.lastName,
        birthday: found.birthday,
        sex: found.sex,
        email: found.email,
        phone: found.phone,
        photo: found.photo,
        form: found.form,
        address1: found.address1,
        city: found.city,
        state: found.state,
        zipCode: found.zipCode,
        country: found.country,
        currency: found.currency,
        localization: found.localization
    };
    console.log("OLD", accountToModify);
    if (typeof found.description != "undefined") {
        accountToModify.description = found.description;
    }
    if (typeof found.photo != "undefined" && found.photo !== "" && found.photo != null) {
        accountToModify.photo = found.photo;
        accountToModify.form = found.form;
    }
    if (typeof found.address2 != "undefined") {
        accountToModify.address2 = found.address2;
    }
    accountToModify.thisId = found._id;
    console.log("to print", accountToModify);
    if (req.accepts("text/html")) {
        res.render('register_forms/admin-settings.dust', accountToModify);
    }
});

// Edit admin data
// It works with all the required information provided
router.put('/edit/:id', async (req, res) => {
    if (req.accepts("json")) {
        if (req.params.id !== undefined && !mongoose.Types.ObjectId.isValid(req.params.id)) {
            res.status(400).end();
        } else {
            console.log('Searching admin account with ID: ' + req.params.id + '.');
            try {
                let found = await UserAccount.findById(req.params.id);
                if (found != null) {
                    if (req.body.firstName) {
                        found.firstName = req.body.firstName;
                    }
                    if (req.body.lastName) {
                        found.lastName = req.body.lastName;
                    }
                    if (req.body.description) {
                        found.description = req.body.description;
                    }
                    if (typeof req.body.photo == "undefined" || req.body.photo == null || req.body.photo === "") {
                        found.photo = getPhotoPlaceholder();
                        found.form = 'square';
                    } else {
                        found.photo = req.body.photo;
                        found.form = req.body.form;
                    }
                    if (req.body.birthday) {
                        found.birthday = req.body.birthday;
                    }
                    if (req.body.sex) {
                        found.sex = req.body.sex;
                    }
                    if (req.body.email) {
                        found.email = req.body.email;
                    }
                    if (req.body.phone) {
                        found.phone = req.body.phone;
                    }
                    if (req.body.address1) {
                        found.address1 = req.body.address1;
                    }
                    if (req.body.address2) {
                        found.address2 = req.body.address2;
                    }
                    if (req.body.city) {
                        found.city = req.body.city;
                    }
                    if (req.body.state) {
                        found.state = req.body.state;
                    }
                    if (req.body.zipCode) {
                        found.zipCode = req.body.zipCode;
                    }
                    if (req.body.country) {
                        found.country = req.body.country;
                    }
                    if (req.body.currency) {
                        found.currency = req.body.currency;
                    }
                    if (req.body.localization) {
                        found.localization = req.body.localization;
                    }
                } else {
                    res = setResponse('error', 404, res, {Error: 'Admin not found!'});
                    res.end();
                }
                let saved = await found.save();
                console.log('Admin account ID: ' + req.params.id + ' updated!');
                if (req.accepts("text/html")) {
                    res = setResponse('html', 201, res);
                    res.redirect('/' + req.user.username);
                } else if (req.accepts("application/json")) {
                    res = setResponse('json', 201, res, {userAccount: saved});
                    res.end();
                }
            } catch (e) {
                res.status(500).end();
            }
        }
    }
});


// Customized response
function setResponse(type, code, res, msg) {
    res.status(code);
    switch (type) {
        case 'json':
            res.set('Content-Type', 'application/json');
            res.json(msg);
            return res;
            break;
        case 'html':
            return res.set('Content-Type', 'text/html');
            break;
        case 'error':
            res.json(msg);
            return res;
            break;
        default:
            break;
    }
}

function isLoggedIn(req, res, next) {
    // redirect if admin isn't not authenticated
    if (!req.user) {
        req.flash('loginMessage', 'Please log in');
        res.redirect('/login');
    } else if (req.isAuthenticated()) {
        return next();
    } else {
        // if they aren't render login page
        req.flash('loginMessage', 'Not authorized');
        res.redirect('/login');
    }

}

function getPhotoPlaceholder() {
    return '/img/logoPushAppWhite.svg';
}

module.exports = router;
