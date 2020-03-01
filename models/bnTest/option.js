const mongoose = require('mongoose');
const BaseService = require('../baseService');

const optionSchema = new mongoose.Schema({
    content: { type: String, required: () => { return typeof this.content === 'string'; } },
    score: { type: Number, required: true },
    active: { type: Boolean, default: true },
    metadataType: { type: String , enum: ['title', 'titleUnicode', 'artist', 'artistUnicode', 'source', 'reference'] },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const Option = mongoose.model('Option', optionSchema);

class OptionService extends BaseService
{
    constructor() {
        super(Option);
    }

    async remove(id) {
        try {
            return await Option.findByIdAndRemove(id);
        } catch (error) {
            return { error: error._message };
        }
    }

    async create(content, score) {
        try {
            return await Option.create({ content, score });
        } catch (error) {
            return { error: error._message };
        }
    }

}

const service = new OptionService();

module.exports = { service, Option };