const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExerciseSchema = exports.ExerciseSchema = new Schema({
    name: {type: String, required: true},
    description: {type: String, required: true}, // TODO description taken from the API
    comment: {type: String},
    weightUnit: {type: String, required: true},
    pumpWeight: {type: Number, required: true},
    bodyPart: {type: String, required: true},    //taken from the API(?)
    set: {type: Number, required: true},
    repetitions: {type: Number, required: true}
});
mongoose.model('Exercise', ExerciseSchema);
