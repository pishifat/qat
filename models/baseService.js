const mongoose = require('mongoose');

class BaseService {

    /**
     * 
     * @param {mongoose.Model} model 
     */
    constructor(model) {
        this.model = model;
    }

    /**
     * 
     * @param {string} params ex: 'x: y'
     * @param {string} populate ex: 'populate: x, display: y' or 'innerPopulate: x, populate: y'
     * @param {string} sorting ex: 'x: -1'
     * @param {boolean} getAll 
     */
    async query(params, populate, sorting, getAll) {
        let query;
        
        if (getAll) {
            query = this.model.find(params);
        } else {
            query = this.model.findOne(params);
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

        try {
            return await query.exec();
        } catch(error) {
            return { error: error._message };
        }
    }

    /**
     * 
     * @param {(string | object)} filter id | '{ x: y }'
     * @param {object} update ex: '{ x: y }'
     */
    async update(filter, update) {
        try {
            if (typeof filter === 'string') {
                return await this.model.findByIdAndUpdate(filter, update, { 'new': true });
            } else {
                return await this.model.findAndUpdate(filter, update, { 'new': true });
            }
        } catch(error) {
            return { error: error._message };
        }
    }
}

module.exports = BaseService;