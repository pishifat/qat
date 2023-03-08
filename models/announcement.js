const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    author: { type: 'ObjectId', ref: 'User', required: true },
    content: { type: String },
    title: { type: String },
    roles: [{ type: String }],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

/**
 * @type {import('./interfaces/announcement').default}
 */
const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
