const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExerciseControl = exports.ExerciseControl = new Schema({
  exercise: {type: Schema.Types.ObjectId, ref: 'Exercise', required: true},
  weight : {type : Number, default: 10},
  repetitions : {type : Number, default: 10},
  sets : {type : Number, default: 10},
  feedback : {type : String, default: ""},
  date: {type: Date, required: true, default: Date.now()},

});

mongoose.model('ExerciseControl', ExerciseControl);
