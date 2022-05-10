/** @module root/router */
'use strict';

require('../../models/UserAccount.js');
require('../../models/Service.js');
require('../../models/CoachClients.js');
require("dotenv").config({path: "../.env"});
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Service = mongoose.model('Service');
const Credentials = mongoose.model('Credentials');
const Transaction = mongoose.model('Transaction');
const MoneyAccount = mongoose.model('MoneyAccount');
const CoachClients = mongoose.model('CoachClients');

router.use(
    express.json({
        // We need the raw body to verify webhook signatures.
        // Let's compute it only when hitting the Stripe webhook endpoint.
        verify: function (req, res, buf) {
            if (req.originalUrl.startsWith("/webhook")) {
                req.rawBody = buf.toString();
            }
        }
    })
);

const getServiceData = async (request) => {
    try {
        let serviceFound = await Service.findById(request.serviceId);
        return serviceFound;
    } catch (err) {
        console.log(err);
    }
};

// Change to get actual currency when the system turns multi-currency, this is for demo purposes
function getClientCurrency() {
    return {locale: "en-CH", currency: "chf"};
}

router.post("/create-payment-intent", async (req, res) => {
    let request = getRequest(req);
    let service = await getServiceData(request);
    let amount = await service.fee * 100;
    let _coachId = await service._coachId;
    let duration = await service.duration;
    let description = await service.description;
    let locale = getClientCurrency().locale;
    let currency = getClientCurrency().currency;

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        description: description,
        statement_descriptor: "PushApp " + service.duration + "-month(s)",
        receipt_email: "erickgarro@gmail.com"
    });

    // Send publishable key and PaymentIntent details to server
    res.send({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        clientSecret: paymentIntent.client_secret,
        amount: amount,
        _coachId: _coachId,
        duration: duration,
        locale: locale,
        currency: currency,
        description: description,
        statement_descriptor: "PushApp " + service.duration + "-month(s)",
        receipt_email: "erickgarro@gmail.com"
    });
});

// Expose a endpoint as a webhook handler for asynchronous events.
// Configure your webhook in the stripe developer dashboard
// https://dashboard.stripe.com/test/webhooks
router.post("/webhook", async (req, res) => {
    let data, eventType;

    // Check if webhook signing is configured.
    if (process.env.STRIPE_WEBHOOK_SECRET) {
        // Retrieve the event by verifying the signature using the raw body and secret.
        let event;
        let signature = req.headers["stripe-signature"];
        try {
            event = stripe.webhooks.constructEvent(
                req.rawBody,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.log(`⚠️  Webhook signature verification failed.`);
            return res.sendStatus(400);
        }
        data = event.data;
        eventType = event.type;
    } else {
        // Webhook signing is recommended, but if the secret is not configured in `config.js`,
        // we can retrieve the event data directly from the request body.
        data = req.body.data;
        eventType = req.body.type;
    }

    if (eventType === "payment_intent.succeeded") {
        // Funds have been captured
        // Fulfill any orders, e-mail receipts, etc
        // To cancel the checkout after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
        console.log("💰 Payment captured!");
    } else if (eventType === "payment_intent.payment_failed") {
        console.log("❌ Payment failed.");
    }
    res.sendStatus(200);
});

// Remember to change percentages to data from the database
async function registerTransaction(req, amount, action) {
    let description, endDate, type;
    let startDate = new Date(0); // The 0 there is the key, which sets the date to the epoch
    startDate.setUTCSeconds(req.body.stripeTimestamp);
    endDate = new Date(startDate.setMonth(startDate.getMonth() + req.body.duration));

    switch (action) {
        case 'stripe':
            type = 'stripe';
            description = "Stripe: PushApp " + req.body.duration + "-month(s) membership";
            break;
        case 'commission':
            type = 'commission';
            description = 'Commission: StripeId: ' + req.body._stripeId;
            break;
        case 'payment':
            type = 'payment';
            description = 'Payment: StripeId: ' + req.body._stripeId;
            break;
        default:
            break;
    }

    let paymentTransaction = new Transaction({
        _stripeId: req.body._stripeId,
        amount: amount,
        currency: req.body.currency,
        description: description,
        status: req.body.status,
        _userId: req.body._userId,
        _coachId: req.body._coachId,
        type: type,
        startDate: startDate,
        endDate: endDate,
        stripeTimestamp: req.body.stripeTimestamp
    });

    return await paymentTransaction.save();
}

async function creditMoneyIntoAccount(userAccountId, amount) {
    try {
        let foundAccount = await MoneyAccount.findOne({_userAccountId: userAccountId});
        if (foundAccount !== null && !foundAccount.isDeleted) {
            console.log('Money account for user ID ' + userAccountId + ' was found!');
            let operation;

            if (amount > 0) {
                operation = 'Adding';
            } else {
                operation = 'Substracting';
            }
            foundAccount.balance += amount;
            console.log(operation + ' ' + foundAccount.currency.toUpperCase() + ' ' + amount + ' to the account ID ' + foundAccount._userAccountId);
            return await foundAccount.save();
        }
    } catch (e) {
        console.log(e);
    }
}

router.post("/register-transaction", async (req, res) => {
        try {
            if (req.get('Content-Type') === "application/json" && req.accepts("application/json") === "application/json" && req.body !== undefined) {
                let commissionPercentage = 0.25;
                let coachSharePercentage = 0.75;

                // Register transactions
                await registerTransaction(req, req.body.amount, 'stripe');
                await registerTransaction(req, req.body.amount * commissionPercentage, 'commission');
                await registerTransaction(req, req.body.amount * coachSharePercentage, 'payment');

                // Credit money into accounts
                let admin = await Credentials.findOne({username: 'admin'});
                await creditMoneyIntoAccount(admin._userAccountId, req.body.amount * commissionPercentage);
                await creditMoneyIntoAccount(req.body._coachId, req.body.amount * coachSharePercentage);

                // If client hasn't already hired a coach, will create the relationship
                let filter = {_coachId: req.body._coachId, _clientId: req.body._userId}
                let preHiredCoach = await CoachClients.findOne(filter);

                // If no hire relationship between coach and client is found, it creates it.
                if (!preHiredCoach) {
                    await hireCoach(req.body._coachId, req.body._userId);
                }

                if (req.accepts("text/html")) {
                    res = setResponse('json', 200, res);
                }
                res.end();
            } else {
                res = setResponse('json', 400, res, {Error: "Only application/json 'Accept' and 'Content-Type' is allowed."});
                res.end();
            }
        } catch
            (err) {
            console.log(err);
            res.status(500).end();
        }
    }
);

function hireCoach(coachId, clientId) {
    console.log('Creating a new relation coach-client.');
    let hire = new CoachClients({
        _coachId: coachId,
        _clientId: clientId,
    });
    hire.save()
        .then((saved) => {
            console.log(saved);
        })
        .catch((err) => {
            console.log(err);
        })
}

function getRequest(req) {
    let request;
    if (Object.keys(req.body).length > 0) {
        request = req.body;
    } else if (Object.keys(req.query).length > 0) {
        request = req.query;
    } else if (Object.keys(req.params).length > 0) {
        request = req.params;
    }
    return request;
}

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
