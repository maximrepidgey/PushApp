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

let Schedule = mongoose.model('Schedule');
let Session = mongoose.model('Session');
let Exercise = mongoose.model('Exercise');
let SessionControl = mongoose.model('SessionControl');
let ExerciseControl = mongoose.model('ExerciseControl');
let Credentials = mongoose.model('Credentials');
let UserAccount = mongoose.model('UserAccount');
let CoachClients = mongoose.model('CoachClients');
let Notification = mongoose.model('Notification');
let Rating = mongoose.model('Rating');

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

//STATISTICS
router.post('/statistics/', isLoggedIn, async (req, res) => {
    if ((req.get('Content-Type') === "application/json" && req.get('Accept') === "application/json") || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.get('Accept') === "application/json")) {
        let userSessions = await Session.findOne({ _clientId: req.user._userAccountId, weekday: req.body.day });
        if (userSessions == null) {
            res = setResponse('json', 200, res, { exercises: null });
            res.end();
            return
        }
        let exerciseProgress = [];
        let exerciseNames = [];
        for (let i = 0; i < userSessions.exercises.length; i++) {
            exerciseProgress[i] = await ExerciseControl.find({ exercise: userSessions.exercises[i] });
            let exercise = await Exercise.findOne({ _id: userSessions.exercises[i] });
            exerciseNames.push(exercise.name);
            console.log(exercise.name);
        }
        res = setResponse('json', 200, res, { exercises: exerciseProgress, exerciseNames: exerciseNames });
        res.end();
    } else {
        console.log("Error, bad request");
        res.status(400);
        res.end();
    }
});

//NOTIFICATIONS
router.get('/notification/:id?', isLoggedIn, async (req, res) => {
    if ((req.get('Content-Type') === "application/json" && req.get('Accept') === "application/json") || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.get('Accept') === "application/json")) {
        if (req.params.id) {
            console.log("Given id", req.params.id);
            let notification = await Notification.findOne({ _id: req.params.id });
            notification.viewed = true;
            let savedNotification = await notification.save();
            res = setResponse('json', 200, res, { notification: notification });
            res.end();
        } else {
            let notifications = await Notification.find({ viewed: false, for: req.user._userAccountId });
            console.log(notifications);
            for (let i = 0; i < notifications.length; i++) {
                console.log(notifications[i]);
                notifications[i].viewed = true;
                let saved = await notifications[i].save();
                if (i === notifications.length - 1) {
                    res = setResponse('json', 200, res, { notifications: notifications });
                    res.end();
                }
            }

        }
    } else {
        console.log("Error, bad request");
        res.status(400);
        res.end();
    }
});

router.post('/notification', isLoggedIn, async (req, res) => {
    if ((req.get('Content-Type') === "application/json" && req.get('Accept') === "application/json") || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.get('Accept') === "application/json")) {
        if (req.body.from && req.body.for && req.body.comments) {
            console.log(req.body);
            let notification = new Notification({
                from: req.body.from,
                for: req.body.for,
                exerciseName: req.body.exerciseName,
                repetitions: req.body.repetitions,
                weight: req.body.weight,
                sets: req.body.sets,
                comments: req.body.comments,
                userName: req.body.userName,
                typeofMessage: req.body.typeofMessage,
            });
            let savedNotification = await notification.save();
            res = setResponse('json', 200, res, { notification: notification });
            res.end();
        } else {
            console.log("Error, bad request");
            res.status(400);
            res.end();
        }
    } else {
        console.log("Error, bad request");
        res.status(400);
        res.end();
    }
});


