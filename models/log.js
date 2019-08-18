const mongoose = require('mongoose');

let logSchema = new mongoose.Schema({
    user: { type: 'ObjectId', ref: 'User' },
    action: { type: String, required: true },
    isError: { type: Boolean, default: false },
    isFeedbackActivity: { type: Boolean, default: false },
    //modified: { type: 'ObjectId', refPath: 'modifiedModel' },
    //modifiedModel: { type: String, enum: ['user', 'bnApp', 'error'], required: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

let Log = mongoose.model('Log', logSchema);

class LogService
{
    /**
     * 
     * @param {string} params ex: 'x: y'
     * @param {string} populate ex: 'populate: x, display: y' or 'innerPopulate: x, populate: y'
     * @param {string} sorting ex: 'x: -1'
     * @param {boolean} getAll 
     */
    async query(params, populate, sorting, getAll, limit, skip) {
        let query;
        
        if (getAll) {
            query = Log.find(params);
        } else {
            query = Log.findOne(params);
        }

        if (populate) {
            for (let i = 0; i < populate.length; i++) {
                const p = populate[i];

                if (p.innerPopulate) {
                    query.populate({ path: p.innerPopulate, populate: p.populate });
                } else {
                    query.populate(p.populate, p.display);
                }
            }
        }

        if (sorting) {
            query.sort(sorting);
        }

        if(limit) {
            query.limit(limit);
        }

        if (skip) {
            query.skip(skip);
        }

        try {
            return await query.exec();
        } catch(error) {
            this.create(null, JSON.stringify(error), true);
            return { error: error._message };
        }
    }

    /**
     * 
     * @param {object} userId UserId of the action
     * @param {string} action short comment
     */
    async create(userId, action, isError, isFeedbackActivity) {
        const log = new Log({ user: userId, action, isError, isFeedbackActivity });
        try {
            return await log.save();
        } catch(err) {
            console.log(err);
            return undefined;
        }
    }
}

let service = new LogService();

module.exports = { service, Log };