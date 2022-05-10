/** @module root/router */
'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
let ObjectId = require('mongodb').ObjectID;

require('../../models/Schedule.js');
require('../../models/Session.js');
require('../../models/Exercise.js');
require('../../models/ExerciseControl.js');
require('../../models/SessionControl.js');
require('../../models/Credential.js');
require('../../models/UserAccount.js');
require('../../models/CoachClients.js');
require('../../models/Notification.js');
require('../../models/Rating.js');

let Session = mongoose.model('Session');
let Exercise = mongoose.model('Exercise');
let ExerciseControl = mongoose.model('ExerciseControl');
let UserAccount = mongoose.model('UserAccount');
let CoachClients = mongoose.model('CoachClients');
let Transaction = mongoose.model('Transaction');

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

function getFilter(user, type) {
    switch (type) {
        case 'revenue':
            if (user.accountType === 'admin') {
                return {type: 'stripe'};
            }
            if (user.accountType === 'coach') {
                return {type: 'payment', _coachId: user._id}
            }
            break;
        case 'profit':
            if (user.accountType === 'admin') {
                return {type: 'commission'};
            }
            break;
        case 'payments':
            if (user.accountType === 'admin') {
                return {type: 'payment'};
            }
            break;
        case 'coaches':
            if (user.accountType === 'admin') {
                return {accountType: 'coach'};
            }
        case 'clients':
            if (user.accountType === 'admin') {
                return {accountType: 'client'};
            }
            if (user.accountType === 'coach') {
                return {accountType: 'client', _coachId: user._id};
            }
            break;
    }
}

function count(ary, classifier) {
    classifier = classifier || String;
    return ary.reduce(function (counter, item) {
        var p = classifier(item);
        counter[p] = counter.hasOwnProperty(p) ? counter[p] + 1 : 1;
        return counter;
    }, {})
}

function sum(ary, classifier) {
    classifier = classifier || String;
    return ary.reduce(function (sum, item) {
        var p = classifier(item);
        sum[p] = sum.hasOwnProperty(p) ? sum[p] + 1 : item.amount;
        return sum;
    }, {})
}

function arraySort(arr) {
    let sortedArr = {};
    Object.keys(arr).sort((a, b) => {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    }).forEach(function (key) {
        sortedArr[key] = arr[key];
    });
    return sortedArr;
}

//STATISTICS
router.get('/:action', isLoggedIn, async (req, res) => {
// router.get('/:action', async (req, res) => {
        try {
            if ((req.get('Content-Type') === "application/json" && req.get('Accept') === "application/json") || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.get('Accept') === "application/json")) {
                let user = await UserAccount.findOne({_id: req.user._userAccountId});
                // let user = await UserAccount.findOne({_id: req.headers.userid});
                if (user == null) {
                    res = setResponse('json', 404, res, {stats: null});
                } else {
                    let filter = getFilter(user, req.params.action);
                    let transactions, users;

                    if (req.params.action === 'coaches' || req.params.action === 'clients') {
                        users = await UserAccount.find(filter);
                        if (!users) {
                            let noData = {'No user data yet': '0'};
                            res = setResponse('json', 404, res, {stats: noData});
                        } else {
                            // Returns dataset date: count
                            users.forEach(user => {
                                let userCount = count(users, function (user) {
                                    return user.creationDate.toISOString().split("T")[0]
                                });
                                res = setResponse('json', 200, res, {stats: userCount});
                            })
                        }
                    } else {
                        transactions = await Transaction.find(filter);
                        if (!transactions) {
                            let noData = {'Upon your first sale, your data will appear here': '0'};
                            res = setResponse('json', 404, res, {stats: noData});
                        } else {
                            // Returns dataset date: sum
                            transactions.forEach(transaction => {
                                let transactionCount = sum(transactions, function (transaction) {
                                    return transaction.creationDate.toISOString().split("T")[0]
                                });

                                // Adds a zero sales day before first sale for display purposes in graph
                                let firstDate = new Date(Object.keys(transactionCount)[0]);
                                firstDate.setDate(firstDate.getDate() - 1);
                                firstDate = firstDate.toISOString().split("T")[0];
                                transactionCount[firstDate] = 0;
                                transactionCount = arraySort(transactionCount);

                                res = setResponse('json', 200, res, {stats: transactionCount});
                            })
                            // res = setResponse('json', 200, res, {transactions: transactions});
                        }
                    }
                }
                res.end();
            } else {
                console.log("Error, bad request");
                res.status(400);
                res.end();
            }
        } catch
            (e) {
            console.log(e);
        }
    }
);

router.get('/all', isLoggedIn, async (req, res) => {
    if ((req.get('Content-Type') === "application/json" && req.get('Accept') === "application/json") || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.get('Accept') === "application/json")) {
        let userSessions = await Session.findOne({_clientId: req.user._userAccountId, weekday: req.body.day});
        if (userSessions == null) {
            res = setResponse('json', 200, res, {exercises: null});
            res.end();
            return
        }
        let exerciseProgress = [];
        let exerciseNames = [];
        for (let i = 0; i < userSessions.exercises.length; i++) {
            exerciseProgress[i] = await ExerciseControl.find({exercise: userSessions.exercises[i]});
            let exercise = await Exercise.findOne({_id: userSessions.exercises[i]});
            exerciseNames.push(exercise.name);
            console.log(exercise.name);
        }
        res = setResponse('json', 200, res, {exercises: exerciseProgress, exerciseNames: exerciseNames});
        res.end();
    } else {
        console.log("Error, bad request");
        res.status(400);
        res.end();
    }
});

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