/* GETS */
// Get ALL at /workouts root, not serving data
router.get('/begin', isLoggedIn, async (req, res) => {
    if ((req.get('Content-Type') === "application/json" && req.get('Accept') === "application/json") || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.get('Accept') === "application/json")) {
        try {
            let weekDay = getWeekDay();
            //The information that is going to be sent to the frontend composed with
            // ExerciseControl id and all the information about the realisation o the exercise
            let sessionExercises = [];
            // If any workout has no finishDate, add the actual day and save it
            let found = await SessionControl.find({ finishDate: null });
            if (found.length > 0) {
                found.forEach(found => {
                    found.finishDate = Date.now();
                    found.save().then(saved => {
                        console.log("Modified Date");
                    });
                });
            }
            //Retrieve user account id with the req parameters
            let accountId = req.user._userAccountId;
            //Find the sessions a client has
            let session = await Session.findOne({ _clientId: accountId, weekday: weekDay });
            if (!session) {
                //Rest day. We should return a template for rest day
                console.log("Rest Day");
                return;
            }
            // Save the session control object
            let sessionControl = new SessionControl({
                _clientId: accountId,
            });
            // For each exercise in the session we create an exercise control
            for (let i = 0; i < session.exercises.length; i++) {
                let exercise = session.exercises[i];
                let auxExercise = {};
                let exerciseControl;
                let ex = await Exercise.findOne({ _id: exercise });
                auxExercise = {
                    name: ex.name,
                    description: ex.description,
                    comment: ex.comment,
                    weightUnit: ex.weightUnit,
                    pumpWeight: ex.pumpWeight,
                    set: ex.set,
                    repetitions: ex.repetitions,
                };
                exerciseControl = new ExerciseControl({
                    exercise: exercise,
                    weight: auxExercise.pumpWeight,
                    repetitions: auxExercise.repetitions,
                    sets: auxExercise.set,
                });
                let savedExerciseControl = await exerciseControl.save();
                sessionControl.exercises.push(savedExerciseControl._id);
                auxExercise.id = savedExerciseControl._id;
                sessionExercises.push({ exercise: auxExercise });
                var savedSessionControl = await sessionControl.save();
            }
            if (savedSessionControl) {
                res = setResponse('json', 200, res, { exercises: sessionExercises });
                res.end();
            }

        } catch (err) {
            console.log(err + "this is an error");
            res.status(500);
            res.end();
        }
    } else {
        res.status(500);
        res.end();
    }
});

router.post("/update-exercise-control/:id", isLoggedIn, async (req, res) => {
    if ((req.get('Content-Type') === "application/json" && req.get('Accept') === "application/json") || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.get('Accept') === "application/json")) {
        let exerciseControl = await ExerciseControl.findOne({ _id: req.params.id });
        let exercise = await Exercise.findOne({ _id: exerciseControl.exercise });
        let clientId = req.user._userAccountId;
        let clientCoachRelation = await CoachClients.findOne({ _clientId: clientId });
        let coachId = clientCoachRelation._coachId;

        let changes = {
            weight: req.body.weight || exercise.pumpWeight,
            repetitions: req.body.repetitions || exercise.repetitions,
            sets: req.body.sets || exercise.set,
            feedback: req.body.comments,
        };
        exerciseControl.weight = changes.weight;
        exerciseControl.repetitions = changes.repetitions;
        exerciseControl.sets = changes.sets;
        exerciseControl.feedback = changes.feedback;
        let saved = await exerciseControl.save();
        console.log("User", req.user);
        res = setResponse('json', 201, res, {
            clientId: req.user._userAccountId,
            clientUsername: req.user.username,
            coachId: coachId
        });
        res.end();

    } else {
        console.log("Error, bad request");
        res.status(400);
        res.end();
    }
});

let newRating = async (req, res, next) => {
    //no need to parse json, because the headers are set correctly to application/json
    let body = req.body;
    if (body.new === 'Y') {
        try {
            let rate = new Rating({
                _clientId: req.user._userAccountId,
                _coachId: ObjectId(body.id),
                score: body.score,
                comment: body.comment,
                title: body.title
            });

            await rate.save();
            next();
        } catch (e) {
            console.log(e);
            res.status(500).end("SOME ERROR with saving")
        }
    } else {
        next()
    }
}

