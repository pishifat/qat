<template>
    <div class="row">
        <div :class="bnEvaluators.length ? 'col-sm-4' : 'col-sm-6'">
            <user-list
                :header="'Assigned NAT:'"
                :userList="natEvaluators"
            />
        </div>
        <div v-if="bnEvaluators.length && isLeader" class="col-sm-4">
            <user-list
                :header="'Assigned BN:'"
                :userList="bnEvaluators"
            />
        </div>
        <div :class="bnEvaluators.length ? 'col-sm-4' : 'col-sm-6'">
            <user-list
                :header="'Total evaluations: (' + evaluations.length + ')'"
                :userList="submittedEvaluators"
            />
        </div>
        <div v-if="isLeader && !bnEvaluators.length" class="col-sm-12">
            <button class="btn btn-sm btn-nat mb-2" @click="selectBnEvaluators($event)">
                {{ potentialBnEvaluators ? 'Re-select BN Evaluators' : 'Select BN Evaluators' }}
            </button> 
            <button v-if="potentialBnEvaluators" class="btn btn-sm btn-nat-red mb-2" @click="enableBnEvaluators($event)">
                Enable BN Evaluations
            </button>
            <p v-if="info" class="small errors">{{ info }}</p>
            <div v-if="potentialBnEvaluators" class="text-shadow">
                <p>Users:</p>
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
    name: 'evaluator-assignments',
    props: {
        bnEvaluators: Array,
        natEvaluators: Array,
        evaluations: Array,
        isLeader: Boolean,
        mode: String,
        osuId: Number,
        username: String,
        applicationId: String,
    },
    mixins: [ postData ],
    components: {
        UserList
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
    data() {
        return {
            potentialBnEvaluators: null,
            info: null,
            confirm: null,
        };
    },
    watch: {
        applicationId() {
            this.potentialBnEvaluators = null;
            this.info = null;
            this.confirm = null;
        },
    },
    methods: {
        async selectBnEvaluators(e) {
            const r = await this.executePost('/appeval/selectBnEvaluators', { mode: this.mode, id: this.applicationId }, e);
            if (r) {
                if (r.error) {
                    this.info = r.error;
                } else {
                    this.potentialBnEvaluators = r;
                }
            }
        },
        async enableBnEvaluators (e) {
            const a = await this.executePost('/appEval/enableBnEvaluators/' + this.applicationId, { bnEvaluators: this.potentialBnEvaluators }, e);
            if (a) {
                if (a.error) {
                    this.info = a.error;
                } else {
                    this.$emit('update-application', a);
                }
            }
        },
    },
};
</script>