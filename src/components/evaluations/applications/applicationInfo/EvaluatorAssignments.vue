<template>
    <div class="row">
        <div :class="bnEvaluators.length ? 'col-sm-4' : 'col-sm-6'">
            <user-list
                :header="'Assigned NAT:'"
                :user-list="natEvaluators"
                :is-application="isApplication"
                :nominator-assessment-mongo-id="nominatorAssessmentMongoId"
                :is-nat="true"
                @update-nominator-assessment="$emit('update-nominator-assessment', $event);"
            />
        </div>
        <div v-if="bnEvaluators.length" class="col-sm-4">
            <user-list
                :header="'Assigned BN:'"
                :user-list="bnEvaluators"
                :is-application="isApplication"
                :nominator-assessment-mongo-id="nominatorAssessmentMongoId"
                @update-nominator-assessment="$emit('update-nominator-assessment', $event);"
            />
        </div>
        <div :class="bnEvaluators.length ? 'col-sm-4' : 'col-sm-6'">
            <user-list
                :header="'Total evaluations: (' + evaluations.length + ')'"
                :user-list="submittedEvaluators"
            />
        </div>
        <div v-if="!bnEvaluators.length" class="col-sm-12">
            <button class="btn btn-sm btn-nat mb-2 w-100" @click="selectBnEvaluators($event)">
                {{ potentialBnEvaluators ? 'Re-select BN Evaluators' : 'Select BN Evaluators' }}
            </button>
            <button v-if="potentialBnEvaluators" class="btn btn-sm btn-nat-red mb-2 w-100" @click="enableBnEvaluators($event)">
                Enable BN Evaluations
            </button>
            <div class="row">
                <div class="col-sm-6">
                    <span class="text-shadow">Include specific user(s):</span>
                    <input
                        v-model="includeUsers"
                        class="ml-2 w-100 small"
                        type="text"
                        placeholder="username1, username2, username3..."
                    >
                </div>
                <div class="col-sm-6">
                    <span class="text-shadow">Exclude specific user(s):</span>
                    <input
                        v-model="excludeUsers"
                        class="ml-2 w-100 small"
                        type="text"
                        placeholder="username1, username2, username3..."
                    >
                </div>
            </div>
            <p v-if="info" class="small errors">
                {{ info }}
            </p>
            <div v-if="potentialBnEvaluators" class="text-shadow">
                <p class="my-3">
                    Users:
                </p>
                <div id="usernames" class="copy-paste mb-4" style="width: 25%">
                    <ul style="list-style-type: none; padding: 0">
                        <li v-for="user in potentialBnEvaluators" :key="user.id">
                            <samp class="small">{{ user.username }}</samp>
                        </li>
                    </ul>
                </div>
                <p>Forum message:</p>
                <div id="forumMessage" class="copy-paste">
                    <samp class="small">Hello!</samp><br><br>
                    <samp class="small">You have been selected to help evaluate the [i]{{ mode == 'osu' ? 'osu!' : 'osu!' + mode }}[/i] mode BN application for [url=https://osu.ppy.sh/users/{{ osuId }}]{{ username }}[/url].</samp><br><br>
                    <samp class="small">Please post your thoughts on the applicant's behavior and modding quality (based on submitted mods and anything else you may know) on the [url=http://bn.mappersguild.com/appeval]BN/NAT website[/url].</samp><br><br>
                    <samp class="small">If the user's application is not visible, that means it has received enough evaluations for a consensus to be reached -- this usually [b]3-5 days[/b] after you receive this message. Your decision will be anonymous to everyone but members of the NAT.</samp><br><br>
                    <samp class="small">Keep in mind that this is a 100% optional activity. If you do not want to participate in BN application evaluations, opt-out from your card on the [url=http://bn.mappersguild.com/users]users page[/url]. Failing to finish on time has no penalty.</samp><br><br>
                    <samp class="small">Thank you for your hard work!</samp><br><br>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../../../../mixins/postData.js';
import UserList from '../../info/UserList.vue';

export default {
    name: 'EvaluatorAssignments',
    components: {
        UserList,
    },
    mixins: [ postData ],
    props: {
        bnEvaluators: Array,
        natEvaluators: Array,
        evaluations: Array,
        mode: String,
        osuId: Number,
        username: String,
        nominatorAssessmentMongoId: String,
        isApplication: Boolean,
    },
    data() {
        return {
            includeUsers: null,
            excludeUsers: null,
            potentialBnEvaluators: null,
            info: null,
            confirm: null,
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
            this.info = null;
            this.confirm = null;
        },
    },
    methods: {
        async selectBnEvaluators(e) {
            const r = await this.executePost('/appeval/selectBnEvaluators', { mode: this.mode, id: this.nominatorAssessmentMongoId, includeUsers: this.includeUsers, excludeUsers: this.excludeUsers }, e);

            if (r) {
                if (r.error) {
                    this.info = r.error;
                } else {
                    this.potentialBnEvaluators = r;
                }
            }
        },
        async enableBnEvaluators (e) {
            const result = confirm(
                `Are you sure? Forum PMs must be sent before enabling.`
            );

            if (result) {
                const a = await this.executePost('/appEval/enableBnEvaluators/' + this.nominatorAssessmentMongoId, { bnEvaluators: this.potentialBnEvaluators }, e);

                if (a) {
                    if (a.error) {
                        this.info = a.error;
                    } else {
                        this.$emit('update-nominator-assessment', a);
                    }
                }
            }
        },
    },
};
</script>