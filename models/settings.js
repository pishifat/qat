const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    modeSettings: [{
        _id: false,
        mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania'], required: true },
        evalsRequired: { type: Number, required: true },
    }],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

class SettingsService extends mongoose.Model {

    /**
     * @param {string} mode
     * @returns {Promise<number>} Evals required for a specific mode
     */
    static async getModeEvaluationsRequired (mode) {
        const settings = await this.findOne();
        const modeSetting = settings.modeSettings.find(s => s.mode === mode);

        return modeSetting.evalsRequired || 3;
    }

}

settingsSchema.loadClass(SettingsService);
/**
 * @type {import('./interfaces/settings').ISettingsModel}
 */
const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
