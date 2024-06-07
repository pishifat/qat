<template>
    <div v-if="evaluation.active">
        <div class="progress mt-2">
            <div 
                class="progress-bar bg-bright-blue"
                style="width: 16.66%; border-right: 2px solid #22282a;"
                data-toggle="tooltip"
                data-placement="top"
                :title="evaluation.isApplication ? 'application submitted' : 'evaluation created'"
            />
            <div 
                class="progress-bar"
                style="width: 16.66%; border-right: 2px solid #22282a;"
                :class="getProgressBarState(1) ? 'bg-bright-blue' : 'bg-light'"
                data-toggle="tooltip"
                data-placement="top"
                title="1/3 evaluations completed"
            />
            <div 
                class="progress-bar"
                style="width: 16.66%; border-right: 2px solid #22282a;"
                :class="getProgressBarState(2) ? 'bg-bright-blue' : 'bg-light'"
                data-toggle="tooltip"
                data-placement="top"
                title="2/3 evaluations completed"
            />
            <div 
                class="progress-bar"
                style="width: 16.66%; border-right: 2px solid #22282a;"
                :class="getProgressBarState(3) ? 'bg-bright-blue' : 'bg-light'"
                data-toggle="tooltip"
                data-placement="top"
                title="3/3 evaluations completed"
            />
            <div 
                class="progress-bar"
                style="width: 16.66%; border-right: 2px solid #22282a;"
                :class="getProgressBarState(4) ? 'bg-bright-blue' : 'bg-light'"
                data-toggle="tooltip"
                data-placement="top"
                title="consensus set"
            />
            <div 
                class="progress-bar bg-light"
                style="width: 16.66%"
                data-toggle="tooltip"
                data-placement="top"
                :title="evaluation.isApplication ? 'application returned' : 'evaluation returned'"
            />
        </div>
        <p class="mt-2 text-secondary">{{ statusText }}</p>
        
    </div>
    
</template>

<script>
export default {
    name: 'ProgressBar',
    data () {
        return {
            statusText: '',
        }
    },
    props: {
        evaluation : {
            type: Object,
            required: true,
        }
    },
    methods: {
        /** @returns {boolean} whether a progress bar tile should be active or not */
        getProgressBarState (step) {
            this.statusText = this.evaluation.isApplication ? 'Application submitted.' : 'Evaluation created.';

            if (this.evaluation.discussion || this.evaluation.reviews.length >= 1) {
                this.statusText = 'Evaluated by 1 of 3 users.';
                if (step === 1) return true;
            }
            if (this.evaluation.discussion || this.evaluation.reviews.length >= 2) {
                this.statusText = 'Evaluated by 2 of 3 users.';
                if (step === 2) return true;
            }
            if (this.evaluation.discussion || this.evaluation.reviews.length >= 3) {
                this.statusText = `Evaluated by 3 of 3 users. Your ${this.evaluation.isApplication ? 'application' : 'evaluation'} is currently in the group stage, where NAT members discuss and decide the consensus!`;
                if (step === 3) return true;
            }
            if (this.evaluation.discussion && this.evaluation.consensus) {
                this.statusText = 'Consensus set! The NAT is currently working on additional feedback.';
                if (step === 4) return true;
            }
            
            return false;
        }
    },

}
</script>
