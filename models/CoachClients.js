const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const CoachClientsSchema = exports.CoachClientsSchema = new Schema({
    _coachId: {type: Schema.Types.ObjectId, ref: 'UserAccount', required: true},
    _clientId: {type: Schema.Types.ObjectId, ref: 'UserAccount', required: true},
    dateHired: {type: Date, default: Date.now()}
});

mongoose.model('CoachClients', CoachClientsSchema);