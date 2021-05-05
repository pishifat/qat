<template>
    <p class="form-inline">
        <b>Cooldown:</b>

        <input
            v-if="loggedInUser.isNat"
            v-model.number="newCooldownDays"
            type="number"
            class="form-control mx-2"
            @change="setCooldownDate($event)"
        >

        <span v-else class="mx-1 text-danger">{{ originalCooldownDays }}</span>

        <span class="small text-secondary">
            User can reapply on
            {{ newCooldownDate | toStandardDate }}

            <span
                v-if="hasChanged"
                data-toggle="tooltip"
                data-placement="top"
                title="not saved"
            >
                *
            </span>
        </span>
    </p>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
    name: 'Cooldown',
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
        /** @returns {Date} */
        originDate () {
            return this.selectedEvaluation.isApplication ? new Date(this.selectedEvaluation.createdAt) : new Date(this.selectedEvaluation.updatedAt);
        },
        /** @returns {number} */
        originalCooldownDays () {
            return this.$moment(this.selectedEvaluation.cooldownDate).diff(this.originDate, 'days');
        },
        /** @returns {Date} */
        newCooldownDate () {
            const newDate = new Date(this.originDate);
            newDate.setDate(newDate.getDate() + this.newCooldownDays);

            return newDate;
        },
        /** @returns {boolean} */
        hasChanged () {
            return this.originalCooldownDays !== this.newCooldownDays;
        },
    },
    watch: {
        selectedEvaluation () {
            this.newCooldownDays = this.originalCooldownDays;
        },
    },
    mounted () {
        this.newCooldownDays = this.originalCooldownDays;
    },
    methods: {
        async setCooldownDate(e) {
            const result = await this.$http.executePost(
                `/${this.selectedEvaluation.isApplication ? 'appEval' : 'bnEval'}/setCooldownDate/` + this.selectedEvaluation.id,
                { cooldownDate: this.newCooldownDate },
                e
            );

            if (result && !result.error) {
                this.$store.commit('evaluations/updateEvaluation', result);
                this.$store.dispatch('updateToastMessages', {
                    message: `Saved cooldown date`,
                    type: 'success',
                });
            }
        },
    },
};
</script>