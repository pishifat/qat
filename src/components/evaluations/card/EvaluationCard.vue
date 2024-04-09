<template>
    <div
        class="col-xl-3 col-lg-4 col-md-6 col-sm-12 my-2"
        @click="select()"
    >
        <div
            class="card border-dark cursor-pointer"
            :class="[isSelected ? 'bg-blue-gray' : '', 'border-' + relevantReviewVote, isAssigned ? 'assigned' : '', 'card-bg-' + imageClass]"
            data-toggle="modal"
            :data-target="target"
        >
            <card-header
                :mode="evaluation.mode"
                :username="username"
                :osu-id="osuId"
                :consensus="evaluation.consensus"
                :addition="evaluation.addition"
                :feedback="evaluation.feedback"
                :is-reviewed="evaluation.isReviewed"
                :is-pass-app="evaluation.isApplication && evaluation.consensus === 'pass'"
                :is-security-checked="evaluation.isSecurityChecked"
                :has-nat-buddy="Boolean(evaluation.natBuddy)"
                :is-nat-or-trial-nat="loggedInUser.isNatOrTrialNat"
                :is-discussion="evaluation.discussion"
                :is-resignation="evaluation.kind == 'resignation'"
                :is-nat-evaluation="Boolean(evaluation.selfSummary)"
                :is-public="evaluation.isPublic"
                :is-active="evaluation.active"
                :is-app="evaluation.isApplication"
            />

            <card-footer
                :evaluation-id="evaluation.id"
                :reviews="evaluation.reviews"
                :deadline="deadline.toString()"
                :is-discussion="evaluation.discussion"
                :is-active="evaluation.active"
                :archived-at="evaluation.archivedAt"
                :is-nat="['remainInNat', 'moveToBn', 'removeFromNat'].includes(evaluation.consensus)"
                :is-public="evaluation.isPublic"
            />
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import CardHeader from './CardHeader.vue';
import CardFooter from './CardFooter.vue';

export default {
    name: 'EvaluationCard',
    components: {
        CardHeader,
        CardFooter,
    },
    props: {
        evaluation: {
            type: Object,
            required: true,
        },
        target: {
            type: String,
            required: true,
        },
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapState('evaluations', [
            'checkedEvaluations',
        ]),
        relevantReviewVote () {
            const review = this.evaluation.reviews.find(e => e.evaluator && e.evaluator.id == this.loggedInUser.id);

            if (review) {
                switch (review.vote) {
                    case 1:
                        return 'pass';
                    case 2:
                        return 'neutral';
                    case 3:
                        return 'fail';
                }
            }

            return '';
        },
        isAssigned () {
            return (this.evaluation.natEvaluators && this.evaluation.natEvaluators.some(e => e.id == this.loggedInUser.id) ||
            this.evaluation.bnEvaluators && this.evaluation.bnEvaluators.some(e => e.id == this.loggedInUser.id));
        },
        username () {
            return this.evaluation.user.username;
        },
        osuId () {
            return this.evaluation.user.osuId;
        },
        imageClass() {
            if (this.evaluation.isApplication || this.evaluation.isResignation || this.evaluation.consensus === 'removeFromNat') return 'user';
            else if (this.evaluation.user.probationModes.includes(this.evaluation.mode) || this.evaluation.consensus === 'probationBn') return 'probation';
            else if (this.evaluation.user.fullModes.includes(this.evaluation.mode) || this.evaluation.consensus === 'fullBn' || this.evaluation.consensus === 'moveToBn') return 'bn';
            else if (this.evaluation.user.evaluatorModes.includes(this.evaluation.mode) || this.evaluation.user.evaluatorModes.includes('none') || this.evaluation.consensus === 'remainInNat') return 'nat';
            else return 'user';
        },
        isSelected () {
            if (!this.checkedEvaluations) return false;

            return this.checkedEvaluations.includes(this.evaluation.id);
        },
        deadline () { // display +7 days for current BN evals in groups
            if (this.evaluation.isApplication || !this.evaluation.discussion) {
                return this.evaluation.deadline;
            } else {
                const tempDate = new Date(this.evaluation.deadline);
                tempDate.setDate(tempDate.getDate() + 7);

                return tempDate;
            }
        },
    },
    methods: {
        select() {
            this.$store.commit('evaluations/setSelectedEvaluationId', this.evaluation.id);

            if (
                this.$route.query.id !== this.evaluation.id && 
                (this.loggedInUser.isNatOrTrialNat || this.evaluation.isPublic)
            ) {
                let url = this.$route.path;

                if (this.evaluation.active) {
                    if (this.evaluation.isApplication) {
                        url = '/appeval';
                    } else {
                        url = '/bneval';
                    }
                }

                this.$router.replace(`${url}?id=${this.evaluation.id}`);
            }
        },
    },
};
</script>

<style>

.card-bg-bn {
    background-image: url('~/public/images/bn-transparent.png');
    background-repeat: repeat-y;
    background-position: left top;
}
.card-bg-probation {
    background-image: url('~/public/images/probation-transparent.png');
    background-repeat: repeat-y;
    background-position: left top;
}
.card-bg-user {
    background-image: url('~/public/images/user-transparent.png');
    background-repeat: repeat-y;
    background-position: left top;
}

.card-bg-nat {
    background-image: url('~/public/images/nat.png');
    background-repeat: repeat-y;
    background-position: left top;
}

.assigned {
    background-color: rgb(95, 60, 60) !important
}

</style>