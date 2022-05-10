const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Exercise = require('./Exercise');

const SessionSchema = exports.SessionSchema = new Schema({
    _coachId: {type: Schema.Types.ObjectId, ref: 'UserAccount', required: true},
    _clientId: {type: Schema.Types.ObjectId, ref: 'UserAccount', required: true},
    weekday: {type: String, required: true},
    exercises: {type: [Schema.Types.ObjectId], ref: 'Exercise', default: () => []},
    duration: {type: Number, default: 0},
    bodyPart: {type: String},
});

mongoose.model('Session', SessionSchema);
