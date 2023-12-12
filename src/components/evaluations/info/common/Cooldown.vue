<template>
    <p>
        <b>Cooldown:</b>
        <span
            class="mr-2 text-capitalize"
            :class="cooldownColor"
        >
            {{ hasCooldown ? 'Reduced' : 'None' }}
        </span>

        <span v-if="selectedEvaluation.active && (loggedInUser.isNat || loggedInUser.isTrialNat)" class="btn-group">
            <button
                v-for="button in buttons"
                :key="button.hasCooldown"
                class="btn btn-sm text-capitalize"
                :disabled="hasCooldown == button.hasCooldown"
                :class="button.color"
                @click="setHasCooldown(button.hasCooldown, $event);"
            >
                {{ makeWordFromField(button.display) }}
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
        hasCooldown () {
            return this.selectedEvaluation.hasCooldown;
        },
        /** @returns {Array} */
        buttons() {
            return [
                { hasCooldown: true, color: 'btn-success', display: 'reduced' },
                { hasCooldown: false, color: 'btn-neutral', display: 'none' },
            ];
        },
    },
    methods: {
        async setHasCooldown(hasCooldown, e) {
            const result = await this.$http.executePost(
                `/${this.selectedEvaluation.isApplication ? 'appEval' : 'bnEval'}/setCooldown/` + this.selectedEvaluation.id,
                { hasCooldown },
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