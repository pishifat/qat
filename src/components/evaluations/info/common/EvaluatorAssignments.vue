<template>
    <div>
        <!-- assignments -->
        <div class="row">
            <div :class="selectedEvaluation.bnEvaluators && selectedEvaluation.bnEvaluators.length ? 'col-lg-4' : 'col-sm-6'">
                <user-list
                    :header="'Assigned NAT:'"
                    :user-list="selectedEvaluation.natEvaluators"
                    :is-application="selectedEvaluation.isApplication"
                    :nominator-assessment-mongo-id="selectedEvaluation.id"
                    :replace-nat="true"
                    :mode="selectedEvaluation.mode"
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
        </div>

        <!-- mock evaluations (catch only) -->
        <div>
            <div v-if="selectedEvaluation.mode == 'catch' && loggedInUser.isNat && (!selectedEvaluation.bnEvaluators || !selectedEvaluation.bnEvaluators.length) && selectedEvaluation.isApplication && !selectedEvaluation.discussion" class="col-sm-12">
                <hr>
                <div class="row">
                    <div class="col-sm-3">
                        <b>Total mock evaluators</b>
                        <input
                            v-model="totalUsers"
                            class="form-control"
                            type="number"
                            min="1"
                            max="10"
                            placeholder="#"
                        >
                    </div>
                    <div class="col-sm-4">
                        <b>Include specific user(s):</b>
                        <input
                            v-model="includeUsers"
                            class="form-control"
                            type="text"
                            placeholder="username1, username2, username3..."
                        >
                    </div>
                    <div class="col-sm-4">
                        <b>Exclude specific user(s):</b>
                        <input
                            v-model="excludeUsers"
                            class="form-control"
                            type="text"
                            placeholder="username1, username2, username3..."
                        >
                    </div>
                </div>

                <button class="btn btn-sm btn-primary my-2 btn-block" @click="selectBnEvaluators($event)">
                    {{ potentialBnEvaluators ? 'Re-select mock evaluators' : 'Select mock evaluators' }}
                </button>

                <div v-if="potentialBnEvaluators && potentialBnEvaluators.length">
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

                    <enable-bn-evaluators-chat-message
                        :users="potentialBnEvaluators"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import UserList from './UserList.vue';
import EnableBnEvaluatorsChatMessage from '../applications/EnableBnEvaluatorsChatMessage.vue';

export default {
    name: 'EvaluatorAssignments',
    components: {
        UserList,
        EnableBnEvaluatorsChatMessage,
    },
    data() {
        return {
            totalUsers: 3,
            includeUsers: null,
            excludeUsers: null,
            potentialBnEvaluators: null,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
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
                totalUsers: this.totalUsers,
            }, e);

            if (r && !r.error) {
                this.potentialBnEvaluators = r;
            }
        },
    },
};
</script>
