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
                    <div class="card card-body">
                        <div v-for="(mod, i) in evaluation.mods" :key="mod" class="row">
                            <div class="col-sm-3">
                                <b>Beatmap {{ i+1 }}:</b>
                                <span v-html="$md.render(mod)" />
                            </div>
                            <div class="col-sm-9">
                                <b>Response to application prompts:</b>
                                <span class="small text-secondary" v-html="$md.render(evaluation.reasons[i])" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="evaluation.isApplication && positiveConsensus">
                <hr />
                <a href="#newBnInformation" data-toggle="collapse">
                    <h5>New BN Information <i class="fas fa-angle-down" /></h5>
                </a>

                <div id="newBnInformation" class="mx-4 show card card-body">
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

            <div v-if="evaluation.feedback && evaluation.feedback.length">
                <h5>{{ isNewEvaluationFormat ? 'Additional feedback' : 'Feedback' }}</h5>
                <div class="card card-body small mb-4 v-html-content" v-html="$md.render(evaluation.feedback)" />
            </div>

            <div v-if="isNewEvaluationFormat">
                <h5>Evaluations</h5>
                <div v-for="review in evaluation.reviews" :key="review.id">
                    <div class="row my-3">
                        <div class="col-sm-2">
                            <div class="text-center my-2" :class="voteColor(review.vote)">
                                <b>User ({{ review.evaluator && review.evaluator.groups.includes('nat') ? 'NAT' : 'BN' }})</b>
                            </div>
                        </div>

                        <div class="col-sm-10">
                            <div class="row">
                                <div class="col-sm-12">
                                    <div class="small ml-2 card card-body" v-html="$md.render(review.moddingComment)" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="natUserList.length" class="my-3">
                <h5>Evaluators</h5>
                <p>The users below evaluated your {{ evaluation.isApplication ? 'application' : 'current BN status' }}. <span v-if="isNewEvaluationFormat">If you disagree with the outcome and have questions, reply below!</span></p>
                <div class="card card-body">
                    <ul>
                        <li v-for="user in natUserList" :key="user.id">
                            <user-link
                                :class="user.groups.includes('nat') ? 'text-nat' : user.groups.includes('bn') ? 'text-probation' : ''"
                                :osu-id="user.osuId"
                                :username="user.username"
                            />
                        </li>
                    </ul>
                </div>
            </div>
            <evaluation-messages 
                :is-new-evaluation-format="isNewEvaluationFormat"
                :evaluation="evaluation"
                :replies="true"
            />
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import ToastMessages from '../../components/ToastMessages.vue';
import evaluations from '../../mixins/evaluations.js';
import { BnEvaluationAddition } from '../../../shared/enums';
import UserLink from '../../components/UserLink.vue';
import EvaluationMessages from './info/common/EvaluationMessages.vue';

export default {
    name: 'EvaluationResults',
    components: {
        ToastMessages,
        UserLink,
        EvaluationMessages,
    },
    mixins: [ evaluations ],
    props: {
        evaluation: {
            type: Object,
            required: true,
        },
        isNewEvaluationFormat: {
            type: Boolean,
        },
        natUserList: {
            type: Array,
            default() {
                return [];
            },
        },
    },
    data () {
        return {
            messageInput: '',
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
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
    methods: {
        voteColor(vote) {
            if (vote == 1) {
                return 'text-pass';
            } else if (vote == 2) {
                return 'text-neutral';
            } else if (vote == 3) {
                return 'text-fail';
            }
        },
    },
};
</script>
