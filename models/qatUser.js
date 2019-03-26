const config = require('../config.json');
const mongoose = require('mongoose');
const qatDb = mongoose.createConnection(config.qat.connection, { useNewUrlParser: true })

const qatUserSchema = new mongoose.Schema({
    osuId: { type: Number, required: true },
    username: { type: String, required: true },
    group: { type: String, enum: ["bn", "qat", 'user'], default: 'user' },
    modes: [{ type: String, enum: ["osu", "taiko", "catch", "mania"] }],
    probation: [{ type: String, enum: ["osu", "taiko", "catch", "mania"] }],
    vetoMediator: { type: Boolean, default: true },
    bnDuration: [{ type: Date }],
    qatDuration: [{ type: Date }],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const QatUser = qatDb.model('QatUser', qatUserSchema);

class QatUserService
{
    async query(params, populate, sorting, getAll) {
        let query;

        if (getAll) {
            query = QatUser.find(params);
        } else {
            query = QatUser.findOne(params);
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
            return await QatUser.findByIdAndUpdate(id, update, { 'new': true });
        } catch(error) {
            return { error: error._message };
        }
    }

    async create(osuId, username, group) {
        try {
            return await QatUser.create({osuId: osuId, username: username, group: group});
        } catch(error) {
            return { error: error }
        }
    }
}

const service = new QatUserService();

module.exports = { service, QatUser };