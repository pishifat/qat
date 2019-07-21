const mongoose = require('mongoose');
const logsService = require('./log').service;
const BaseService = require('./baseService');

const evalRoundSchema = new mongoose.Schema({
    bn: { type: 'ObjectId', ref: 'User', required: true },
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania'], required: true },
    evaluations: [{ type: 'ObjectId', ref: 'Evaluation' }],
    deadline: { type: Date , required: true },
    active: { type: Boolean, default: true },
    discussion: { type: Boolean, default: false },
    consensus: { type: String, enum: ['pass', 'extend', 'fail'] },
    feedback: { type: String },
    isPriority: { type: Boolean, default: false },
    isLowActivity: { type: Boolean, default: false}
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const EvalRound = mongoose.model('EvalRound', evalRoundSchema);

class EvalRoundService extends BaseService
{
    constructor() {
        super(EvalRound);
    }

    /**
     * 
     * @param {object} bnId UserId of bn to be evaluated
     * @param {string} mode 'osu', 'taiko', 'catch', 'mania'
     * @param {date} deadline 
     */
    async create(bnId, mode, deadline) {
        try {
            return await EvalRound.create({bn: bnId, mode: mode, deadline: deadline});
        } catch(error) {
            logsService.create(null, JSON.stringify(error), true);
            return { error: error._message }
        }
    }

    /**
     * 
     * @param {Array} evalRounds 
     */
    async createMany(evalRounds) {
        try {
            return await EvalRound.insertMany(evalRounds);
        } catch(error) {
            logsService.create(null, JSON.stringify(error), true);
            return { error: 'Something went wrong!' }
        }
    }
}

const service = new EvalRoundService();

module.exports = { service, EvalRound };