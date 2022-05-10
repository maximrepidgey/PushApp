/** @module root/router */
'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('../../models/MoneyAccount.js');
let MoneyAccount = mongoose.model('MoneyAccount');

// Creates a new money account
router.post('/new', async (req, res) => {
    try {
        if ((req.get('Content-Type') === "application/json" && req.accepts("application/json")) || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.body !== undefined)) {
            let request = getFilter(req);
            if (request._userAccountId === undefined &&
                request.currency === undefined) {
                res = setResponse('json', 400, res, {Error: "_userAccountId and currency must be provided"});
                res.end();
            } else {
                console.log('Creating new money account...');
                let moneyAccount = new MoneyAccount({
                    _userAccountId: request._userAccountId,
                    currency: request.currency
                });

                let savedMoneyAccount = await moneyAccount.save();

                if (req.accepts("application/json")) {
                    res = setResponse('json', 201, res, savedMoneyAccount);
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

// Modifies the balance of a money account
router.put('/edit/', async (req, res) => {
    try {
        if ((req.get('Content-Type') === "application/json" && req.accepts("application/json")) || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.body !== undefined)) {
            let request = getFilter(req);
            if (request._userAccountId === undefined &&
                request.amount === undefined) {
                res = setResponse('json', 400, res, {Error: "_userAccountId and currency must be provided"});
                res.end();
            } else {
                let foundAccount = await MoneyAccount.findOne({_userAccount: req.params.userAccountId});
                if (foundAccount !== null && !foundAccount.isDeleted) {
                    console.log('Money account for user ID ' + req.params.id + ' was found!');
                    let operation;
                    if (request.amount > 0) {
                        operation = 'Adding';
                    } else {
                        operation = 'Substracting';
                    }

                    console.log(operation + ' ' + foundAccount.currency.toUpperCase() + ' ' + request.amount + ' to the account ID ' + foundAccount._userAccountId);
                    foundAccount.balance += request.amount;
                    let savedMoneyAccount = await foundAccount.save();
                    res = setResponse('json', 201, res, savedMoneyAccount);

                    res.end();
                } else {

                }
            }

        } else {
            res = setResponse('json', 400, res, {Error: "Only application/json and application/x-www-form-urlencoded 'Content-Type' is allowed."});
            res.end();
        }
    } catch
        (err) {
        console.log(err);
        res.status(500).end();
    }
});

// GET account balance for any userAccount ID
router.get('/:userAccountId', async (req, res) => {
    if (req.accepts("json")) {
        if (req.params.userAccountId !== undefined && !mongoose.Types.ObjectId.isValid(req.params.userAccountId)) {
            res.status(400).end();
        } else {
            try {
                console.log('Searching for money account for user ID: ' + req.params.id + '.');
                let foundAccount = await MoneyAccount.findOne({_userAccountId: req.params.userAccountId});
                if (foundAccount !== null && !foundAccount.isDeleted) {

                    console.log('Money account for user ID ' + req.params.id + ' was found!');
                    if (req.accepts("application/json")) {
                        res = setResponse('json', 201, res, foundAccount);
                    } else {
                        res = setResponse(json, 500, res, {Error: 'There was an error. Please check your request!'})
                    }
                    res.end();
                } else {
                    res = setResponse('error', 404, res, ('Money account does not exist!'));
                    res.end();
                }
            } catch (err) {
                console.log(err);
                res.status(500);
                res.end();
            }
        }
    }
});

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

    // Filter by money account ID
    if (request !== undefined) {
        // Filter by user ID
        if (request.id !== undefined && mongoose.Types.ObjectId.isValid(request.id)) {
            filter._id = request.id;
        }

        // Filter by user ID
        if (request.userAccountId !== undefined && mongoose.Types.ObjectId.isValid(request.userAccountId)) {
            filter._userAccountId = request.userAccountId;
        }

        if (request._userAccountId !== undefined && mongoose.Types.ObjectId.isValid(request._userAccountId)) {
            filter._userAccountId = request._userAccountId;
        }

        // Filter by currency
        if (request.currency !== undefined) {
            filter.currency = request.currency;
        }

        // Filter by amount
        if (request.amount !== undefined) {
            filter.amount = request.amount;
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

module.exports = router;