let oldRating = async (req, res, next) => {
    //no need to parse json, because the headers are set correctly to application/json
    let body = req.body;
    if (req.body.new === 'N') {
        try {
            console.log(body);
            let found = await Rating.findById(ObjectId(body.objId));
            found.title = body.title;
            found.comment = body.comment;
            found.score = body.score;
            await found.save();
            next();
        } catch (e) {
            console.log(e);
            res.status(500).end();
        }
    } else {
        next()
    }
}
router.post('/finish-workout', isLoggedIn, newRating, oldRating, async (req, res) => {
    if (req.get('Content-Type') === "application/json" && req.accepts("text/html")) {
        try {
            // If any workout has no finishDate, add the actual date and save it
            let found = await SessionControl.find({ finishDate: null });
            if (found) {
                found.forEach(found => {
                    found.finishDate = Date.now();
                    found.save().then(saved => {
                        console.log("Modified Date");
                    })
                });
            }
            console.log(req.user);
            let activeUser = await UserAccount.findById(req.user._userAccountId);
            let menu = {
                user:
                {
                    firstName: activeUser.firstName,
                    photo: activeUser.photo
                }
                ,
                items: [
                    { name: "Dashboard", icon: "web" },
                    { name: "Next Workout", icon: "list" },
                    { name: "Schedule", icon: "dashboard" },
                    { name: "Chat", icon: "chat" },
                    { name: "Coaches", icon: "group" },
                ],
                accordions: [
                    {
                        title: "Progress",
                        icon: "chevron_left",
                        subItems: [
                            { name: "Weight", icon: "show_chart" },
                            { name: "Exercises", icon: "equalizer" },
                            { name: "Volume of Training", icon: "multiline_chart" },
                        ]
                    },
                    {
                        title: "Account",
                        icon: "chevron_left",
                        subItems: [
                            { name: "Logout", icon: "person", logout: true },
                            { name: "Settings", icon: "settings", accountType: "clients" },
                        ]
                    }
                ]
            };
            console.log("render");
            res.render("dashboard_client", menu);
        } catch (err) {
            console.log(err + "this is an error");
            res.status(500);
            res.end();
        }
    } else {
        console.log("Skipped");
        res.status(200);
        res.json({ finished: true });
        res.end();
    }
});


// Get ALL schedules
router.get('/schedules', async (req, res) => {
    if ((req.get('Content-Type') === "application/json" && req.get('Accept') === "application/json") || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.get('Accept') === "application/json")) {
        try {
            let found = await Schedule.find({});
            res = setResponse('json', 200, res, found);
            res.end();
        } catch (err) {
            console.log(err);
            res.status(500);
            res.end();
        }
    } else {
        res.status(500);
        res.end();
    }
});

// Get ALL sessions
router.get('/sessions', async (req, res) => {
    if ((req.get('Content-Type') === "application/json" && req.get('Accept') === "application/json") || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.get('Accept') === "application/json")) {
        try {
            let found = await Session.find({});
            res = setResponse('json', 200, res, found);
            res.end();
        } catch (err) {
            console.log(err);
            res.status(500);
            res.end();
        }
    } else {
        res.status(500);
        res.end();
    }
});

// Get ALL exercises
router.get('/exercises', async (req, res) => {
    if ((req.get('Content-Type') === "application/json" && req.get('Accept') === "application/json") || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.get('Accept') === "application/json")) {
        try {
            let found = await Exercise.find({});
            res = setResponse('json', 200, res, found);
            res.end();
        } catch (err) {
            console.log(err);
            res.status(500);
            res.end();
        }
    } else {
        res.status(400);
        res.end();
    }
});

/* SEARCHES BY... */
// Search schedules by...
router.get('/schedules/search', async (req, res) => {
    if ((req.get('Content-Type') === "application/json" && req.get('Accept') === "application/json") || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.get('Accept') === "application/json")) {
        try {
            let filter = getFilter(req);
            let found = await Schedule.findOne(filter);
            if (found !== null) {
                res = setResponse('json', 200, res, found);
            } else {
                res = setResponse('json', 404, res, {});
            }
            res.end();
        } catch (err) {
            console.log(err);
            res.status(500);
            res.end();
        }
    } else {
        res.status(500);
        res.end();
    }
});

// Search sessions by...
router.get('/sessions/search', async (req, res) => {
    if ((req.get('Content-Type') === "application/json" && req.get('Accept') === "application/json") || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.get('Accept') === "application/json")) {
        try {
            let filter = getFilter(req);
            let found = await Session.findOne(filter);
            if (found !== null) {
                res = setResponse('json', 200, res, found);
            } else {
                res = setResponse('json', 404, res, {});
            }
            res.end();
        } catch (err) {
            console.log(err);
            res.status(500);
            res.end();
        }
    } else {
        res.status(500);
        res.end();
    }
});

