<template>
    <div class="rounded p-3 mb-3 penalty-form-box">
        <p v-if="!penalty" class="small text-warning mb-2">
            This records an evaluation-context event. It is not itself a formal NAT warning.
        </p>

        <div v-if="!lockMode && modes.length > 1" class="mb-2">
            <label class="form-label small mb-1">Mode</label>
            <select v-model="form.mode" class="form-select form-select-sm">
                <option
                    v-for="mode in modes"
                    :key="mode"
                    :value="mode"
                >
                    {{ formatMode(mode) }}
                </option>
            </select>
        </div>

        <div class="mb-2">
            <label class="form-label small mb-1">Type</label>
            <select v-model="form.type" class="form-select form-select-sm">
                <option value="mappingQuality">Mapping Quality</option>
                <option value="moddingQuality">Modding Quality</option>
                <option value="behavior">Behaviour</option>
                <option value="other">Other</option>
            </select>
        </div>

        <div class="mb-2">
            <label class="form-label small mb-1">Severity</label>
            <select v-model="form.severity" class="form-select form-select-sm">
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="major">Major</option>
                <option value="severe">Severe</option>
            </select>
        </div>

        <div class="mb-2">
            <label class="form-label small mb-1">Reason</label>
            <textarea
                v-model="form.reason"
                class="form-control form-control-sm"
                rows="2"
                required
            />
        </div>

        <div class="mb-2">
            <label class="form-label small mb-1">Linked incident (optional)</label>
            <select v-model="form.sourceKey" class="form-select form-select-sm">
                <option value="">None</option>
                <option
                    v-for="option in sourceOptions"
                    :key="option.key"
                    :value="option.key"
                >
                    {{ option.label }}
                </option>
            </select>
        </div>

        <div class="d-flex gap-2 justify-content-end">
            <button class="btn btn-sm btn-secondary" type="button" @click="$emit('cancel')">
                Cancel
            </button>
            <button class="btn btn-sm btn-primary" type="button" @click="submit($event)">
                {{ penalty ? 'Save' : 'Add Penalty' }}
            </button>
        </div>
    </div>
</template>

<script>
export default {
    name: 'PenaltyForm',
    props: {
        userId: {
            type: String,
            required: true,
        },
        modes: {
            type: Array,
            default() {
                return ['osu'];
            },
        },
        lockMode: {
            type: Boolean,
            default: false,
        },
        initialMode: {
            type: String,
            default: '',
        },
        initialSourceType: {
            type: String,
            default: 'none',
        },
        initialSourceId: {
            type: String,
            default: '',
        },
        penalty: {
            type: Object,
            default: null,
        },
    },
    emits: ['saved', 'cancel'],
    data() {
        return {
            form: {
                mode: '',
                type: 'mappingQuality',
                severity: 'moderate',
                reason: '',
                sourceKey: '',
            },
            dqEvents: [],
            evaluations: [],
        };
    },
    computed: {
        sourceOptions() {
            const options = [];

            for (const event of this.dqEvents) {
                const kind = event.type === 'nomination_reset' ? 'Pop' : 'DQ';
                const date = event.timestamp ? String(event.timestamp).slice(0, 10) : '';

                options.push({
                    key: `dq:${event.id}`,
                    label: `${kind} ${event.obviousness}/${event.severity} · ${event.artistTitle || event.beatmapsetId} (${date})`,
                });
            }

            for (const evaluation of this.evaluations) {
                const date = evaluation.archivedAt ? String(evaluation.archivedAt).slice(0, 10) : '';

                options.push({
                    key: `evaluation:${evaluation.id}`,
                    label: `Eval warning · ${this.makeWordFromField(evaluation.addition)} (${date})`,
                });
            }

            if (this.form.sourceKey && !options.some(option => option.key === this.form.sourceKey)) {
                options.unshift({
                    key: this.form.sourceKey,
                    label: 'Linked incident',
                });
            }

            return options;
        },
    },
    watch: {
        'form.mode'() {
            this.loadLinkOptions();
        },
    },
    mounted() {
        this.resetForm();
        this.loadLinkOptions();
    },
    methods: {
        formatMode(mode) {
            if (mode === 'osu') return 'osu!';

            return 'osu!' + mode;
        },
        makeWordFromField(field) {
            if (!field) return 'none';

            let word = field.replace(/Bn/, 'BN');
            word = word.replace(/([a-z])([A-Z])/g, '$1 $2');

            return word.charAt(0).toUpperCase() + word.slice(1);
        },
        resetForm() {
            const fallbackMode = this.initialMode || (this.modes && this.modes[0]) || 'osu';

            if (this.penalty) {
                this.form = {
                    mode: this.penalty.mode,
                    type: this.penalty.type,
                    severity: this.penalty.severity,
                    reason: this.penalty.reason,
                    sourceKey: this.penalty.sourceType && this.penalty.sourceType !== 'none' && this.penalty.sourceId
                        ? `${this.penalty.sourceType}:${this.penalty.sourceId}`
                        : '',
                };
            } else {
                this.form = {
                    mode: fallbackMode,
                    type: 'mappingQuality',
                    severity: 'moderate',
                    reason: '',
                    sourceKey: this.initialSourceType && this.initialSourceType !== 'none' && this.initialSourceId
                        ? `${this.initialSourceType}:${this.initialSourceId}`
                        : '',
                };
            }
        },
        async loadLinkOptions() {
            if (!this.form.mode || !this.userId) return;

            const data = await this.$http.executeGet(`/penalties/linkOptions/${this.userId}/${this.form.mode}`);

            if (this.$http.isValid(data)) {
                this.dqEvents = data.dqEvents || [];
                this.evaluations = data.evaluations || [];
            }
        },
        parseSourceKey() {
            if (!this.form.sourceKey) {
                return { sourceType: 'none', sourceId: null };
            }

            const [sourceType, ...rest] = this.form.sourceKey.split(':');

            return {
                sourceType,
                sourceId: rest.join(':'),
            };
        },
        async submit(e) {
            if (!this.form.reason || !this.form.reason.trim()) {
                this.$store.dispatch('updateToastMessages', {
                    message: 'Reason is required',
                    type: 'danger',
                });

                return;
            }

            const source = this.parseSourceKey();
            const payload = {
                userId: this.userId,
                mode: this.form.mode,
                type: this.form.type,
                severity: this.form.severity,
                reason: this.form.reason,
                sourceType: source.sourceType,
                sourceId: source.sourceId,
            };

            const data = this.penalty
                ? await this.$http.executePatch(`/penalties/${this.penalty.id}`, payload, e)
                : await this.$http.executePost('/penalties', payload, e);

            if (this.$http.isValid(data) && data.penalty) {
                this.$emit('saved', data.penalty);
            }
        },
    },
};
</script>

<style scoped>
.penalty-form-box {
    border: 1px solid rgba(248, 249, 250, 0.25);
}
</style>
