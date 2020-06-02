<template>
    <div>
        <div class="row">
            <div class="col-sm-12">
                <p>
                    <b>Modding comments:</b>
                </p>

                <div class="form-group">
                    <textarea
                        id="moddingComments"
                        v-model="moddingComment"
                        class="form-control"
                        rows="4"
                        maxlength="3000"
                    />
                </div>
            </div>

            <div class="col-sm-12">
                <p>
                    <b>Behavior comments:</b>
                </p>

                <div class="form-group">
                    <textarea
                        id="behaviorComments"
                        v-model="behaviorComment"
                        class="form-control"
                        rows="4"
                        maxlength="3000"
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
                <label class="form-check-label text-pass" for="1">Pass</label>
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
                <label class="form-check-label text-neutral" for="2">{{ isApplication ? 'Neutral' : 'Probation' }}</label>
            </div>
            <div class="form-check form-check-inline">
                <input
                    id="3"
                    v-model="vote"
                    class="form-check-input"
                    type="radio"
                    name="vote"
                    value="3"
                >
                <label class="form-check-label text-fail" for="3">Fail</label>
            </div>

            <button class="btn btn-sm btn-primary" @click="submitEval($event)">
                {{ evaluationId ? 'Update Evaluation' : 'Submit Evaluation' }}
            </button>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import postData from '../../../mixins/postData.js';

export default {
    name: 'EvaluationInput',
    mixins: [ postData ],
    props: {
        isApplication: Boolean,
        nominatorAssessmentMongoId: {
            type: String,
            required: true,
        },
        evaluations: {
            type: Array,
            default() {
                return [];
            },
        },
    },
    data() {
        return {
            moddingComment: '',
            behaviorComment: '',
            vote: 0,
            evaluationId: null,
        };
    },
    computed: {
        ...mapGetters([
            'evaluatorId',
        ]),
    },
    watch: {
        evaluations() {
            this.findUserEvaluation();
        },
    },
    mounted() {
        this.findUserEvaluation();
    },
    methods: {
        findUserEvaluation() {
            this.moddingComment = '';
            this.behaviorComment = '';
            this.vote = 0;
            this.evaluationId = null;
            this.evaluations.forEach(evaluation => {
                if (evaluation.evaluator.id == this.evaluatorId) {
                    this.behaviorComment = evaluation.behaviorComment;
                    this.moddingComment = evaluation.moddingComment;
                    this.vote = evaluation.vote;
                    this.evaluationId = evaluation.id;
                }
            });
        },
        async submitEval (e) {
            if (!this.vote || !this.moddingComment.length || !this.behaviorComment.length) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Cannot leave fields blank!`,
                    type: 'danger',
                });
            } else {
                const result = await this.executePost(
                    `/${this.isApplication ? 'appEval' : 'bnEval'}/submitEval/${this.nominatorAssessmentMongoId}`, {
                        evaluationId: this.evaluationId,
                        vote: this.vote,
                        moddingComment: this.moddingComment,
                        behaviorComment: this.behaviorComment,
                    }, e);

                if (result && !result.error) {
                    this.$store.dispatch(this.isApplication ? 'updateApplication' : 'updateEvalRound', result);
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