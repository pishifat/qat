const mongoose = require('mongoose');
const BaseService = require('./baseService');

var logSchema = new mongoose.Schema({
    user: { type: 'ObjectId', ref: 'User'},
    action: { type: String, required: true },
    //modified: { type: 'ObjectId', refPath: 'modifiedModel' },
    //modifiedModel: { type: String, enum: ['user', 'bnApp', 'error'], required: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

var Log = mongoose.model('Log', logSchema);

class LogService extends BaseService
{
    constructor() {
        super(Log);
    }

    /**
     * 
     * @param {object} userId UserId of the action
     * @param {string} action short comment
     */
    async create(userId, action) {
        const log = new Log({ user: userId, action: action });
        try {
            return await log.save();
        } catch(err) {
            console.log(err);
        }
    }
}

var service = new LogService();

module.exports = { service, Log };