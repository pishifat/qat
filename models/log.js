const config = require('../config.json');
const mongoose = require('mongoose');
const db = mongoose.createConnection(config.connection, { useNewUrlParser: true })

var logSchema = new mongoose.Schema({
    user: { type: 'ObjectId', ref: 'User'},
    action: { type: String, required: true },
    //modified: { type: 'ObjectId' },
    //category: {type: String, enum: ['beatmap', 'quest', 'party', 'user', 'artist', 'error'], required: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

var Log = db.model('Log', logSchema);

class LogService
{
    async query(params, populate, sorting, getAll, limit, skip) {
        let query;
        
        if(getAll){
            query = Log.find(params);
        }else{
            query = Log.findOne(params);
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

        if (skip) {
            query.skip(skip);
        }

        if (limit) {
            query.limit(limit);
        }
        
        try {
            return await query.exec();
        } catch(error) {
            return { error: error._message };
        }
    }

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