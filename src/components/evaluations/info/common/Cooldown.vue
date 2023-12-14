<template>
    <p>
        <b>Cooldown:</b>
        <span
            class="mr-2 text-capitalize"
            :class="cooldownColor"
        >
            {{ cooldownText }}
        </span>

        <span v-if="selectedEvaluation.active && (loggedInUser.isNat || loggedInUser.isTrialNat)" class="btn-group">
            <button
                v-for="button in buttons"
                :key="button.cooldown"
                class="btn btn-sm text-capitalize"
                :disabled="cooldown == button.cooldown"
                :class="button.color"
                @click="setCooldown(button.cooldown, $event);"
            >
                {{ makeWordFromField(button.cooldown) }}
            </button>
        </span>

        <span class="small text-secondary">
            User can reapply on
            {{ selectedEvaluation.cooldownDate | toStandardDate }}
        </span>
    </p>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import evaluations from '../../../../mixins/evaluations.js';

export default {
    name: 'Cooldown',
    mixins: [ evaluations ],
    data() {
        return {
            newCooldownDays: 0,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
        /** @returns {string} */
        cooldown () {
            return this.selectedEvaluation.cooldown;
        },
        /** @returns {Array} */
        buttons() {
            return [
                { cooldown: 'none', color: 'btn-primary' },
                { cooldown: 'reduced', color: 'btn-success' },
                { cooldown: 'standard', color: 'btn-neutral' },
                { cooldown: 'extended', color: 'btn-danger' },
            ];
        },
    },
    methods: {
        async setCooldown(cooldown, e) {
            const result = await this.$http.executePost(
                `/${this.selectedEvaluation.isApplication ? 'appEval' : 'bnEval'}/setCooldown/` + this.selectedEvaluation.id,
                { cooldown, baseDate: this.selectedEvaluation.isApplication ? this.selectedEvaluation.createdAt : this.selectedEvaluation.deadline },
                e
            );

            if (result && !result.error) {
                this.$store.commit('evaluations/updateEvaluation', result);
                this.$store.dispatch('updateToastMessages', {
                    message: `Saved cooldown`,
                    type: 'success',
                });
            }
        },
    },
};
</script>