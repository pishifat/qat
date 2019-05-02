<template>
    <div
        class="col-lg-3 col-md-4 col-sm-6 my-2"
        @click="application ? selectApplication() : selectEvalRound()"
    >
        <div
            class="card custom-bg-dark border-outline"
            :class="[isSelected ? 'selected-card' : '', 'border-' + findRelevantEval()]"
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
            <div class="card-footer">
                <div class="small">
                    <i v-if="mode == 'osu'" class="far fa-circle"></i>
                    <i v-else-if="mode == 'taiko'" class="fas fa-drum"></i>
                    <i v-else-if="mode == 'catch'" class="fas fa-apple-alt"></i>
                    <i v-else-if="mode == 'mania'" class="fas fa-stream"></i>
                    <i class="fas fa-clock mx-1"></i>
                    <span v-if="application">
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
