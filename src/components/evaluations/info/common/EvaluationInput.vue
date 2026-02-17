<template>
    <div>
        <div class="row">
            <div v-if="loggedInUser.isBn && !loggedInUser.isTrialNat && !loggedInUser.isNat && selectedEvaluation.active == true && selectedEvaluation.discussion == true" class="col-sm-12 mb-2">
                The NAT have already decided the consensus for this application, but you can still submit your thoughts!
            </div>
            <div class="col-sm-12">
                <p>
                    <b>{{ selectedEvaluation.user.isNat && loggedInUser.isNatLeader ? 'NAT activity comments:' : 'Evaluation:' }}</b>
                    <a
                        :class="'ml-1 ' + (previewModdingComment ? 'text-success' : '')"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="toggle comment preview"
                        href="#"
                        @click.prevent="togglePreviewModdingComment()"
                    >
                        <i class="fas fa-search" />
                    </a>
                </p>

                <div class="form-group">
                    <div
                        v-if="previewModdingComment"
                        class="small mb-2 card card-body v-html-content"
                        v-html="$md.render(moddingComment)"
                    />
                    <textarea
                        v-model="moddingComment"
                        class="form-control"
                        rows="4"
                        maxlength="5000"
                    />
                </div>
            </div>
        </div>

        <div class="form-inline justify-content-end">
            <div class="form-check form-check-inline">
                <input
                    id="1"
                    v-model="vote"
                    class="form-check-input"
                    type="radio"
                    name="vote"
                    value="1"
                >
                <label class="form-check-label text-pass" for="1">{{ selectedEvaluation.isApplication ? 'Pass' : (selectedEvaluation.user.evaluatorModes.includes(selectedEvaluation.mode) || selectedEvaluation.user.evaluatorModes.includes("none")) && loggedInUser.isNatLeader ? 'Remain in NAT' : selectedEvaluation.isBnEvaluation ? 'Full BN' : 'Resign on good terms' }}</label>
            </div>
            <div class="form-check form-check-inline">
                <input
                    id="2"
                    v-model="vote"
                    class="form-check-input"
                    type="radio"
                    name="vote"
                    value="2"
                >
                <label class="form-check-label text-neutral" for="2">{{ selectedEvaluation.isApplication ? 'Neutral' : (selectedEvaluation.user.evaluatorModes.includes(selectedEvaluation.mode) || selectedEvaluation.user.evaluatorModes.includes("none")) && loggedInUser.isNatLeader ? 'Investigate' : selectedEvaluation.isBnEvaluation ? 'Warning' : 'Resign on standard terms' }}</label>
            </div>
            <div v-if="!selectedEvaluation.isResignation" class="form-check form-check-inline">
                <input
                    id="3"
                    v-model="vote"
                    class="form-check-input"
                    type="radio"
                    name="vote"
                    value="3"
                >
                <label class="form-check-label text-fail" for="3">{{ selectedEvaluation.isApplication ? 'Fail' : (selectedEvaluation.user.evaluatorModes.includes(selectedEvaluation.mode) || selectedEvaluation.user.evaluatorModes.includes("none")) && loggedInUser.isNatLeader ? 'Remove from NAT' : 'Remove from BN' }}</label>
            </div>

            <button class="btn btn-sm btn-primary" @click="submitEval($event)">
                {{ evaluationId ? 'Update Evaluation' : 'Submit Evaluation' }}
            </button>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
    name: 'EvaluationInput',
    data() {
        return {
            moddingComment: '',
            vote: 0,
            evaluationId: null,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapState('evaluations', [
            'previewModdingComment',
        ]),
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
    },
    watch: {
        selectedEvaluation() {
            this.findUserReview();
        },
        moddingComment() {
            this.updateLocalStorage('mod', this.moddingComment);
        },
    },
    mounted() {
        this.findUserReview();
    },
    methods: {
        togglePreviewModdingComment() {
            this.$store.commit('evaluations/togglePreviewModdingComment');
        },
        updateLocalStorage(type, text) {
            window.localStorage.setItem(this.selectedEvaluation.id + type, text);
        },
        removeLocalStorage() {
            if (window.localStorage.getItem(this.selectedEvaluation.id + 'mod')) {
                window.localStorage.removeItem(this.selectedEvaluation.id + 'mod');
            }
        },
        findUserReview() {
            this.moddingComment = '';
            this.vote = 0;
            this.evaluationId = null;
            const reviews = this.selectedEvaluation.reviews || [];
            const review = reviews.find(r => r.evaluator && r.evaluator.id == this.loggedInUser.id);
            const mockReviews = this.selectedEvaluation.mockReviews || [];
            const mockReview = mockReviews.find(r => r.evaluator && r.evaluator.id == this.loggedInUser.id);

            if (review) {
                this.evaluationId = review.id || null;
                this.moddingComment = review.moddingComment || '';
                this.vote = review.vote || 0;
            } else if (mockReview) {
                this.evaluationId = mockReview.id || null;
                this.moddingComment = mockReview.moddingComment || '';
                this.vote = mockReview.vote || 0;
            } else {
                if (window.localStorage.getItem(this.selectedEvaluation.id + 'mod')) {
                    this.moddingComment = window.localStorage.getItem(this.selectedEvaluation.id + 'mod');
                }
            }
        },
        async submitEval (e) {
            if (!this.vote || !this.moddingComment.length) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Cannot leave fields blank!`,
                    type: 'danger',
                });
            } else {
                const result = await this.$http.executePost(
                    `/${this.selectedEvaluation.isApplication ? 'appEval' : 'bnEval'}/submitEval/${this.selectedEvaluation.id}`, {
                        vote: this.vote,
                        moddingComment: this.moddingComment,
                    }, e);

                if (result && !result.error) {
                    this.removeLocalStorage();
                    this.$store.commit('evaluations/updateEvaluation', result);
                    this.$store.dispatch('updateToastMessages', {
                        message: `Submitted evaluation`,
                        type: 'success',
                    });
                }
            }
        },
    },
};
</script>