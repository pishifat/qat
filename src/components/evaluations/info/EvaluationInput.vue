<template>
    <div>
        <div class="row">
            <div class="col-sm-8">
                <p class="text-shadow min-spacing mb-1">
                    Modding comments:
                </p>
                <div class="form-group">
                    <textarea
                        id="moddingComments"
                        v-model="moddingComment"
                        class="form-control dark-textarea"
                        style="white-space: pre-line;"
                        rows="4"
                        maxlength="3000"
                    />
                </div>
            </div>
            <div class="col-sm-4">
                <p class="text-shadow min-spacing mb-1">
                    Behavior comments:
                </p>
                <div class="form-group">
                    <textarea
                        id="behaviorComments"
                        v-model="behaviorComment"
                        class="form-control dark-textarea"
                        style="white-space: pre-line;"
                        rows="4"
                        maxlength="3000"
                    />
                </div>
            </div>
        </div>
        <div class="d-flex justify-content-end mb-2">
            <div class="form-check form-check-inline">
                <input
                    id="1"
                    v-model="vote"
                    class="form-check-input"
                    type="radio"
                    name="vote"
                    value="1"
                >
                <label class="form-check-label text-shadow vote-pass" for="1">Pass</label>
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
                <label class="form-check-label text-shadow vote-neutral" for="2">{{ isApplication ? 'Neutral' : 'Probation' }}</label>
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
                <label class="form-check-label text-shadow vote-fail" for="3">Fail</label>
            </div>
        </div>
        <div class="d-flex justify-content-end">
            <p class="text-shadow min-spacing mt-1 mr-2" :class="info.length ? 'errors' : 'confirm'">
                {{ info }} {{ confirm }}
            </p>
            <button class="btn btn-sm btn-nat" @click="submitEval($event)">
                {{ evaluationId ? 'Update Evaluation' : 'Submit Evaluation' }}
            </button>
        </div>
    </div>
</template>

<script>
import postData from '../../../mixins/postData.js';

export default {
    name: 'EvaluationInput',
    mixins: [ postData ],
    props: {
        isApplication: Boolean,
        nominatorAssessmentMongoId: String,
        evaluatorMongoId: String,
        evaluations: Array,
    },
    data() {
        return {
            moddingComment: '',
            behaviorComment: '',
            vote: 0,
            evaluationId: null,
            info: '',
            confirm: '',
        };
    },
    watch: {
        nominatorAssessmentMongoId() {
            this.findUserEvaluation();
        },
    },
    mounted() {
        this.findUserEvaluation();
    },
    methods: {
        findUserEvaluation() {
            this.info = '',
            this.confirm = '',
            this.moddingComment = '';
            this.behaviorComment = '';
            this.vote = 0;
            this.evaluationId = null;
            this.evaluations.forEach(evaluation => {
                if (evaluation.evaluator.id == this.evaluatorMongoId) {
                    this.behaviorComment = evaluation.behaviorComment;
                    this.moddingComment = evaluation.moddingComment;
                    this.vote = evaluation.vote;
                    this.evaluationId = evaluation.id;
                }
            });
        },
        async submitEval (e) {
            if (!this.vote || !this.moddingComment.length || !this.behaviorComment.length) {
                this.info = 'Cannot leave fields blank!';
                this.confirm = '';
            } else {
                const r = await this.executePost(
                    `/${this.isApplication ? 'appEval' : 'bnEval'}/submitEval/${this.nominatorAssessmentMongoId}`, {
                        evaluationId: this.evaluationId,
                        vote: this.vote,
                        moddingComment: this.moddingComment,
                        behaviorComment: this.behaviorComment,
                    }, e);

                if (r) {
                    if (r.error) {
                        this.info = r.error;
                        this.confirm = '';
                    } else {
                        await this.$emit('update-nominator-assessment', r);
                        this.findUserEvaluation();
                        this.confirm = 'Submitted!';
                    }
                }
            }
        },
    },
};
</script>