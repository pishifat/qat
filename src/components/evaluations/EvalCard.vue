<template>
    <div
        class="col-lg-3 col-md-4 col-sm-6 my-2"
        @click="application ? selectApplication() : selectEvalRound()"
    >
        <div
            class="card border-outline"
            :class="[isSelected ? 'selected-card' : '', 'border-' + findRelevantEval(), (application && (application.isPriority || isNatEvaluator())) || (evalRound && evalRound.isPriority) ? 'card-bg-priority' : 'custom-bg-dark']"
            data-toggle="modal"
            data-target="#evaluationInfo"
        >
            <div class="card-body mx-1">
                <p class="card-text text-shadow">
                    <a :href="'https://osu.ppy.sh/users/' + userToEvaluate.osuId" target="_blank" @click.stop>
                        {{ userToEvaluate.username }}
                    </a>
                </p>
            </div>
            <div class="card-footer small">
                <i v-if="mode == 'osu'" class="far fa-circle" />
                <i v-else-if="mode == 'taiko'" class="fas fa-drum" />
                <i v-else-if="mode == 'catch'" class="fas fa-apple-alt" />
                <i v-else-if="mode == 'mania'" class="fas fa-stream" />
                <span v-if="application">
                    <span
                        v-if="evaluator.isNat"
                        class="badge badge-none mx-1"
                        data-toggle="tooltip"
                        data-placement="top"
                        :title="separateEvals()"
                    >{{ application.evaluations.length }}
                    </span>
                    <i
                        class="fas fa-clock mx-1"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="deadline"
                    />
                    <span class="errors">
                        {{ createDeadline(application.createdAt) }}
                    </span>
                    <input
                        v-if="evaluator && evaluator.isLeader"
                        :id="application.id + '-check'"
                        class="float-right"
                        type="checkbox"
                        name="evalTypeCheck"
                        :value="application.id"
                        @click.stop="checkSelection()"
                    >
                </span>
                <span v-else>
                    <span
                        class="badge badge-none mx-1"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="total evaluations"
                    >{{ evalRound.evaluations.length }}
                    </span>
                    <i
                        class="fas fa-clock mx-1"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="deadline"
                    />
                    <span class="errors">
                        {{ new Date(evalRound.deadline).toString().slice(4, 10) }}
                    </span>
                    <input
                        v-if="evaluator && evaluator.isLeader"
                        :id="evalRound.id + '-check'"
                        class="float-right"
                        type="checkbox"
                        name="evalTypeCheck"
                        :value="evalRound.id"
                        @click.stop="checkSelection()"
                    >
                </span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'EvalCard',
    props: ['application', 'evalRound', 'evaluator', 'allChecked', 'userToEvaluate', 'mode'],
    data() {
        return {
            isSelected: false,
        };
    },
    watch: {
        allChecked() {
            this.checkSelection();
        },
    },
    methods: {
        selectApplication() {
            this.$emit('update:selectedApplication', this.application);
        },
        selectEvalRound() {
            this.$emit('update:selectedEvalRound', this.evalRound);
        },
        findRelevantEval() {
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
        createDeadline(date) {
            date = new Date(date);
            date = new Date(date.setDate(date.getDate() + 7)).toString().slice(4, 10);
            return date;
        },
        checkSelection() {
            if (this.application && $(`#${this.application.id}-check`).is(':checked')) {
                this.isSelected = true;
            } else if (this.evalRound && $(`#${this.evalRound.id}-check`).is(':checked')) {
                this.isSelected = true;
            } else {
                this.isSelected = false;
            }
        },
        isNatEvaluator() {
            for (let i = 0; i < this.application.natEvaluators.length; i++) {
                let user = this.application.natEvaluators[i];
                if(user.id == this.evaluator.id){
                    return true;
                }
            }
            return false;
        },
        separateEvals() {
            let bn = 0;
            let nat = 0;
            this.application.evaluations.forEach(e => {
                if(e.evaluator.group == 'bn') bn++;
                else nat++;
            });
            return bn + (bn == 1 ? ' BN eval, ' : ' BN evals, ') + nat + (nat == 1 ? ' NAT eval' : ' NAT evals');
        }
    },
};
</script>

<style>
.card {
    min-height: 80px;
}
</style>
