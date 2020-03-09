const mongoose = require('mongoose');

let logSchema = new mongoose.Schema({
    user: { type: 'ObjectId', ref: 'User' },
    action: { type: String, required: true },
    isError: { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });


class LogService
{

    /**
     *
     * @param {object} userId UserId of the action
     * @param {string} action short comment
     */
    static generate(userId, action, isError) {
        const log = new Log({
            user: userId,
            action,
            isError,
        });
        log.save();
    }

}

logSchema.loadClass(LogService);
const Log = mongoose.model('Log', logSchema);

module.exports = Log;