// Search exercises by...
router.get('/exercises/search', async (req, res) => {
    if ((req.get('Content-Type') === "application/json" && req.get('Accept') === "application/json") || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.get('Accept') === "application/json")) {
        try {
            let filter = getFilter(req);
            let found = await Exercise.findOne(filter);
            if (found !== null) {
                res = setResponse('json', 200, res, found);
            } else {
                res = setResponse('json', 404, res, {});
            }
            res.end();
        } catch (err) {
            console.log(err);
            res.status(500);
            res.end();
        }
    } else {
        res.status(500);
        res.end();
    }
});

router.get('/exercises/findById/:id', async (req, res) => {
    if ((req.get('Content-Type') === "application/json" && req.get('Accept') === "application/json") || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.get('Accept') === "application/json")) {
        try {
            let filter = getFilter(req);
            let found = await Exercise.findById(filter);
            if (found !== null) {
                res = setResponse('json', 200, res, found);
            } else {
                res = setResponse('json', 404, res, {});
            }
            res.end();
        } catch (err) {
            console.log(err);
            res.status(500);
            res.end();
        }
    } else {
        res.status(500);
        res.end();
    }
});

/* POSTS */
// Create new schedule
router.post('/schedules/new', async (req, res) => {
    try {
        if ((req.get('Content-Type') === "application/json" && req.accepts("application/json")) || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.accepts("application/json"))) {
            console.log('Creating new schedule...');

            if (req.body._coachId === undefined &&
                req.body._clientId === undefined &&
                req.body.name === undefined &&
                req.body.startDate === undefined &&
                req.body.endDate === undefined) {
                res = setResponse('json', 400, res, { Error: "Coach ID, Client ID, schedule name, start date and final date must be provided" });
            } else {
                let schedule = new Schedule({
                    _coachId: req.body._coachId,
                    _clientId: req.body._clientId,
                    name: req.body.name,
                    startDate: req.body.startDate,
                    endDate: req.body.endDate
                });

                let savedSchedule = await schedule.save();
                res = setResponse('json', 200, res, savedSchedule);
            }
        } else {
            res = setResponse('json', 400, res, { Error: "Only application/json and application/x-www-form-urlencoded 'Content-Type' is allowed." });
        }
        res.end();
    } catch (err) {
        console.log(err);
        res.status(500).end();
    }
});

// Create new session
router.post('/sessions/new', async (req, res) => {
    try {
        if ((req.get('Content-Type') === "application/json" && req.accepts("application/json")) || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.accepts("application/json"))) {
            console.log('Creating new session...');

            if (req.body._coachId === undefined &&
                req.body._clientId === undefined &&
                req.body.weekday === undefined &&
                req.body.exercises === undefined) {
                res = setResponse('json', 400, res, { Error: "Coach ID, Client ID and weekday must be provided" });
            } else {
                let session = new Session({
                    _coachId: req.body._coachId,
                    _clientId: req.body._clientId,
                    weekday: req.body.weekday,
                    exercises: req.body.exercises,
                });

                if (req.body.duration !== undefined) {
                    session.duration = req.body.duration;
                }

                let savedSession = await session.save();
                res = setResponse('json', 200, res, savedSession);
            }
        } else {
            res = setResponse('json', 400, res, { Error: "Only application/json and application/x-www-form-urlencoded 'Content-Type' is allowed." });
        }
        res.end();
    } catch (err) {
        console.log(err);
        res.status(500).end();
    }
});

// Create new exercise
router.post('/exercises/new', async (req, res) => {
    try {
        if ((req.get('Content-Type') === "application/json" && req.accepts("application/json")) || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.accepts("application/json"))) {
            console.log('Creating new exercise...');

            if (req.body.name === undefined &&
                req.body.description === undefined &&
                req.body.weightUnit === undefined &&
                req.body.pumpWeight === undefined &&
                req.body.bodyPart === undefined &&
                req.body.set === undefined &&
                req.body.repetitions === undefined) {
                res = setResponse('json', 400, res, { Error: "Exercise sequence number, name, description, weight units, pump weight, body part, set and repetitions must be provided." });
            } else {
                let exercise = new Exercise({
                    name: req.body.name,
                    description: req.body.description,
                    weightUnit: req.body.weightUnit,
                    pumpWeight: req.body.pumpWeight,
                    bodyPart: req.body.bodyPart,
                    set: req.body.set,
                    repetitions: req.body.repetitions
                });

                let savedExercise = await exercise.save();
                res = setResponse('json', 200, res, savedExercise);
            }
        } else {
            res = setResponse('json', 400, res, { Error: "Only application/json and application/x-www-form-urlencoded 'Content-Type' is allowed." });
        }
        res.end();
    } catch (err) {
        console.log(err);
        res.status(500).end();
    }
});

