/** @module root/router */
'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dust = require('dustjs-helpers');//used for helper function inside dust files

require('../../models/Credential.js');
require('../../models/UserAccount.js');
require('../../models/ClientInfo.js');
require('../../models/CoachClients');
require('../../models/Exercise');
require('../../models/Session');
require('../../models/Schedule');
require('../../models/Service');
require('../../models/Transaction');
require('../../models/MoneyAccount');

let Credentials = mongoose.model('Credentials');
let UserAccount = mongoose.model('UserAccount');
let ClientInfo = mongoose.model('ClientInfo');
let CoachClients = mongoose.model('CoachClients');
let MoneyAccount = mongoose.model('MoneyAccount');

router.get('/test', function (req, res) {
    res.render('rating/rating-first.dust', {name: 'Moreno', id: '5de5094ec516ae82b90c9c44'});
});

router.get('/testing', function (req, res) {
    res.render('rating/rating-again.dust', {
        name: 'Moreno',
        score: 4,
        comment: "HE was very good",
        title: "awesome",
        objId: '5de7f4e3d9511123b9bfd669'
    });
});

router.get('/', function (req, res, next) {
    if (req.accepts("html")) {
        if (typeof req.user !== "undefined" && req.isAuthenticated()) {
            // console.log("ENTER");
            res.render('index', {title: 'PushApp', log: 'Y'});
        } else {
            // console.log("NOT ENTER");
            res.render('index', {title: 'PushApp'});
        }
    } else {
        res.status(500);
        res.end();
    }
});

// Renders index page without signup button and login buttons
function isLoggedIn(req, res, next) {
    console.log(req.path);
    if (req.user === undefined) {
        res.redirect('/login');
    } else if (req.isAuthenticated() && ("/" + req.user.username) === req.path) {
        return next();
    } else if (req.isAuthenticated() && ("/payments") === req.path) {
        return next();
    } else if (req.isAuthenticated() && ("/workouts") === req.path) {
        return next();
    } else if ("/money" === req.path) {
        return next();
    } else {
        // if they aren't render login page
        res.redirect('/login');
    }
}

/*router.get('/register', function (req, res) {
  if (req.accepts("html")) {
    res.render('register_forms/register_1');
  } else {
    res.status(500);
    res.end();
  }
})*/

router.get('/our-coaches', function (req, res) {
    if (req.accepts("html")) {
        res.render('our-coaches');
    } else {
        res.status(200);
        res.end();
    }
})

// Payments testing page
router.get('/checkout', async (req, res) => {
    console.log('Rendering checkout html...');
    res.render('checkout');
    res.end();
});

// Dynamic user route according to userAccount type
router.get('/:username', isLoggedIn, async (req, res, next) => {
    try {
        if (req.accepts("html")) {
            const filter = getFilter(req);

            if (req.path === '/login') {
                res.render('login.dust')
            } else if (req.path === '/register') {
                res.render('register_forms/choose_register');
            } else if (req.path === '/register-coach') {
                res.render('register_forms/coach-register');
            } else if (req.path === '/register-client') {
                res.render('register_forms/client-register');
            } else if (req.path === '/workouts') {
                res.render('workout');
            } else {
                let credentials = await Credentials.findOne(filter);
                if (credentials === null || credentials.username !== filter.username) {
                    // CHANGE FOR CUSTOM 404 PAGE
                    res = setResponse('json', 401, res, {Error: 'Unauthorized access!'});
                } else {
                    let activeUser = await UserAccount.findById({_id: credentials._userAccountId});

                    if (activeUser.accountType === 'client') {
                        if (req.path === "/workouts") {
                            await renderWorkout(res, activeUser);
                        }
                        await renderClientDashboard(res, activeUser);
                    }
                    if (activeUser.accountType === 'coach') {
                        await renderCoachDashboard(res, activeUser);
                    }
                    if (activeUser.accountType === 'admin') {
                        await renderAdminDashboard(res, activeUser);
                    }
                }
            }
        }
        res.end();
    } catch
        (err) {
        res.status(500);
        res.end();
    }
});


