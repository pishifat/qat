<template>
    <div class="row">
        <div :class="bnEvaluators.length ? 'col-lg-4' : 'col-sm-6'">
            <user-list
                :header="'Assigned NAT:'"
                :user-list="natEvaluators"
                :is-application="isApplication"
                :nominator-assessment-mongo-id="nominatorAssessmentMongoId"
                :replace-nat="true"
            />
        </div>
        <div v-if="bnEvaluators.length" class="col-lg-4">
            <user-list
                :header="'Assigned BN:'"
                :user-list="bnEvaluators"
                :is-application="isApplication"
                :nominator-assessment-mongo-id="nominatorAssessmentMongoId"
            />
        </div>
        <div :class="bnEvaluators.length ? 'col-lg-4' : 'col-sm-6'">
            <user-list
                :header="'Total evaluations: (' + evaluations.length + ')'"
                :user-list="submittedEvaluators"
            />
        </div>

        <div v-if="!bnEvaluators.length && isApplication" class="col-sm-12">
            <hr>

            <div class="row">
                <div class="col-sm-6">
                    <b>Include specific user(s):</b>
                    <input
                        v-model="includeUsers"
                        class="ml-2 form-control"
                        type="text"
                        placeholder="username1, username2, username3..."
                    >
                </div>
                <div class="col-sm-6">
                    <b>Exclude specific user(s):</b>
                    <input
                        v-model="excludeUsers"
                        class="ml-2 form-control"
                        type="text"
                        placeholder="username1, username2, username3..."
                    >
                </div>
            </div>

            <button class="btn btn-sm btn-nat my-2 btn-block" @click="selectBnEvaluators($event)">
                {{ potentialBnEvaluators ? 'Re-select BN Evaluators' : 'Select BN Evaluators' }}
            </button>

            <button v-if="potentialBnEvaluators && potentialBnEvaluators.length" class="btn btn-sm btn-success my-2 btn-block" @click="enableBnEvaluators($event)">
                Enable BN evaluations
            </button>

            <div v-if="potentialBnEvaluators">
                <p class="my-3">
                    Users:
                </p>
                <div id="usernames" class="mb-4">
                    <ul class="small">
                        <li v-for="user in potentialBnEvaluators" :key="user.id">
                            {{ user.username }}
                        </li>
                    </ul>
                </div>

                <p>
                    <b>Forum message:</b>
                </p>
                <div id="forumMessage" class="card card-body small">
                    <span>Hello!</span><br><br>
                    <span>You have been selected to help evaluate the [i]{{ mode == 'osu' ? 'osu!' : 'osu!' + mode }}[/i] mode BN application for [url=https://osu.ppy.sh/users/{{ osuId }}]{{ username }}[/url].</span><br><br>
                    <span>Please post your thoughts on the applicant's behavior and modding quality (based on submitted mods and anything else you may know) on the [url=http://bn.mappersguild.com/appeval]BN/NAT website[/url].</span><br><br>
                    <span>If the user's application is not visible, that means it has received enough evaluations for a consensus to be reached -- this usually [b]3-5 days[/b] after you receive this message. Your decision will be anonymous to everyone but members of the NAT.</span><br><br>
                    <span>Keep in mind that this is a 100% optional activity. If you do not want to participate in BN application evaluations, opt-out from your card on the [url=http://bn.mappersguild.com/users]users page[/url]. Failing to finish on time has no penalty.</span><br><br>
                    <span>Thank you for your hard work!</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../../../mixins/postData.js';
import UserList from './UserList.vue';

export default {
    name: 'EvaluatorAssignments',
    components: {
        UserList,
    },
    mixins: [ postData ],
    props: {
        bnEvaluators: {
            type: Array,
            default() {
                return [];
            },
        },
        natEvaluators: {
            type: Array,
            default() {
                return [];
            },
        },
        evaluations: {
            type: Array,
            default() {
                return [];
            },
        },
        mode: {
            type: String,
            default: '',
        },
        osuId: {
            type: Number,
            default: 0,
        },
        username: {
            type: String,
            default: '',
        },
        nominatorAssessmentMongoId: {
            type: String,
            required: true,
        },
        isApplication: Boolean,
    },
    data() {
        return {
            includeUsers: null,
            excludeUsers: null,
            potentialBnEvaluators: null,
        };
    },
    computed: {
        submittedEvaluators() {
            let evaluators = new Array;
            this.evaluations.forEach(evaluation => {
                evaluators.push(evaluation.evaluator);
            });

            return evaluators;
        },
    },
    watch: {
        nominatorAssessmentMongoId() {
            this.potentialBnEvaluators = null;
        },
    },
    methods: {
        async selectBnEvaluators(e) {
            const r = await this.executePost('/appeval/selectBnEvaluators', { mode: this.mode, id: this.nominatorAssessmentMongoId, includeUsers: this.includeUsers, excludeUsers: this.excludeUsers }, e);

            if (r && !r.error) {
                this.potentialBnEvaluators = r;
            }
        },
        async enableBnEvaluators (e) {
            const result = confirm(
                `Are you sure? Forum PMs must be sent before enabling.`
            );

            if (result) {
                const a = await this.executePost('/appEval/enableBnEvaluators/' + this.nominatorAssessmentMongoId, { bnEvaluators: this.potentialBnEvaluators }, e);

                if (a && !a.error) {
                    this.$store.dispatch('updateApplication', a);
                    this.$store.dispatch('updateToastMessages', {
                        message: `Enabled BN evaluators`,
                        type: 'success',
                    });
                }
            }
        },
    },
};
</script>