/* PUTS */
// Update schedule // pending push to sessions[]
router.put('/schedules/edit/:id', async (req, res) => {
    try {
        if ((req.get('Content-Type') === "application/json" && req.accepts("application/json")) || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.accepts("application/json"))) {
            console.log('Editing schedule...');
            console.log('Searching for schedule with ID: ' + req.params.id + '.');
            let found = await Schedule.findById({ _id: req.params.id });

            if (found !== null) {
                if (req.body.name === undefined) {
                    found.name = req.body.name;
                }
                if (req.body.startDate === undefined) {
                    found.startDate = req.body.startDate;
                }
                if (req.body.endDate === undefined) {
                    found.endDate = req.body.endDate;
                }
                if (req.body.sessions !== undefined) { // assigns sessions to schedule
                    found.sessions = req.body.sessions;
                }
                let saved = await found.save();
                res = setResponse('json', 200, res, saved);
            } else {
                res = setResponse('json', 404, res);
            }
        } else {
            res = setResponse('json', 400, res, { Error: "Only application/json and application/x-www-form-urlencoded 'Content-Type' is allowed." });
        }
        res.end();
    } catch (err) {
        console.log(err);
        res.status(500).end();
    }
});

// Update session // pending push to exercises[]
router.put('/sessions/edit/:id', async (req, res) => {
    try {
        if ((req.get('Content-Type') === "application/json" && req.accepts("application/json")) || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.accepts("application/json"))) {
            console.log('Editing session...');
            console.log('Searching for session with ID: ' + req.params.id + '.');
            let found = await Session.findById({ _id: req.params.id });

            if (found !== null) {
                if (req.body.weekday !== undefined) {
                    found.weekday = req.body.weekday;
                }
                if (req.body.duration !== undefined) {
                    found.duration = req.body.duration;
                }
                if (req.body.exercises !== undefined) { // assigns exercises to session
                    found.exercises = req.body.exercises;
                }
                let saved = await found.save();
                res = setResponse('json', 200, res, saved);
            } else {
                res = setResponse('json', 404, res);
            }
        } else {
            res = setResponse('json', 400, res, { Error: "Only application/json and application/x-www-form-urlencoded 'Content-Type' is allowed." });
        }
        res.end();
    } catch (err) {
        console.log(err);
        res.status(500).end();
    }
});

// Update exercise
router.put('/exercises/edit/:id', async (req, res) => {
    try {
        if ((req.get('Content-Type') === "application/json" && req.accepts("application/json")) || (req.get('Content-Type') === "application/x-www-form-urlencoded" && req.accepts("application/json"))) {
            console.log('Editing exercise...');

            if (req.body.name === undefined &&
                req.body.description === undefined &&
                req.body.weightUnit === undefined &&
                req.body.pumpWeight === undefined &&
                req.body.bodyPart === undefined &&
                req.body.set === undefined &&
                req.body.repetitions === undefined) {
                res = setResponse('json', 400, res, { Error: "Exercise name, description, weight units, pump weight, body part, set and repetitions must be provided." });
            } else {
                let exercise = new Exercise({
                    name: req.body.name,
                    description: req.body.description,
                    weightUnit: req.body.weightUnit,
                    pumpWeight: req.body.pumpWeight,
                    bodyPart: req.body.bodyPart,
                    set: req.body.set,
                    repetitions: req.body.repetitions
                });

                if (req.body.comment === undefined) {
                    exercise.comment = req.body.comment;
                }

                let savedExercise = await exercise.save();
                res = setResponse('json', 200, res, savedExercise);
            }
        } else {
            res = setResponse('json', 400, res, { Error: "Only application/json and application/x-www-form-urlencoded 'Content-Type' is allowed." });
        }
        res.end();
    } catch (err) {
        console.log(err);
        res.status(500).end();
    }
});

