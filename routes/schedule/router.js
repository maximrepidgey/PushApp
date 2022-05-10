/** @module root/router */
'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');


require('../../models/Exercise.js');
require('../../models/Schedule.js');
//require('../../models/Routine.js');

let Exercise = mongoose.model('Exercise');
let Schedule = mongoose.model('Schedule');
//let Routine = mongoose.model('Routine');


router.post("/create-exercise", (req, res) => {
  let exercise = new Exercise({
    name : req.body.name,
    description : req.body.description,
    feedback : req.body.feedback,
    weightUnit : req.body.weightUnit,
    pumpWeight: req.body.pumpWeight,
    bodyPart: req.body.bodyPart,
    set: req.body.set,
    repetitions : req.body.repetitions
  });
  exercise.save()
    .then(savedExercise => {
      console.log(savedExercise, " Saved");
      if (req.accepts("text/html")) {
        res.status(201);
        res.render("workout", {exercise : savedExercise });
      } else if (req.accepts("application/json")) {
        res.contentType("application/json");
        res.send(savedExercise);
      }
    })
});


router.post("/create-routine", (req, res) => {
  let schedule = new ({
    day : req.body.day,
    duration : req.body.duration,
    difficultyLevel : req.body.difficultyLevel,
    bodyParts : req.body.bodyParts
  });

  schedule.save()
    .then(savedRoutine => {

    })

});


router.post("/create-schedule", (req, res) => {
  let schedule = new Schedule({
    creationDate : req.body.creationDate,
    finalDate : req.body.finalDate,
    duration : req.body.duration,
    routines : req.body.routines
  });
});

router.get("/workout", (req, res) => {

  res.render("workout", {});
});


/** router for /root */
module.exports = router;
