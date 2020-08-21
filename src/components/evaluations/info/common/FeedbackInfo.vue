<template>
    <div>
        <div v-if="selectedEvaluation.kind !== 'resignation'">
            <p class="mb-2">
                <b>Feedback:</b>
            </p>
            <textarea
                v-model="feedback"
                class="form-control mb-2"
                rows="4"
            />

            <input
                v-if="isApplication && selectedEvaluation.consensus == 'pass'"
                v-model="discordLink"
                class="form-control"
                type="text"
                placeholder="discord invite link..."
            >

            <button class="btn btn-sm btn-block btn-primary my-2 ml-0 ml-sm-auto" @click="setFeedback($event)">
                Save
            </button>
        </div>

        <feedback-pm
            :discord-link="discordLink"
        />
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import postData from '../../../../mixins/postData.js';
import FeedbackPm from './FeedbackPm.vue';

export default {
    name: 'FeedbackInfo',
    components: {
        FeedbackPm,
    },
    mixins: [ postData ],
    data() {
        return {
            feedback: '',
            discordLink: '',
        };
    },
    computed: {
        /** @returns {boolean} */
        resigned() {
            return this.selectedEvaluation.consensus == 'resignedOnGoodTerms' || this.selectedEvaluation.consensus == 'resignedOnStandardTerms';
        },
        ...mapGetters('evaluations', [
            'selectedEvaluation',
            'isApplication',
        ]),
    },
    watch: {
        selectedEvaluation () {
            this.feedback = this.selectedEvaluation.feedback;
        },
    },
    mounted() {
        this.feedback = this.selectedEvaluation.feedback;
    },
    methods: {
        async setFeedback (e) {
            const result = await this.executePost(
                `/${this.isApplication ? 'appEval' : 'bnEval'}/setFeedback/` + this.selectedEvaluation.id, { feedback: this.feedback }, e);

            if (result && !result.error) {
                this.$store.commit('evaluations/updateEvaluation', result);
                this.$store.dispatch('updateToastMessages', {
                    message: `Saved feedback`,
                    type: 'success',
                });
            }
        },
    },
};
</script>