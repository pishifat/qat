<template>
    <div>
        <div v-if="!selectedEvaluation.isResignation">
            <div>
                <b>Additional feedback:</b>
            </div>

            <div class="row">
                <div class="col-sm-6">
                    <textarea
                        v-model="feedback"
                        :class="feedback != selectedEvaluation.feedback ? 'bg-dark' : ''"
                        class="form-control mb-2"
                        :rows="getRows()"
                        placeholder="optional..."
                    />
                </div>
                <div class="col-sm-6 mb-2">
                    <div v-if="feedback && feedback.length" class="small card card-body v-html-content" v-html="$md.render(feedback)" />
                    <div v-else class="small card card-body text-secondary">
                        feedback preview
                    </div>
                </div>
            </div>

            <b v-if="feedback && feedback.length > 500" class="text-warning float-right">{{ feedback.length }}</b>

            <span v-if="feedback != selectedEvaluation.feedback" class="small text-danger">Feedback is currently not saved.</span>

            <button
                class="btn btn-sm btn-block btn-primary ml-0 ml-sm-auto"
                @click="setFeedback($event)"
            >
                Save feedback
            </button>

            <hr>
            <div v-if="negativeConsensus" class="mb-3">
                <b>Hide cooldown text: </b>
                <a
                    href="#"
                    data-toggle="tooltip"
                    data-placement="right"
                    title="Will reset on page refresh"
                    @click.prevent="toggleHideCooldownText($event)"
                >
                    <font-awesome-icon
                        icon="fa-solid fa-circle-check"
                        :class="hideCooldownText ? 'text-success' : 'text-secondary'"
                    />
                </a>
            </div>

            <input
                v-if="selectedEvaluation.isApplication && positiveConsensus"
                v-model="discordLink"
                class="form-control my-2 mt-4"
                type="text"
                placeholder="discord invite link..."
            >
        </div>

        <feedback-pm
            :discord-link="discordLink"
            :is-reviewable="!selectedEvaluation.isResignation"
            :is-pass-app="selectedEvaluation.isApplication && selectedEvaluation.consensus === 'pass'"
            :hide-cooldown-text="hideCooldownText"
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
            hideCooldownText: false,
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
            this.feedback = this.selectedEvaluation.feedback || '';
        },
    },
    mounted() {
        this.feedback = this.selectedEvaluation.feedback || '';
    },
    methods: {
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
        getRows() {
            const lines = this.feedback.split('\n');

            return Math.max(lines.length, 2);
        },
        toggleHideCooldownText(e) {
            this.hideCooldownText = !this.hideCooldownText;
        },
    },
};
</script>