async function renderClientDashboard(res, activeUser) {
    let firstName;
    if (activeUser.firstName.length > 14) {
        firstName = activeUser.firstName.slice(0, 14) + '.';
    } else {
        firstName = activeUser.firstName;
    }

    let menu = {
        user:
            {
                firstName: firstName,
                photo: activeUser.photo,
                id: activeUser._id,
                form: activeUser.form,
            }
        ,
        items: [
            {name: "Dashboard", icon: "web"},
            // {name: "Chat", icon: "chat"},
            {name: "Coaches", icon: "group"},
        ],
        accordions: [
            // {
            //     title: "Progress",
            //     icon: "chevron_left",
            //     subItems: [
            //         {name: "Weight", icon: "show_chart"},
            //         {name: "Exercises", icon: "equalizer"},
            //         {name: "Volume of Training", icon: "multiline_chart"},
            //     ]
            // },
            {
                title: "Account",
                icon: "chevron_left",
                subItems: [
                    {name: "Settings", icon: "settings", accountType: "clients"},
                    {name: "Logout", icon: "person", logout: true},
                ]
            }
        ]
    };
    res.render("dashboard_client", menu);
}

async function renderWorkout(res, activeUser) {
    res.redirect("/workouts");
}

async function clientsDropdown(activeUser) {
    let clientsArray = [];
    if (activeUser.id !== undefined && !mongoose.Types.ObjectId.isValid(activeUser.id)) {
        return [];
    }
    try {
        let result = await CoachClients.find({_coachId: activeUser.id});
        if (result) {
            console.log(result);
            if (result.length > 0) {
                for (let i = 0; i < result.length; i++) {
                    try {
                        let found = await UserAccount.findById(result[i]._clientId);

                        let clientInfo = {
                            firstName: found.firstName,
                            lastName: found.lastName,
                            photo: found.photo,
                            _userAccountId: found._id
                        };
                        clientsArray.push(clientInfo);
                    } catch (e) {
                        console.log(e);
                        return [];
                    }
                }
            } else {
                console.log('No client hired you...');
                return [];
            }
        }
    } catch (e) {
        console.log(e);
        return [];
    }
    return clientsArray;
}

async function renderCoachDashboard(res, activeUser) {
    console.log("Active user ", activeUser);
    let firstName;
    if (activeUser.firstName.length > 10) {
        firstName = activeUser.firstName.slice(0, 10) + '.';
    } else {
        firstName = activeUser.firstName;
    }

    let menu = {
        user: {
            firstName: "Coach " + firstName,
            form: activeUser.form,
            id: activeUser._id,
            photo: activeUser.photo,
        },
        items: [
            {name: "Dashboard", icon: "web"},
            {name: "Clients", icon: "list"},
            {name: "MyService", icon: "dynamic_feed"}
        ],
        accordions:
            [
                {
                    title: "Account",
                    icon: "chevron_left",
                    subItems: [
                        {name: "Settings", icon: "settings", accountType: "coaches"},
                        {name: "Logout", icon: "person", logout: "true"},
                    ]
                }
            ],
        clients:
            await clientsDropdown(activeUser)
    }

    res.render("dashboard_coach.dust", menu);
}

async function renderAdminDashboard(res, activeUser) {
    if (activeUser.photo === null || activeUser.photo === ' ') {
        activeUser.photo = '/img/icons/unknown-user.png';
    }
    let menu = {
        user:
            {
                firstName: activeUser.firstName,
                photo: activeUser.photo
            }
        ,
        items: [
            {name: "Dashboard", icon: "web"},
        ],
        accordions: [
            {
                title: "Account",
                icon: "chevron_left",
                subItems: [
                    {name: "Settings", icon: "settings", accountType: "admin"},
                    {name: "Logout", icon: "person", logout: "true"},
                ]
            }
        ],
    };
    res.render("dashboard_admin.dust", menu);
}

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
        case 'html':
            return res.set('Content-Type', 'text/html');
        case 'error':
            res.json(msg);
            return res;
        default:
            break;
    }
}

