/** @module root/router */
'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

require('../../models/UserAccount.js');
require('../../models/Credential.js');

let UserAccount = mongoose.model('UserAccount');
let Credentials = mongoose.model('Credentials');

// Searches by username for userID and accountType
router.get('/getuserinfo', async (req, res) => {
    const filter = getFilter(req);

    try {
        let credentials = await Credentials.findOne(filter);
        let user = await UserAccount.findById(req.user._userAccountId);
        let userInfo = {
            userAccountId: req.user._userAccountId,
            username: req.user.username,
            accountType: user.accountType
        };
        res = setResponse('json', 200, res, userInfo);
        res.end();
    } catch (err) {
        res.status(500);
        res.end();
    }
});

// // Searches by username for userID and accountType
// router.get('/getuserinfo2', async (req, res) => {
//     const filter = getFilter(req);
//
//     try {
//         let user = await UserAccount.findById(req.user._userAccountId);
//         uswr
//         let userInfo = {
//             userAccountId: user._id,
//             username: credentials.username,
//             accountType: user.accountType
//         };
//         res = setResponse('json', 200, res, userInfo);
//         res.end();
//     } catch (err) {
//         res.status(500);
//         res.end();
//     }
// });

// Creates filter for searching users on the database
function getFilter(req) {
    const filter = {};
    let request;

    if (Object.keys(req.body).length > 0) {
        request = req.body;
    } else if (Object.keys(req.query).length > 0) {
        request = req.query;
    }

    if (request !== undefined) {
        // Filter by user ID
        if (request.id !== undefined && mongoose.Types.ObjectId.isValid(request.id)) {
            filter._userAccountId = request.id.toLowerCase();
        }

        // Filter by user's last name
        if (request.username !== undefined) {
            filter.username = request.username.toLowerCase();
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

router.get('/getuser', function (req, res) {
    res.send(req.user);
});

module.exports = router;
