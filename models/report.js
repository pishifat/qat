const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporter: { type: 'ObjectId', ref: 'User', required: true },
    culprit: { type: 'ObjectId', ref: 'User' },
    link: { type: String },
    reason: { type: String, required: true },
    valid: { type: Number, enum: [1, 2, 3] },
    feedback: { type: String },
    isActive: { type: Boolean, default: true },
    isMessageSent: { type: Boolean, default: false },
    category: { type: String, enum: ['stolenBeatmap', 'beatmap', 'aiBeatmap', 'contentCaseSong', 'contentCaseVisual', 'behavior', 'other'] },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

class ReportService extends mongoose.Model {
    get reportCategory () {
        switch (this.category) {
            case 'stolenBeatmap':
                return 'stolen beatmap report';
            case 'beatmap':
                return 'beatmap report';
            case 'aiBeatmap':
                return 'AI beatmap report';
            case 'contentCaseSong':
                return 'song content report';
            case 'contentCaseVisual':
                return 'visual content report';
            case 'behavior':
                return 'user behavior report';
            default:
                return 'other category report';
        }
    }

    get isContentCase () {
        if (this.category == 'contentCaseSong' || this.category == 'contentCaseVisual') {
            return true;
        }
    }

    get isAiBeatmap () {
        return this.category == 'aiBeatmap';
    }
}

reportSchema.loadClass(ReportService);

/**
 * @type {import('./interfaces/report').default}
 */
const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
