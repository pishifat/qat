<template>
    <div>
        <div v-if="!selectedEvaluation.isResignation">
            <p class="mb-2">
                <b>Feedback:</b>
                <a
                    class="ml-1"
                    :class="previewFeedback ? 'text-success' : ''"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="toggle feedback preview"
                    href="#"
                    @click.prevent="togglePreviewFeedback()"
                >
                    <i class="fas fa-search" />
                </a>
            </p>

            <div v-if="previewFeedback" class="small mb-2 card card-body v-html-content" v-html="$md.render(feedback)" />
            
            <textarea
                v-model="feedback"
                :class="feedback != selectedEvaluation.feedback ? 'bg-dark' : ''"
                class="form-control mb-2"
                rows="2"
            />

            <b v-if="feedback.length > 500" class="text-warning float-right">{{ feedback.length }}</b>

            <span v-if="feedback != selectedEvaluation.feedback" class="small text-danger">Feedback is currently not saved.</span>

            <button
                class="btn btn-sm btn-block btn-primary ml-0 ml-sm-auto"
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
            :is-pass-app="selectedEvaluation.isApplication && selectedEvaluation.consensus === 'pass'"
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