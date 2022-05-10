const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = exports.TransactionSchema = new Schema({
    _stripeId: {type: String, required: true},
    amount: {type: Number, required: true},
    currency: {type: String, required: true},
    description: {type: String, required: true},
    status: {type: String, required: true},
    _userId: {type: Schema.Types.ObjectId, ref: 'UserAccount', required: true},
    _coachId: {type: Schema.Types.ObjectId, ref: 'UserAccount', required: true},
    type: {type: String, required: true},
    stripeTimestamp: {type: Number, required: true},
    startDate: {type: Date, default: Date.now()},
    endDate: {type: Date},
    creationDate: {type: Date, default: Date.now()}
});

mongoose.model('Transaction', TransactionSchema);