<template>
    <div>
        <div v-if="!selectedEvaluation.isResignation">
            <p class="mb-2">
                <b>Feedback:</b>
                <a
                    class="ml-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="toggle feedback preview"
                    href="#"
                    @click.prevent="togglePreviewFeedback()"
                >
                    <i class="fas fa-search" />
                </a>
            </p>

            <div v-if="previewFeedback" class="small ml-2 card card-body" v-html="$md.render(feedback)" />
            
            <textarea v-else v-model="feedback" class="form-control mb-2" rows="4" />

            <button
                class="btn btn-sm btn-block btn-primary my-2 ml-0 ml-sm-auto"
                @click="setFeedback($event)"
            >
                Save feedback
            </button>

        <hr />

            <input
                v-if="selectedEvaluation.isApplication && positiveConsensus"
                v-model="discordLink"
                class="form-control my-2 mt-4"
                type="text"
                placeholder="discord invite link..."
            />
        </div>

        <feedback-pm
            v-if="
                (
                    selectedEvaluation.feedback &&
                    selectedEvaluation.feedback.length 
                ) ||
                selectedEvaluation.isResignation
            "
            :discord-link="discordLink"
            :is-reviewable="!selectedEvaluation.isResignation"
        />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import evaluations from '../../../../mixins/evaluations.js';
import FeedbackPm from './FeedbackPm.vue';

export default {
    name: 'FeedbackInfo',
    components: {
        FeedbackPm,
    },
    mixins: [evaluations],
    data() {
        return {
            feedback: '',
            discordLink: '',
        };
    },
    computed: {
        ...mapState('evaluations', ['previewFeedback']),
        ...mapGetters('evaluations', ['selectedEvaluation']),

        /** @returns {string} */
        consensus() {
            return this.selectedEvaluation.consensus;
        },
    },
    watch: {
        selectedEvaluation() {
            this.feedback = this.selectedEvaluation.feedback;
        },
    },
    mounted() {
        this.feedback = this.selectedEvaluation.feedback;
        this.$store.commit('evaluations/resetPreviewState');
    },
    methods: {
        togglePreviewFeedback() {
            this.$store.commit('evaluations/togglePreviewFeedback');
        },
        async setFeedback(e) {
            const result = await this.$http.executePost(
                `/${
                    this.selectedEvaluation.isApplication ? 'appEval' : 'bnEval'
                }/setFeedback/` + this.selectedEvaluation.id,
                { feedback: this.feedback },
                e
            );

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