//// USER ACCOUNT CREATION AND USER AUTHENTICATION
// router.get('/coach/dashboard', (req, res) => {
//     let menu = {
//         items: [
//             {name: "Dashboard", icon: "web"},
//             {name: "Clients", icon: "list"},
//             {name: "Schedules", icon: "dashboard"},
//             {name: "Chat", icon: "chat"},
//         ],
//         accordions: [
//             {
//                 title: "Accounting",
//                 icon: "chevron_left",
//                 subItems: [
//                     {name: "Revenue", icon: "show_chart"},
//                     {name: "Users", icon: "equalizer"},
//                     {name: "Conversion Rate", icon: "multiline_chart"},
//                 ]
//             },
//             {
//                 title: "Account",
//                 icon: "chevron_left",
//                 subItems: [
//                     {name: "Logout", icon: "person"},
//                     {name: "Settings", icon: "settings"},
//                 ]
//             }
//         ]
//     };
//     res.render("dashboard_coach.dust", menu);
// });

router.get('/coach/dashboard/clients', (req, res) => {
    let menu = {
        items: [
            {name: "Dashboard", icon: "web"},
            {name: "Clients", icon: "list"},
            {name: "Schedules", icon: "dashboard"},
            {name: "Chat", icon: "chat"},
            {link: "/client/coaches", name: "Coaches", icon: "group",},
        ],
        accordions: [
            {
                title: "Accounting",
                icon: "chevron_left",
                subItems: [
                    {name: "Revenue", icon: "show_chart"},
                    {name: "Users", icon: "equalizer"},
                    {name: "Conversion Rate", icon: "multiline_chart"},
                ]
            },
            {
                title: "Account",
                icon: "chevron_left",
                subItems: [
                    {name: "Settings", icon: "settings"},
                    {name: "Logout", icon: "person"},
                ]
            }
        ]
    };
    res.render("dashboard_coach_clients.dust", menu);
});

router.get('/client/coaches', (req, res) => {
    let menu = {
        items: [
            {name: "Dashboard", icon: "web"},
            {name: "Next Workout", icon: "list"},
            {name: "Schedule", icon: "dashboard"},
            {name: "Chat", icon: "chat"},
            {name: "Coaches", icon: "group"},
        ],
        accordions: [
            {
                title: "Progress",
                icon: "chevron_left",
                subItems: [
                    {name: "Weight", icon: "show_chart"},
                    {name: "Exercises", icon: "equalizer"},
                    {name: "Volume of Training", icon: "multiline_chart"},
                ]
            },
            {
                title: "Account",
                icon: "chevron_left",
                subItems: [
                    {name: "Settings", icon: "settings"},
                    {name: "Logout", icon: "person", logout: true},
                ]
            }
        ]
    };
    res.render("coachesList_dashboard_client.dust", menu);
});
// router.get("/client/dashboard", (req, res) => {
//     let menu = {
//         items: [
//             {name: "Dashboard", icon: "web"},
//             {name: "Next Workout", icon: "list"},
//             {name: "Schedule", icon: "dashboard"},
//             {name: "Chat", icon: "chat",},
//         ],
//         accordions: [
//             {
//                 title: "Progress",
//                 icon: "chevron_left",
//                 subItems: [
//                     {name: "Weight", icon: "show_chart"},
//                     {name: "Exercises", icon: "equalizer"},
//                     {name: "Volume of Training", icon: "multiline_chart"},
//                 ]
//             },
//             {
//                 title: "Account",
//                 icon: "chevron_left",
//                 subItems: [
//                     {name: "Logout", icon: "person"},
//                     {name: "Settings", icon: "settings"},
//                 ]
//             }
//         ]
//     };
//     res.render("dashboard_client", menu)
// });

// router.get('/auth', function (req, res) {
//     res.render('login.dust')
// });

/** router for /root */
module.exports = router;
