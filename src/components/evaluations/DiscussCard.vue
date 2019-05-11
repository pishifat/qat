<template>
    <div
        class="col-lg-3 col-md-4 col-sm-6 my-2"
        @click="discussApp ? selectDiscussApp() : selectDiscussRound()"
    >
        <div
            class="card custom-bg-dark border-outline"
            :class="[isSelected ? 'selected-card' : '', 'border-' + findRelevantEval()]"
            data-toggle="modal"
            data-target="#discussionInfo"
            :data-user="discussApp ? discussApp.id : discussRound.id"
        >
            <div class="card-body">
                <div class="card-status" :class="'card-status-' + consensus"></div>
                <p class="card-text text-shadow">
                    <a
                        @click.stop
                        :href="'https://osu.ppy.sh/users/' + userToEvaluate.osuId"
                        target="_blank"
                        >{{ userToEvaluate.username }}</a
                    >
                </p>
            </div>
            <div class="card-footer small">
                <i v-if="mode == 'osu'" class="far fa-circle"></i>
                <i v-else-if="mode == 'taiko'" class="fas fa-drum"></i>
                <i v-else-if="mode == 'catch'" class="fas fa-apple-alt"></i>
                <i v-else-if="mode == 'mania'" class="fas fa-stream"></i>
                <span
                    v-if="pass"
                    class="badge badge-pass mx-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="pass"
                    >{{ pass }}</span
                >
                <span
                    v-if="neutral"
                    class="badge badge-neutral mx-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="neutral"
                    >{{ neutral }}</span
                >
                <span
                    v-if="extend"
                    class="badge badge-extend mx-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="extend"
                    >{{ extend }}</span
                >
                <span
                    v-if="fail"
                    class="badge badge-fail mx-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="fail"
                    >{{ fail }}</span
                >
                <i class="fas fa-clock mx-1"></i>
                <span v-if="discussApp" class="errors">
                    {{ createDeadline(discussApp.createdAt) }}
                    <input
                        v-if="!readOnly && evaluator && evaluator.isLeader"
                        @click.stop="checkSelection()"
                        class="float-right"
                        :id="discussApp.id + '-check'"
                        type="checkbox"
                        name="evalTypeCheck"
                        :value="discussApp.id"
                    />
                </span>
                <span v-else class="errors">
                    {{ new Date(discussRound.deadline).toString().slice(4, 10) }}
                    <input
                        v-if="!readOnly && evaluator && evaluator.isLeader"
                        @click.stop="checkSelection()"
                        class="float-right"
                        :id="discussRound.id + '-check'"
                        type="checkbox"
                        name="evalTypeCheck"
                        :value="discussRound.id"
                    />
                </span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'discuss-card',
    props: ['discuss-app', 'discuss-round', 'evaluator', 'all-checked', 'read-only', 'user-to-evaluate', 'mode'],
    watch: {
        discussApp: function(v) {
            this.addVotes();
        },
        discussRound: function(v) {
            this.addVotes();
        },
        allChecked: function() {
            this.checkSelection();
        },
    },
    computed: {
        consensus: function() {
            if (this.discussApp) return this.discussApp.consensus;
            else if (this.discussRound) return this.discussRound.consensus;
        }
    },
    methods: {
        selectDiscussApp: function() {
            this.$emit('update:selectedDiscussApp', this.discussApp);
            this.$emit('update:selectedDiscussRound', null);
        },
        selectDiscussRound: function() {
            this.$emit('update:selectedDiscussRound', this.discussRound);
            this.$emit('update:selectedDiscussApp', null);
        },
        findRelevantEval: function() {
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
        addVotes: function() {
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
        createDeadline: function(date) {
            date = new Date(date);
            date = new Date(date.setDate(date.getDate() + 14)).toString().slice(4, 10);
            return date;
        },
        checkSelection: function() {
            if (this.discussApp && $(`#${this.discussApp.id}-check`).is(':checked')) {
                this.isSelected = true;
            } else if (this.discussRound && $(`#${this.discussRound.id}-check`).is(':checked')) {
                this.isSelected = true;
            } else {
                this.isSelected = false;
            }
        },
    },
    data() {
        return {
            pass: 0,
            neutral: 0,
            extend: 0,
            fail: 0,
            isSelected: false,
        };
    },
    created() {
        this.addVotes();
    },
};
</script>

<style>
.card {
    min-height: 80px;
}
</style>