/* DELETE */
// Deletes an schedule
router.delete('/schedules/delete/:id', async (req, res) => {
    try {
        if (req.accepts("json")) {
            let found = await Schedule.findById({ _id: req.params.id });
            await found.remove();
            console.log('Schedule with ID ' + req.params.id + ' was successfully deleted!');
            if (req.accepts("text/html")) {
                res = setResponse('html', 200, res);
            } else if (req.accepts("application/json")) {
                res = setResponse('json', 200, res, { Result: `Schedule with ID ` + found._id.toString() + ` was successfully deleted!` });
            }
        } else {
            res = setResponse('error', 404, res, { Error: 'Schedule not found!' });
        }
        res.end();
    } catch (err) {
        console.log(err);
        res.status(500);
        res.end();
    }
});

// Deletes an schedule
router.delete('/sessions/delete/:id', async (req, res) => {
    try {
        if (req.accepts("json")) {
            let found = await Session.findById({ _id: req.params.id });
            await found.remove();
            console.log('Session with ID ' + req.params.id + ' was successfully deleted!');
            if (req.accepts("text/html")) {
                res = setResponse('html', 200, res);
            } else if (req.accepts("application/json")) {
                res = setResponse('json', 200, res, { Result: `Session with ID ` + found._id.toString() + ` was successfully deleted!` });
            }
        } else {
            res = setResponse('error', 404, res, { Error: 'Session not found!' });
        }
        res.end();
    } catch (err) {
        console.log(err);
        res.status(500);
        res.end();
    }
});

// Deletes an exercise
router.delete('/exercises/delete/:id', async (req, res) => {
    try {
        if (req.accepts("json")) {
            let found = await Exercise.findById({ _id: req.params.id });
            await found.remove();
            console.log('Exercise with ID ' + req.params.id + ' was successfully deleted!');
            if (req.accepts("text/html")) {
                res = setResponse('html', 200, res);
            } else if (req.accepts("application/json")) {
                res = setResponse('json', 200, res, { Result: `Exercise with ID ` + found._id.toString() + ` was successfully deleted!` });
            }
        } else {
            res = setResponse('error', 404, res, { Error: 'Exercise not found!' });
        }
        res.end();
    } catch (err) {
        console.log(err);
        res.status(500);
        res.end();
    }
});

// HELPERS //
// Creates filter for searching workout related documents on the database
function getFilter(req) {
    const filter = {};
    let request;

    if (Object.keys(req.body).length > 0) {
        request = req.body;
    }
    if (Object.keys(req.query).length > 0) {
        request = req.query;
    }
    if (Object.keys(req.params).length > 0) {
        request = req.params;
    }

    if (request !== undefined) {
        // Filter by ID
        if (request._id !== undefined && mongoose.Types.ObjectId.isValid(request._id)) {
            filter._id = request._id;
        }

        if (request.id !== undefined && mongoose.Types.ObjectId.isValid(request.id)) {
            filter._id = request.id;
        }

        // Filter by name
        if (request.name !== undefined) {
            filter.name = request.name;
        }

        // Filter by body part
        if (request.bodyPart !== undefined) {
            filter.bodyPart = request.bodyPart;
        }

        // Filter by start date
        if (request.startDate !== undefined) {
            filter.startDate = request.startDate;
        }

        // Search by end date
        if (request.endDate !== undefined) {
            filter.endDate = request.endDate;
        }

        // Search by weekday
        if (request.weekday !== undefined) {
            filter.weekday = request.weekday;
        }

        // Search by duration
        if (request.duration !== undefined) {
            filter.duration = request.duration;
        }

        // Search by coachId
        if (request._coachId !== undefined) {
            filter._coachId = request._coachId;
        }

        // Search by coachId
        if (request._clientId !== undefined) {
            filter._clientId = request._clientId;
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

//Given a date retrieves day in the week
function getWeekDay() {
    let now = new Date();
    let orderDay = now.getDay();
    switch (orderDay) {
        case 1:
            return "Monday";
        case 2:
            return "Tuesday";
        case 3:
            return "Wednesday";
        case 4:
            return "Thursday";
        case 5:
            return "Friday";
        case 6:
            return "Saturday";
        case 7:
            return "Sunday";
        default:
            return "Error";
    }
}


module.exports = router;
