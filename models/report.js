const config = require('../config.json');
const mongoose = require('mongoose');
const db = mongoose.createConnection(config.connection, { useNewUrlParser: true })

const reportSchema = new mongoose.Schema({
    reporterName: { type: String,  required: true },
    reporterOsuId: { type: Number, required: true },
    culprit: { type: 'ObjectId', ref: 'User', required: true },
    reason: { type: String, required: true },
    valid: { type: Number, enum: [1, 2, 3] },
    feedback: { type: String }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const Report = db.model('Report', reportSchema);

class ReportService
{
    async query(params, populate, sorting, getAll) {
        let query;

        if (getAll) {
            query = Report.find(params);
        } else {
            query = Report.findOne(params);
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
            return await Report.findByIdAndUpdate(id, update, { 'new': true });
        } catch(error) {
            return { error: error._message };
        }
    }

    async create(reporterName, reporterOsuId, culpritId, reason) {
        try {
            return await Report.create({reporterName: reporterName, reporterOsuId: reporterOsuId, culprit: culpritId, reason: reason});
        } catch(error) {
            return { error: error._message }
        }
    }
}

const service = new ReportService();

module.exports = { service, Report };