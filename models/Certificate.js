const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CertificateSchema = exports.CertificateSchema = new Schema({
    name: {type: String, required: true},
    provider: {type: String, required: true},
    date: {type: Date, required: true},
    file: {type: Buffer, required: true},
});

mongoose.model('Certificate', CertificateSchema);