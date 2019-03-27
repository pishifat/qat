const config = require('../config.json');
const mongoose = require('mongoose');
const db = mongoose.createConnection(config.connection, { useNewUrlParser: true });

const bnAppSchema = new mongoose.Schema({
    applicant: {type: 'ObjectId', ref: 'User', required: true},
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania'], required: true },
    mods: [{ type: String, required: true }],
    evaluations: [{type: 'ObjectId', ref: 'Evaluation'}],
    active: { type: Boolean, default: true },
    discussion: { type: Boolean, default: false },
    consensus: { type: String, enum: ["pass", "fail"] },
    feedback: { type: String }
    //testResult: [{ type: 'ObjectId', ref: 'rcTest'}],

}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const BnApp = db.model('BnApp', bnAppSchema);

class BnAppService
{
    async query(params, populate, sorting, getAll) {
        let query;

        if (getAll) {
            query = BnApp.find(params);
        } else {
            query = BnApp.findOne(params);
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
            return await BnApp.findByIdAndUpdate(id, update, { 'new': true });
        } catch(error) {
            return { error: error._message };
        }
    }

    async create(userId, mode, mods) {
        try {
            return await BnApp.create({ applicant: userId, mode: mode, mods: mods });
        } catch(error) {
            return { error: error._message }
        }
    }
}

const service = new BnAppService();

module.exports = { service };