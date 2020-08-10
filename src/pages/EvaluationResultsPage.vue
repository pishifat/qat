<template>
    <div v-cloak>
        <div v-if="evaluation.error" class="card card-body text-center">
            <p>Evaluation failed to load. Send the info below to <a href="https://osu.ppy.sh/community/chat?sendto=3178418" target="_blank">pishifat</a> if you're not trying to break things.</p>
            <p class="text-danger">
                <samp>{{ evaluation.error }}</samp>
            </p>
        </div>
        <div v-else>
            <div class="card card-body">
                <h4 class="text-center">
                    <a :href="'https://osu.ppy.sh/users/' + evaluation.user.osuId" target="_blank">
                        {{ evaluation.user.username }}
                    </a>
                </h4>
                <h5 class="text-center">
                    {{ evaluation.mode == 'osu' ? 'osu!' : 'osu!' + evaluation.mode }} {{ evaluation.kind == 'application' ? 'BN application' : 'nomination assessment' }}
                </h5>
                <h5 v-if="evaluation.consensus" class="text-center">
                    Consensus: <span :class="consensusColor">{{ consensusText }}</span>
                </h5>
                <div v-else class="text-center">
                    The NAT are busy evaluating! Come back soon.
                </div>

                <div>
                    <div v-if="evaluation.kind == 'application' && evaluation.consensus == 'pass'">
                        <h5>New BN Information</h5>
                        <p>You will be a Probationary Beatmap Nominator for about one month (exact date of your next evaluation can be seen from your <a :href="'/users?id=' + evaluation.user.id" target="_blank">user card</a>). This means you can only nominate beatmaps that have been nominated by Full Beatmap Nominators and you cannot disqualify maps.</p>
                        <p>During your evaluation, your activity/attitude/nomination quality will be evaluated by members of the NAT. If each of these areas are satisfactory, you will be promoted to Full Beatmap Nominator. If not, your probation period will be extended for another month or you'll be dismissed from the BN. In that second case, you will not be able to re-apply for another 90 days.</p>
                        <p>Read the following pages: <a href="https://osu.ppy.sh/help/wiki/People/Beatmap_Nominators/Rules" target="_blank">BN Rules</a>,  <a href="https://osu.ppy.sh/help/wiki/People/Beatmap_Nominators/General_Information" target="_blank">General Information for BNs</a>, and  <a href="https://osu.ppy.sh/help/wiki/People/The_Team/Beatmap_Nominators/Beatmap_Veto" target="_blank">Veto Information</a>.</p>
                        <p>Follow the golden rule: <b>don't fuck up</b></p>
                    </div>

                    <div v-if="evaluation.feedback">
                        <h5>Feedback</h5>
                        <div class="card card-body small mb-4" v-html="$md.render(evaluation.feedback)" />
                    </div>

                    <div v-if="evaluation.kind == 'application'">
                        <h5>Test results</h5>
                        <p>
                            Final score:
                            <span :class="scoreColor">
                                {{ evaluation.test.totalScore }}/20
                            </span>
                        </p>
                        <p><a href="/testresults" target="_blank">View your full test breakdown here</a></p>
                    </div>

                    <h5>Evaluators</h5>
                    <p>Contact any member of the NAT below if you have questions about your evaluation!</p>
                    <div class="card card-body">
                        <ul>
                            <li v-for="review in natReviews" :key="review.id">
                                <a :href="'https://osu.ppy.sh/users/' + review.evaluator.osuId" target="_blank" :class="review.evaluator.groups.includes('nat') ? 'text-nat' : review.evaluator.groups.includes('bn') ? 'text-probation' : ''">
                                    {{ review.evaluator.username }}
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../mixins/postData.js';

export default {
    name: 'EvaluationResultsPage',
    mixins: [ postData ],
    data() {
        return {
            evaluation: { error: 'No result from initial request' },
        };
    },
    computed: {
        /** @returns {array} */
        natReviews () {
            return this.evaluation.reviews.filter(r => r.evaluator.isNat);
        },
        /** @returns {string} */
        scoreColor() {
            if (this.evaluation.test.totalScore > 15) {
                return 'text-success';
            } else if (this.evaluation.test.totalScore > 12.5) {
                return 'text-neutral';
            } else {
                return 'text-danger';
            }
        },
        /** @returns {string} */
        consensusText() {
            if (!this.evaluation.consensus) {
                return 'none';
            } else if (this.evaluation.consensus == 'pass') {
                if (this.evaluation.isLowActivity) {
                    return 'pass + low activity warning';
                } else if (this.evaluation.isMoveToNat) {
                    return 'pass + move to NAT';
                } else if (this.evaluation.isMoveToBn) {
                    return 'pass + move to BN';
                } else {
                    return this.evaluation.consensus;
                }
            } else if (this.evaluation.resignedOnGoodTerms) {
                return 'fail + resigned on good terms';
            } else if (this.evaluation.resignedOnStandardTerms) {
                return 'fail + resigned on standard terms';
            } else {
                return this.evaluation.consensus;
            }
        },
        /** @returns {string} */
        consensusColor() {
            if (!this.evaluation.consensus) {
                return '';
            } else {
                return 'text-' + this.evaluation.consensus;
            }
        },
    },
    async created() {
        const id = this.$route.query.id;

        const evaluation = await this.initialRequest('/evaluationResults/evaluation/' + id);

        if (evaluation) {
            this.evaluation = evaluation;
        }
    },
};
</script>
