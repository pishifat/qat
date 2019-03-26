const config = require('../config.json');
const mongoose = require('mongoose');
const qatDb = mongoose.createConnection(config.qat.connection, { useNewUrlParser: true })

const optionSchema = new mongoose.Schema({
    content: { type: String, required: true },
    score: { type: Number, required: true },
    active: { type: Boolean, default: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const Option = qatDb.model('Option', optionSchema);

class OptionService
{
    async query(params, populate, sorting, getAll) {
        let query;

        if (getAll) {
            query = Option.find(params);
        } else {
            query = Option.findOne(params);
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
            return await Option.findByIdAndUpdate(id, update, { 'new': true });
        } catch(error) {
            return { error: error._message };
        }
    }

    async remove(id) {
        try {
            return await Option.findByIdAndRemove(id);
        } catch(error) {
            return { error: error._message };
        }
    }

    async create(content, score) {
        try {
            return await Option.create({content: content, score: score});
        } catch(error) {
            return { error: error._message }
        }
    }
    
}

const service = new OptionService();

module.exports = { service, Option };