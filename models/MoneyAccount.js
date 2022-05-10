const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MoneyAccountSchema = exports.MoneyAccountSchema = new Schema({
    _userAccountId: {type: Schema.Types.ObjectId, ref: 'UserAccount', required: true},
    balance: {type: Number, default: 0},
    currency: {type: String, required: true},
    isDeleted: {type: Boolean, default: false}
});

mongoose.model('MoneyAccount', MoneyAccountSchema);
