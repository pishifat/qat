<template>
    <p class="text-shadow">
        Cooldown:
        <input
            id="day"
            type="text"
            placeholder="days"
            maxlength="3"
            v-model="days"
            style="min-width: 60px; width: 60px;"
            @change="setCooldownDate($event)"
        >
        <span class="small" :class="info.length ? 'errors' : ''">
            {{ info || 'User can reapply on ' + newCooldownDate.toString().slice(4,15) }}<span v-if="calculateDays != parseInt(days) && !info.length" data-toggle="tooltip" data-placement="top" title="not saved">*</span>
        </span>
    </p>
</template>

<script>
import postData from '../../../mixins/postData.js';

export default {
    name: 'cooldown',
    props: {
        cooldownDate: String,
        nominatorAssessmentMongoId: String,
        isApplication: Boolean,
        originDate: String,
    },
    mixins: [ postData ],
    data() {
        return {
            info: '',
            days: null,
        };
    },
    mounted() {
        this.days = this.calculateDays;
    },
    watch: {
        newCooldownDate() {
            if(!(this.newCooldownDate instanceof Date) || isNaN(this.newCooldownDate)){
                this.info = 'Invalid date!';
            }else{
                this.info = '';
            }
        },
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
        }
    },
    methods: {
        async setCooldownDate(e){
            if(!this.info.length){
                const result = await this.executePost(
                    `/${this.isApplication? 'appEval' : 'bnEval'}/setCooldownDate/` + this.nominatorAssessmentMongoId, { cooldownDate: this.newCooldownDate }, e);
                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.$emit('update-nominator-assessment', result);
                    }
                }
            }
        },
    },
};
</script>