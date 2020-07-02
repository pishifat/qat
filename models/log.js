const mongoose = require('mongoose');

let logSchema = new mongoose.Schema({
    user: { type: 'ObjectId', ref: 'User' },
    action: { type: String, required: true },
    category: { type: String, enum: ['account', 'user', 'application', 'appEvaluation', 'bnEvaluation', 'dataCollection', 'discussionVote', 'report', 'test', 'qualityAssurance', 'veto'] },
    relatedId: { type: 'ObjectId' },
    isError: { type: Boolean, default: false },
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

}

logSchema.loadClass(LogService);
/**
 * @type {import('./interfaces/log').default}
 */
const Log = mongoose.model('Log', logSchema);

module.exports = Log;
