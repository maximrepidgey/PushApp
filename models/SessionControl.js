const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SessionControl = exports.SessionControl = new Schema({
  _clientId: {type: Schema.Types.ObjectId, ref: 'UserAccount', required: true},
  startDate : {type : Date, default: Date.now()},
  finishDate : {type : Date, default: null},
  exercises: {type: [Schema.Types.ObjectId], ref: 'ExerciseControl', default: () => []},
});

mongoose.model('SessionControl', SessionControl);
