const config = require('../config.json');
const mongoose = require('mongoose');
const db = mongoose.createConnection(config.connection, { useNewUrlParser: true })

const evalRoundSchema = new mongoose.Schema({
    bn: { type: 'ObjectId', ref: 'User', required: true },
    mode: { type: String, required: true },
    evaluations: [{ type: 'ObjectId', ref: 'Evaluation' }],
    deadline: { type: Date , required: true },
    active: { type: Boolean, default: true },
    discussion: { type: Boolean, default: false },
    consensus: { type: String, enum: ['pass', 'extend', 'fail'] },
    feedback: { type: String },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const EvalRound = db.model('EvalRound', evalRoundSchema);

class EvalRoundService
{
    async query(params, populate, sorting, getAll) {
        let query;

        if (getAll) {
            query = EvalRound.find(params);
        } else {
            query = EvalRound.findOne(params);
        }

        if (populate) {
            for (let i = 0; i < populate.length; i++) {
                const p = populate[i];
                
                if (p.innerPopulate) {
                    query.populate({ path: p.innerPopulate, model: p.model, populate: p.populate });
                } else {
                    query.populate(p.populate, p.display, p.model);
                }
            }
        }

        if (sorting) {
            query.sort(sorting);
        }

        try {
            return await query.exec();
        } catch(error) {
            return { error: error._message };
        }
    }

    async update(id, update) {
        try {
            return await EvalRound.findByIdAndUpdate(id, update, { 'new': true });
        } catch(error) {
            return { error: error._message };
        }
    }

    async create(bnId, mode, deadline) {
        try {
            return await EvalRound.create({bn: bnId, mode: mode, deadline: deadline});
        } catch(error) {
            return { error: error._message }
        }
    }
}

const service = new EvalRoundService();

module.exports = { service, EvalRound };