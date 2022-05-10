const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const CredentialsSchema = new Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    _userAccountId: {type: Schema.Types.ObjectId, ref: 'UserAccount',required: true}
});

CredentialsSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
CredentialsSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};


let cred = mongoose.model('Credentials', CredentialsSchema);
module.exports = cred;