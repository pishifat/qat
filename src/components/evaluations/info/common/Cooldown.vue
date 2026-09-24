<template>
    <div>
        <p class="d-flex flex-wrap align-items-center gap-2 mb-1">
            <b>Cooldown:</b>
            <input
                v-model.number="newCooldownDays"
                type="number"
                min="0"
                class="form-control form-control-sm cooldown-days"
                @change="setCooldownDate($event)"
            >
            <span class="small text-secondary">
                {{ cooldownOriginText }}. User can reapply on {{ toStandardDate(newCooldownDate) }}
            </span>
            <span
                v-if="saving"
                class="spinner-border spinner-border-sm"
                role="status"
            />
        </p>
        <p class="small text-warning mb-0">
            <i class="fas fa-exclamation-triangle me-1" />
            Avoid changing cooldown unless the team has a good reason to.
        </p>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'Cooldown',
    data() {
        return {
            newCooldownDays: 0,
            originDate: null,
            saving: false,
        };
    },
    computed: {
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
        newCooldownDate() {
            const date = new Date(this.originDate || Date.now());
            const days = Number.isFinite(this.newCooldownDays) ? this.newCooldownDays : 0;
            date.setDate(date.getDate() + days);

            return date;
        },
        cooldownOriginText() {
            const days = Number.isFinite(this.newCooldownDays) ? this.newCooldownDays : 0;
            const unit = days === 1 ? 'day' : 'days';
            const origin = this.selectedEvaluation && this.selectedEvaluation.isApplication
                ? 'after submission'
                : 'from today';

            return `${unit} ${origin}`;
        },
    },
    watch: {
        'selectedEvaluation.id': {
            immediate: true,
            handler() {
                this.syncDays();
            },
        },
        'selectedEvaluation.cooldownDate'() {
            this.syncDays();
        },
    },
    methods: {
        syncDays() {
            const evaluation = this.selectedEvaluation;
            if (!evaluation) return;

            this.originDate = evaluation.isApplication
                ? new Date(evaluation.createdAt)
                : new Date();

            const cooldownDate = evaluation.cooldownDate
                ? new Date(evaluation.cooldownDate)
                : new Date(this.originDate);
            const days = this.$moment(cooldownDate).startOf('day').diff(this.$moment(this.originDate).startOf('day'), 'days');

            this.newCooldownDays = Math.max(0, days);
        },
        async setCooldownDate(e) {
            if (!Number.isFinite(this.newCooldownDays) || this.newCooldownDays < 0 || this.saving) return;

            this.saving = true;

            try {
                const result = await this.$http.executePost(
                    `/${this.selectedEvaluation.isApplication ? 'appEval' : 'bnEval'}/setCooldownDate/` + this.selectedEvaluation.id,
                    { cooldownDate: this.newCooldownDate },
                    e
                );

                if (result && !result.error) {
                    this.$store.commit('evaluations/updateEvaluation', result);
                    this.$store.dispatch('updateToastMessages', {
                        message: 'Saved cooldown date',
                        type: 'success',
                    });
                }
            } finally {
                this.saving = false;
            }
        },
    },
};
</script>

<style scoped>
.cooldown-days {
    width: 5rem;
}
</style>
