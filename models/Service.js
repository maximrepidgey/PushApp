const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceSchema = exports.ServiceSchema = new Schema({
    _coachId: {type: Schema.Types.ObjectId, required: true},
    name: {type: String, required:true},
    description: {type: String, required:true},
    duration: {type: Number, required:true},
    fee: {type: Number, required:true}
});

mongoose.model('Service', ServiceSchema);
