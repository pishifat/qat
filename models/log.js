const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    user: { type: 'ObjectId', ref: 'User' },
    action: { type: String, required: true },
    category: {
        type: String,
        enum: [
            'account',
            'user',
            'application',
            'appEvaluation',
            'bnEvaluation',
            'dataCollection',
            'discussionVote',
            'report',
            'test', // no longer used
            'qualityAssurance',
            'veto',
            'interOp',
            'spam',
            'bnFinder', // no longer used
            'notableNameChanges',
            'documentation',
        ],
    },
    relatedId: { type: 'ObjectId', ref: 'aiess' }, // if this needs to be populated for more than aiess, create dynamic refPath with category (requires some renaming)

    // For errors
    isError: { type: Boolean, default: false },
    stack: { type: String },
    extraInfo: { type: String },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

class LogService
{

    /**
     *
     * @param {string} userId UserId of the action
     * @param {string} action short comment
     * @param {string} category basically the route where it was created
     * @param {string} relatedId some ID related to the event
     */
    static generate(userId, action, category, relatedId) {
        const log = new Log({
            user: userId,
            action,
            category,
            relatedId,
        });
        log.save();
    }

    /**
     *
     * @param {string} action short comment
     * @param {string} stack
     * @param {string} extraInfo any extra info as object
     * @param {string} [userId] UserId of the action
     */
    static generateError(action, stack, extraInfo, userId) {
        const log = new Log({
            action,
            stack,
            extraInfo,
            user: userId,
            isError: true,
        });
        log.save();
    }

}

logSchema.loadClass(LogService);
/**
 * @type {import('./interfaces/log').default}
 */
const Log = mongoose.model('Log', logSchema);

module.exports = Log;
