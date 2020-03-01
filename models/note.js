const mongoose = require('mongoose');
const logsService = require('./log').service;
const BaseService = require('./baseService');

const noteSchema = new mongoose.Schema({
    author: { type: 'ObjectId', ref: 'User', required: true },
    user: { type: 'ObjectId', ref: 'User', required: true },
    comment: { type: String },
    isHidden: { type: Boolean },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const Note = mongoose.model('Note', noteSchema);

class NoteService extends BaseService
{
    constructor() {
        super(Note);
    }

    /**
     *
     * @param {object} author UserId who writes the note
     * @param {object} user UserId who note is for
     * @param {string} comment what's being said
     */
    async create(author, user, comment) {
        try {
            return await Note.create({ author, user, comment });
        } catch (error) {
            logsService.create(null, JSON.stringify(error), true);

            return { error: error._message };
        }
    }
}

const service = new NoteService();

module.exports = { service, Note };