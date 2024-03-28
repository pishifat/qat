<template>
    <div class="card card-body">
        <h4 class="text-center">
            <user-link
                :osu-id="evaluation.user.osuId"
                :username="evaluation.user.username"
            />
        </h4>
        <h5 class="text-center">
            {{ evaluation.mode == 'osu' ? 'osu!' : 'osu!' + evaluation.mode }} {{ evaluation.isApplication ? 'BN application' : 'nomination assessment' }} results
        </h5>
        <h5 v-if="consensus" class="text-center">
            Consensus:
            <span :class="consensusColor" class="text-capitalize">{{ consensusText }}</span>
            <span v-if="addition" :class="consensusColor" class="text-capitalize"> + {{ additionText }}</span>
        </h5>
        <div v-else class="text-center">
            The NAT are busy evaluating! Come back soon.
        </div>

        <div v-if="consensus">
            <div v-if="evaluation.isApplication">
                <a href="#applicationInfo" data-toggle="collapse">
                    <h5>Application details <i class="fas fa-angle-down" /></h5>
                </a>
                <div id="applicationInfo" class="collapse mx-4">
                    <h5>Submitted mods</h5>
                    <div v-for="(mod, i) in evaluation.mods" :key="mod" class="row">
                        <div class="col-sm-3">
                            Mod {{ i+1 }}:
                            <span v-html="$md.render(mod)" />
                        </div>
                        <div class="col-sm-6">
                            Additional info:
                            <span class="small" v-html="$md.render(evaluation.reasons[i])" />
                        </div>
                        <div class="col-sm-3" v-if="evaluation.oszs && evaluation.oszs.length">
                            .osz:
                            <span class="small" v-html="$md.render(evaluation.oszs[i])" />
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="evaluation.isApplication && positiveConsensus">
                <hr />
                <a href="#newBnInformation" data-toggle="collapse">
                    <h5>New BN Information <i class="fas fa-angle-down" /></h5>
                </a>

                <div id="newBnInformation" class="mx-4 show">
                    <h5>Next steps</h5>
                    <div class="mx-4">
                        <p><a :href="'/users?id=' + evaluation.user.id" target="_blank">This is you.</a> You're a <a href="https://osu.ppy.sh/groups/32" target="_blank">Probationary Beatmap Nominator</a>, which means you can only nominate maps that have been nominated by <a href="https://osu.ppy.sh/groups/28" target="_blank">Full Beatmap Nominators</a> and you cannot disqualify maps.</p>
                        <p>Your BN activity will be evaluated when you do 6 nominations or after 1 month (whichever comes first). During your evaluation, your activity/attitude/nomination quality will be evaluated by members of the NAT. If each of these areas are satisfactory, you will be promoted to Full Beatmap Nominator. If not, your probation period will be extended for another month or you'll be dismissed from the BN. In that second case, you will not be able to re-apply for another 60 days.</p>
                        <p>If you're a returning BN who recently resigned on good terms, you're already a Full Beatmap Nominator (yay!) and your next evaluation is ~3 months from now.</p>
                    </div>
                    <hr />
                    <div v-if="evaluation.natBuddy">
                        <h5>NAT mentor</h5>
                        <div class="mx-4">
                            <p><a :href="`https://osu.ppy.sh/users/${evaluation.natBuddy.osuId}`" target="_blank">{{ evaluation.natBuddy.username }}</a> is your new best friend. Feel free to contact them for questions or guidance related to being a Beatmap Nominator!</p>
                        </div>
                        <hr />
                    </div>
                    <h5>References</h5>
                    <div class="mx-4">
                        <p>Read the following pages:
                            <ul>
                                <li><a href="https://osu.ppy.sh/help/wiki/People/Beatmap_Nominators/Rules" target="_blank">BN Rules</a></li>
                                <li><a href="https://osu.ppy.sh/wiki/en/People/Beatmap_Nominators/Expectations" target="_blank">BN Expectations</a></li>
                                <li><a href="https://osu.ppy.sh/help/wiki/People/Beatmap_Nominators/General_Information" target="_blank">General Information for BNs</a></li>
                                <li><a href="https://osu.ppy.sh/help/wiki/People/The_Team/Beatmap_Nominators/Beatmap_Veto" target="_blank">Veto Information</a></li>
                            </ul>
                        </p>
                        <p>Follow the golden rule: <b>don't fuck up</b></p>
                    </div>
                </div>
            </div>

            <hr />

            <div v-if="evaluation.feedback">
                <h5>Feedback</h5>
                <div class="card card-body small mb-4 v-html-content" v-html="$md.render(evaluation.feedback)" />
            </div>

            <div v-if="natReviews.length">
                <h5>Evaluators</h5>
                <p>If you have questions about your evaluation, please contact any member of the {{ evaluation.mode == 'osu' ? 'NAT or BN' : 'NAT' }} below!</p>
                <div class="card card-body">
                    <ul>
                        <li v-for="review in natReviews" :key="review.id">
                            <user-link
                                :class="review.evaluator.groups.includes('nat') ? 'text-nat' : review.evaluator.groups.includes('bn') ? 'text-probation' : ''"
                                :osu-id="review.evaluator.osuId"
                                :username="review.evaluator.username"
                            />
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import evaluations from '../../mixins/evaluations.js';
import { BnEvaluationAddition } from '../../../shared/enums';
import UserLink from '../../components/UserLink.vue';

export default {
    name: 'EvaluationResults',
    components: {
        UserLink,
    },
    mixins: [ evaluations ],
    props: {
        evaluation: {
            type: Object,
            required: true,
        },
    },
    computed: {
        /** @returns {array} */
        natReviews () {
            return this.evaluation.reviews.filter(r => r.evaluator.isNat || r.evaluator.isTrialNat);
        },
        /** @returns {string} */
        consensus () {
            return this.evaluation.consensus;
        },
        /** @returns {string | undefined} */
        addition () {
            if (this.evaluation.addition !== BnEvaluationAddition.None) return this.evaluation.addition;
            else return null;
        },
    },
};
</script>
