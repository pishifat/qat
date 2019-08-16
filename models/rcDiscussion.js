const mongoose = require('mongoose');
const logsService = require('./log').service;
const BaseService = require('./baseService');

const rcDiscussionSchema = new mongoose.Schema({
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania', 'all'] },
    title: { type: String, required: true },
    discussionLink: { type: String, required: true },
    shortReason: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    mediations: [{ type: 'ObjectId', ref: 'Mediation' }],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const RcDiscussion = mongoose.model('RcDiscussion', rcDiscussionSchema);

class RcDiscussionService extends BaseService
{
    constructor() {
        super(RcDiscussion);
    }

    /**
     * 
     * @param {string} discussionLink 
     * @param {string} title
     * @param {string} shortReason 
     * @param {string} mode 'osu', 'taiko', 'catch', 'mania'
     */
    async create(discussionLink, title, shortReason, mode) {
        try {
            return await RcDiscussion.create({ 
                discussionLink, 
                title,
                shortReason, 
                mode, 
            });
        } catch(error) {
            logsService.create(null, JSON.stringify(error), true);
            return { error: 'could not create rcDiscussion' };
        }
    }
}

const service = new RcDiscussionService();

module.exports = { service, RcDiscussion };