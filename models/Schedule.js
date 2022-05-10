const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Routine = require('./Session');

const ScheduleSchema = exports.ScheduleSchema = new Schema({
    _coachId: {type: Schema.Types.ObjectId, ref: 'UserAccount', required: true},
    _clientId: {type: Schema.Types.ObjectId, ref: 'UserAccount', required: true},
    name: {type: String, required: true},
    sessions: {type: [Schema.Types.ObjectId], ref: 'Session', default: () => []}, // Day of the week
    startDate: {type: Date, required: true},
    endDate: {type: Date, required: true},
    creationDate: {type: Date, default: Date.now()}
});

mongoose.model('Schedule', ScheduleSchema);
