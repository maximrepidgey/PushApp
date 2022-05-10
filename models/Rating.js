const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RatingSchema = exports.RatingSchema = new Schema({
    _coachId: {type: Schema.Types.ObjectId, ref: 'UserAccount', required: true},
    _clientId: {type: Schema.Types.ObjectId, ref: 'UserAccount', required: true},
    title: {type: String, required: true},
    score: {type: Number, required:true},
    comment: {type: String, required:true},
    date: {type: Date, default: Date.now()},
});

mongoose.model('Rating', RatingSchema);
