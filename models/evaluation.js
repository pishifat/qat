const config = require('../config.json');
const mongoose = require('mongoose');
const qatDb = mongoose.createConnection(config.qat.connection, { useNewUrlParser: true })

const evaluationSchema = new mongoose.Schema({
    evaluator: { type: 'ObjectId', ref: 'QatUser', required: true },
    behaviorComment: { type: String, required: true },
    moddingComment: { type: String, required: true },
    vote: { type: Number, enum: [1, 2, 3] }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const Evaluation = qatDb.model('Evaluation', evaluationSchema);

class EvaluationService
{
    async query(params, populate, sorting, getAll) {
        let query;

        if (getAll) {
            query = Evaluation.find(params);
        } else {
            query = Evaluation.findOne(params);
        }

        if (populate) {
            for (let i = 0; i < populate.length; i++) {
                const p = populate[i];
                query.populate(p.populate, p.display);
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
            return await Evaluation.findByIdAndUpdate(id, update, { 'new': true });
        } catch(error) {
            return { error: error._message };
        }
    }

    async create(evaluatorId, behaviorComment, moddingComment, vote) {
        try {
            return await Evaluation.create({evaluator: evaluatorId, behaviorComment: behaviorComment, moddingComment: moddingComment, vote: vote});
        } catch(error) {
            return { error: error._message }
        }
    }
}

const service = new EvaluationService();

module.exports = { service, Evaluation };