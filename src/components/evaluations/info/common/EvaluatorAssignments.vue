<template>
    <div class="row">
        <div :class="selectedEvaluation.bnEvaluators && selectedEvaluation.bnEvaluators.length ? 'col-lg-4' : 'col-sm-6'">
            <user-list
                :header="'Assigned NAT:'"
                :user-list="selectedEvaluation.natEvaluators"
                :is-application="selectedEvaluation.isApplication"
                :nominator-assessment-mongo-id="selectedEvaluation.id"
                :replace-nat="true"
            />
        </div>
        <div v-if="selectedEvaluation.bnEvaluators && selectedEvaluation.bnEvaluators.length" class="col-lg-4">
            <user-list
                :header="'Assigned BN:'"
                :user-list="selectedEvaluation.bnEvaluators"
                :is-application="selectedEvaluation.isApplication"
                :nominator-assessment-mongo-id="selectedEvaluation.id"
            />
        </div>
        <div :class="selectedEvaluation.bnEvaluators && selectedEvaluation.bnEvaluators.length ? 'col-lg-4' : 'col-sm-6'">
            <user-list
                :header="'Total evaluations: (' + selectedEvaluation.reviews.length + ')'"
                :user-list="submittedEvaluators"
            />
        </div>

        <!-- hide BN evaluator selection while trial NAT exists

        <div v-if="(!selectedEvaluation.bnEvaluators || !selectedEvaluation.bnEvaluators.length) && selectedEvaluation.isApplication && !selectedEvaluation.discussion" class="col-sm-12">
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

            <button class="btn btn-sm btn-primary my-2 btn-block" @click="selectBnEvaluators($event)">
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
                    <div>Hello!</div>
                    <br>
                    <div>You have been selected to help evaluate the [i]{{ selectedEvaluation.mode == 'osu' ? 'osu!' : 'osu!' + selectedEvaluation.mode }}[/i] mode BN application for [url=https://osu.ppy.sh/users/{{ selectedEvaluation.user.osuId }}]{{ selectedEvaluation.user.username }}[/url].</div>
                    <br>
                    <div>Please post your thoughts on the applicant's behavior and modding quality (based on submitted mods and anything else you may know) on the [url=http://bn.mappersguild.com/appeval]BN/NAT website[/url].</div>
                    <br>
                    <div>If the user's application is not visible, that means it has received enough evaluations for a consensus to be reached -- this usually [b]3-5 days[/b] after you receive this message. Your decision will be anonymous to everyone but members of the NAT.</div>
                    <br>
                    <div>Keep in mind that this is a 100% optional activity. If you do not want to participate in BN application evaluations, opt-out from your card on the [url=http://bn.mappersguild.com/users]users page[/url]. Failing to finish on time has no penalty.</div>
                    <br>
                    <div>Thank you for your hard work!</div>
                </div>
            </div>
        </div>

        -->
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import UserList from './UserList.vue';

export default {
    name: 'EvaluatorAssignments',
    components: {
        UserList,
    },
    data() {
        return {
            includeUsers: null,
            excludeUsers: null,
            potentialBnEvaluators: null,
        };
    },
    computed: {
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
        /** @returns {Object[]} */
        submittedEvaluators() {
            return this.selectedEvaluation.reviews.map(review => review.evaluator);
        },
    },
    watch: {
        selectedEvaluation() {
            this.potentialBnEvaluators = null;
        },
    },
    methods: {
        async selectBnEvaluators(e) {
            const r = await this.$http.executePost('/appeval/selectBnEvaluators', {
                mode: this.selectedEvaluation.mode,
                id: this.selectedEvaluation.id,
                includeUsers: this.includeUsers,
                excludeUsers: this.excludeUsers,
            }, e);

            if (r && !r.error) {
                this.potentialBnEvaluators = r;
            }
        },
        async enableBnEvaluators (e) {
            const result = confirm(
                `Are you sure? Forum PMs must be sent before enabling.`
            );

            if (result) {
                const data = await this.$http.executePost('/appEval/enableBnEvaluators/' + this.selectedEvaluation.id, { bnEvaluators: this.potentialBnEvaluators }, e);

                if (this.$http.isValid(data)) {
                    this.$store.dispatch('appEval/updateAssessment', data.application);
                }
            }
        },
    },
};
</script>
