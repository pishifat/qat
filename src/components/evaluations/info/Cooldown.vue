<template>
    <p class="text-shadow">
        Cooldown:
        <input
            id="day"
            v-model="days"
            type="text"
            placeholder="days"
            maxlength="3"
            style="min-width: 60px; width: 60px;"
            @change="setCooldownDate($event)"
        >
        <span class="small" :class="invalidDate ? 'errors' : ''">
            {{ invalidDate ? 'Invalid date!' : 'User can reapply on ' + newCooldownDate.toString().slice(4,15) }}<span
                v-if="calculateDays != parseInt(days) && !invalidDate"
                data-toggle="tooltip"
                data-placement="top"
                title="not saved"
            >*</span>
        </span>
    </p>
</template>

<script>
import postData from '../../../mixins/postData.js';

export default {
    name: 'Cooldown',
    mixins: [ postData ],
    props: {
        cooldownDate: {
            type: String,
            default: '',
        },
        nominatorAssessmentMongoId: {
            type: String,
            required: true,
        },
        isApplication: Boolean,
        originDate: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            invalidDate: '',
            days: null,
        };
    },
    computed: {
        newCooldownDate() {
            let date = new Date(this.originDate);
            date.setDate(date.getDate() + parseInt(this.days));

            return date;
        },
        calculateDays() {
            let origin = new Date(this.originDate);
            let cooldown = new Date(this.cooldownDate);

            return Math.round((cooldown.getTime() - origin.getTime())/(1000*60*60*24));
        },
    },
    watch: {
        newCooldownDate() {
            if (!(this.newCooldownDate instanceof Date) || isNaN(this.newCooldownDate)) {
                this.invalidDate = 'Invalid date!';
            } else {
                this.invalidDate = '';
            }
        },
    },
    mounted() {
        this.days = this.calculateDays;
    },
    methods: {
        async setCooldownDate(e) {
            if (!this.invalidDate.length) {
                const result = await this.executePost(
                    `/${this.isApplication ? 'appEval' : 'bnEval'}/setCooldownDate/` + this.nominatorAssessmentMongoId, { cooldownDate: this.newCooldownDate }, e);

                if (result && !result.error) {
                    this.$store.dispatch(this.isApplication ? 'updateApplication' : 'updateEvalRound', result);
                    this.$store.dispatch('updateToastMessages', {
                        message: `Saved cooldown date`,
                        type: 'success',
                    });
                }
            }
        },
    },
};
</script>