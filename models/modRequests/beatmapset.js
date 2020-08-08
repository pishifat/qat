const mongoose = require('mongoose');

const beatmapsetsSchema = new mongoose.Schema({
    osuId: { type: Number, required: true },
    artist: { type: String, required: true },
    title: { type: String, required: true },
    modes: [{ type: String, enum: ['osu', 'taiko', 'fruits', 'mania'], required: true }],
    length: { type: Number, required: true },
    bpm: { type: Number, required: true },
    submittedAt: { type: Date, required: true },
    genre: { type: String, required: true },
    language: { type: String, required: true },
    numberDiffs: { type: Number, required: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

beatmapsetsSchema.virtual('events', {
    ref: 'aiess',
    localField: 'osuId',
    foreignField: 'beatmapsetId',
    options: {
        select: 'type timestamp',
        sort: { timestamp: -1 },
    },
});

class BeatmapsetService extends mongoose.Model {

    get fullTitle () {
        return `${this.artist} - ${this.title}`;
    }

    get totalLength () {
        return this.length * this.numberDiffs;
    }

    get totalLengthString () {
        return this.totalLength > 600 ? 'long' : 'short';
    }

}

beatmapsetsSchema.loadClass(BeatmapsetService);
/**
 * @type {import('../interfaces/modRequests/beatmapset').IBeatmapsetModel}
 */
const Beatmapset = mongoose.model('Beatmapset', beatmapsetsSchema);

module.exports = Beatmapset;
