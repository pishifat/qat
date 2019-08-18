<template>
    <div
        class="col-lg-3 col-md-4 col-sm-6 my-2"
        @click="discussApp ? selectDiscussApp() : selectDiscussRound()"
    >
        <div
            class="card border-outline"
            :class="[isSelected ? 'selected-card' : '', 'border-' + findRelevantEval(), (discussApp && (discussApp.isPriority || isNatEvaluator())) || (discussRound && discussRound.isPriority) ? 'card-bg-priority' : 'custom-bg-dark']"
            data-toggle="modal"
            data-target="#discussionInfo"
            :data-user="discussApp ? discussApp.id : discussRound.id"
        >
            <div class="card-body">
                <div class="card-status" :class="'card-status-' + consensus" />
                <p class="card-text text-shadow">
                    <a
                        :href="'https://osu.ppy.sh/users/' + userToEvaluate.osuId"
                        target="_blank"
                        @click.stop
                    >{{ userToEvaluate.username }}</a>
                </p>
            </div>
            <div class="card-footer small">
                <i v-if="mode == 'osu'" class="far fa-circle" />
                <i v-else-if="mode == 'taiko'" class="fas fa-drum" />
                <i v-else-if="mode == 'catch'" class="fas fa-apple-alt" />
                <i v-else-if="mode == 'mania'" class="fas fa-stream" />
                <span
                    v-if="pass"
                    class="badge badge-pass mx-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="pass"
                >{{ pass }}</span>
                <span
                    v-if="neutral"
                    class="badge badge-neutral mx-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="neutral"
                >{{ neutral }}</span>
                <span
                    v-if="extend"
                    class="badge badge-extend mx-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="extend"
                >{{ extend }}</span>
                <span
                    v-if="fail"
                    class="badge badge-fail mx-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="fail"
                >{{ fail }}</span>
                <i
                    class="fas fa-clock mx-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="deadline"
                />
                <span v-if="discussApp">
                    <span class="errors">{{ createDeadline(discussApp.createdAt) }}</span>
                    <input
                        v-if="!readOnly && evaluator && evaluator.isLeader"
                        :id="discussApp.id + '-check'"
                        class="float-right ml-2"
                        type="checkbox"
                        name="evalTypeCheck"
                        :value="discussApp.id"
                        @click.stop="checkSelection()"
                    >
                    <i
                        v-if="discussApp.feedback" 
                        data-toggle="tooltip"
                        data-placement="top"
                        title="feedback written" 
                        class="fas fa-comment float-right"
                    />
                </span>
                <span v-else>
                    <span class="errors"> {{ new Date(discussRound.deadline).toString().slice(4, 10) }}</span>
                    <input
                        v-if="!readOnly && evaluator && evaluator.isLeader"
                        :id="discussRound.id + '-check'"
                        class="float-right ml-2"
                        type="checkbox"
                        name="evalTypeCheck"
                        :value="discussRound.id"
                        @click.stop="checkSelection()"
                    >
                    <i
                        v-if="discussRound.feedback" 
                        data-toggle="tooltip"
                        data-placement="top"
                        title="feedback written" 
                        class="fas fa-comment float-right"
                    />
                </span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'DiscussCard',
    props: ['discussApp', 'discussRound', 'evaluator', 'allChecked', 'readOnly', 'userToEvaluate', 'mode'],
    data() {
        return {
            pass: 0,
            neutral: 0,
            extend: 0,
            fail: 0,
            isSelected: false,
        };
    },
    computed: {
        consensus() {
            if (this.discussApp) return this.discussApp.consensus;
            else return this.discussRound.consensus;
        },
    },
    watch: {
        discussApp() {
            this.addVotes();
        },
        discussRound() {
            this.addVotes();
        },
        allChecked() {
            this.checkSelection();
        },
    },
    created() {
        this.addVotes();
    },
    methods: {
        selectDiscussApp() {
            this.$emit('update:selectedDiscussApp', this.discussApp);
            this.$emit('update:selectedDiscussRound', null);
        },
        selectDiscussRound() {
            this.$emit('update:selectedDiscussRound', this.discussRound);
            this.$emit('update:selectedDiscussApp', null);
        },
        findRelevantEval() {
            let vote;
            if (this.discussApp && this.discussApp.evaluations) {
                this.discussApp.evaluations.forEach(ev => {
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
            } else if (this.discussRound && this.discussRound.evaluations) {
                this.discussRound.evaluations.forEach(ev => {
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
            }
            return vote;
        },
        addVotes() {
            this.pass = 0;
            this.neutral = 0;
            this.extend = 0;
            this.fail = 0;
            if (this.discussApp && this.discussApp.evaluations) {
                this.discussApp.evaluations.forEach(ev => {
                    if (ev.vote == 1) {
                        this.pass++;
                    } else if (ev.vote == 2) {
                        this.neutral++;
                    } else if (ev.vote == 3) {
                        this.fail++;
                    }
                });
            } else if (this.discussRound && this.discussRound.evaluations) {
                this.discussRound.evaluations.forEach(ev => {
                    if (ev.vote == 1) {
                        this.pass++;
                    } else if (ev.vote == 2) {
                        this.extend++;
                    } else if (ev.vote == 3) {
                        this.fail++;
                    }
                });
            }
        },
        createDeadline(date) {
            date = new Date(date);
            date = new Date(date.setDate(date.getDate() + 14)).toString().slice(4, 10);
            return date;
        },
        checkSelection() {
            if (this.discussApp && $(`#${this.discussApp.id}-check`).is(':checked')) {
                this.isSelected = true;
            } else if (this.discussRound && $(`#${this.discussRound.id}-check`).is(':checked')) {
                this.isSelected = true;
            } else {
                this.isSelected = false;
            }
        },
        isNatEvaluator() {
            for (let i = 0; i < this.discussApp.natEvaluators.length; i++) {
                let user = this.discussApp.natEvaluators[i];
                if(user.id == this.evaluator.id){
                    return true;
                }
            }
            return false;
        },
    },
};
</script>

<style>
.card {
    min-height: 80px;
}
</style>
