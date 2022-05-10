const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = exports.NotificationSchema = new Schema({
  from: {type: Schema.Types.ObjectId, ref: 'UserAccount', required: true},
  for: {type: Schema.Types.ObjectId, ref: 'UserAccount', required: true},
  userName : {type: String, default: ""},
  sentDate: {type: Date, default: Date.now()},
  comments : {type: String, default: ""},
  exerciseName : {type: String, default: ""},
  repetitions : {type: Number, default: 0},
  weight : {type: Number, default: 0},
  sets : {type: Number, default: 0},
  viewed : {type: Boolean, default: false},
  typeofMessage : {type: String},
});
mongoose.model('Notification', NotificationSchema);
