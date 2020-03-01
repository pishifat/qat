const mongoose = require('mongoose');
const logsService = require('./log').service;
const BaseService = require('./baseService');

const discussionSchema = new mongoose.Schema({
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania', 'all'] },
    title: { type: String, required: true },
    discussionLink: { type: String },
    shortReason: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    mediations: [{ type: 'ObjectId', ref: 'Mediation' }],
    isNatOnly: { type: Boolean, default: false },
    creator: { type: 'ObjectId', ref: 'User' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const Discussion = mongoose.model('Discussion', discussionSchema);

class DiscussionService extends BaseService
{
    constructor() {
        super(Discussion);
    }

    /**
     *
     * @param {string} discussionLink
     * @param {string} title
     * @param {string} shortReason
     * @param {string} mode 'osu', 'taiko', 'catch', 'mania', 'all'
     * @param {Boolean} isNatOnly
     */
    async create(discussionLink, title, shortReason, mode, creator, isNatOnly) {
        try {
            return await Discussion.create({
                discussionLink,
                title,
                shortReason,
                mode,
                creator,
                isNatOnly,
            });
        } catch (error) {
            logsService.create(null, JSON.stringify(error), true);

            return { error: 'could not create Discussion' };
        }
    }
}

const service = new DiscussionService();

module.exports = { service, Discussion };