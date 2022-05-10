const mongoose = require('mongoose');
require('./UserAccount');
require('./Schedule');
const Schema = mongoose.Schema;

const ClientInfoSchema = exports.ClientSchema = new Schema({
    _clientId: {type: Schema.Types.ObjectId, ref: 'UserAccount', required: true},
    height: {type: Number},
    weight: {type: Number},
    unitSystem: {type: String, default: 'metric'},
    schedule: {type: [Schema.Types.ObjectId], ref: 'Schedule', default: () => []}
});

mongoose.model('ClientInfo', ClientInfoSchema);