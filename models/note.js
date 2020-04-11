const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    author: { type: 'ObjectId', ref: 'User', required: true },
    user: { type: 'ObjectId', ref: 'User', required: true },
    comment: { type: String },
    isHidden: { type: Boolean },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
