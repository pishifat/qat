<template>
    <div
        class="col-lg-3 col-md-4 col-sm-6 my-2"
        @click="application ? selectApplication() : selectEvalRound()"
        v-if="isBnEvaluator() || evaluator.group == 'nat'"
    >
        <div
            class="card border-outline"
            :class="[isSelected ? 'selected-card' : '', 'border-' + findRelevantEval(),  (application && application.isPriority) || (evalRound && evalRound.isPriority) ? 'card-bg-priority' : 'custom-bg-dark']"
            data-toggle="modal"
            data-target="#evaluationInfo"
        >
            <div class="card-body mx-1">
                <p class="card-text text-shadow">
                    <a @click.stop :href="'https://osu.ppy.sh/users/' + userToEvaluate.osuId" target="_blank">
                        {{ userToEvaluate.username }}
                    </a>
                </p>
            </div>
            <div class="card-footer small">
                <i v-if="mode == 'osu'" class="far fa-circle"></i>
                <i v-else-if="mode == 'taiko'" class="fas fa-drum"></i>
                <i v-else-if="mode == 'catch'" class="fas fa-apple-alt"></i>
                <i v-else-if="mode == 'mania'" class="fas fa-stream"></i>
                <span v-if="application">
                    <span
                        class="badge badge-none mx-1"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="total evaluations"
                        >{{ application.evaluations.length }}
                    </span>
                    <i class="fas fa-clock mx-1"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="deadline">
                    </i>
                    <span class="errors">
                        {{ createDeadline(application.createdAt) }}
                    </span>
                    <input
                        v-if="evaluator && evaluator.isLeader"
                        @click.stop="checkSelection()"
                        class="float-right"
                        :id="application.id + '-check'"
                        type="checkbox"
                        name="evalTypeCheck"
                        :value="application.id"
                    />
                </span>
                <span v-else>
                    <span
                        class="badge badge-none mx-1"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="total evaluations"
                        >{{ evalRound.evaluations.length }}
                    </span>
                    <i class="fas fa-clock mx-1"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="deadline">
                    </i>
                    <span class="errors">
                        {{ new Date(evalRound.deadline).toString().slice(4, 10) }}
                    </span>
                    <input
                        v-if="evaluator && evaluator.isLeader"
                        @click.stop="checkSelection()"
                        class="float-right"
                        :id="evalRound.id + '-check'"
                        type="checkbox"
                        name="evalTypeCheck"
                        :value="evalRound.id"
                    />
                </span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'eval-card',
    props: ['application', 'evalRound', 'evaluator', 'all-checked', 'user-to-evaluate', 'mode'],
    watch: {
        allChecked: function() {
            this.checkSelection();
        },
    },
    methods: {
        selectApplication: function() {
            this.$emit('update:selectedApplication', this.application);
        },
        selectEvalRound: function() {
            this.$emit('update:selectedEvalRound', this.evalRound);
        },
        isBnEvaluator: function() {
            if (
                this.application &&
                this.application.bnEvaluators &&
                this.application.bnEvaluators.indexOf(this.evaluator.id) >= 0
            ) {
                return true;
            } else {
                return false;
            }
        },
        findRelevantEval: function() {
            let vote;
            if (this.application) {
                this.application.evaluations.forEach(ev => {
                    if (ev.evaluator.id == this.evaluator.id) {
                        if (ev.vote == 1) {
                            vote = 'pass';
                        } else if (ev.vote == 2) {
                            vote = 'neutral';
                        } else {
                            vote = 'fail';
                        }
                    }
                });
                return vote;
            } else {
                this.evalRound.evaluations.forEach(ev => {
                    if (ev.evaluator.id == this.evaluator.id) {
                        if (ev.vote == 1) {
                            vote = 'pass';
                        } else if (ev.vote == 2) {
                            vote = 'extend';
                        } else {
                            vote = 'fail';
                        }
                    }
                });
                return vote;
            }
        },
        createDeadline: function(date) {
            date = new Date(date);
            date = new Date(date.setDate(date.getDate() + 7)).toString().slice(4, 10);
            return date;
        },
        checkSelection: function() {
            if (this.application && $(`#${this.application.id}-check`).is(':checked')) {
                this.isSelected = true;
            } else if (this.evalRound && $(`#${this.evalRound.id}-check`).is(':checked')) {
                this.isSelected = true;
            } else {
                this.isSelected = false;
            }
        },
    },
    data() {
        return {
            isSelected: false,
        };
    },
};
</script>

<style>
.card {
    min-height: 80px;
}
</style>
