<template>
    <div>
        <!-- assignments -->
        <div class="row">
            <div :class="columnClasses.natEvaluators">
                <user-list
                    :header="'Assigned NAT:'"
                    :user-list="selectedEvaluation.natEvaluators"
                    :is-application="selectedEvaluation.isApplication"
                    :nominator-assessment-mongo-id="selectedEvaluation.id"
                    :replace-nat="true"
                    :mode="selectedEvaluation.mode"
                />
            </div>
            <div v-if="selectedEvaluation.bnEvaluators && selectedEvaluation.bnEvaluators.length" :class="columnClasses.bnEvaluators">
                <user-list
                    :header="'Assigned BN:'"
                    :user-list="selectedEvaluation.bnEvaluators"
                    :is-application="selectedEvaluation.isApplication"
                    :nominator-assessment-mongo-id="selectedEvaluation.id"
                    :replace-trial-nat="true"
                    :mode="selectedEvaluation.mode"
                />
            </div>
            <div :class="columnClasses.mockEvaluators">
                <div v-if="selectedEvaluation.mockEvaluators && selectedEvaluation.mockEvaluators.length">
                    <user-list
                        :header="'Mock evaluators:'"
                        :user-list="selectedEvaluation.mockEvaluators"
                        :is-application="selectedEvaluation.isApplication"
                        :nominator-assessment-mongo-id="selectedEvaluation.id"
                        :mode="selectedEvaluation.mode"
                        :disable-replace="true"
                    />
                </div>
                <div v-else-if="!selectedEvaluation.user.isNat">
                    <p><b>Mock evaluators:</b></p>
                    <button class="btn btn-sm btn-secondary btn-block" @click="enableMockEvaluators">
                        {{ potentialMockEvaluators ? 'Re-select mock evaluators' : 'Enable mock evaluators' }}
                    </button>
                    
                    <div v-if="potentialMockEvaluators && potentialMockEvaluators.length">
                        <p class="my-3">
                            Users:
                        </p>
                        <div id="mockUsernames" class="mb-4">
                            <ul class="small">
                                <li v-for="user in potentialMockEvaluators" :key="user.id">
                                    {{ user.username }}
                                </li>
                            </ul>
                        </div>

                        <enable-mock-evaluators-chat-message
                            :users="potentialMockEvaluators"
                            :eval-type="selectedEvaluation.kind"
                        />
                    </div>
                </div>
            </div>
            <div :class="columnClasses.totalEvaluations">
                <user-list
                    :header="'Total evaluations: (' + (selectedEvaluation.reviews || []).length + ')'"
                    :user-list="submittedEvaluators"
                />
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import UserList from './UserList.vue';
import EnableMockEvaluatorsChatMessage from '../applications/EnableMockEvaluatorsChatMessage.vue';

export default {
    name: 'EvaluatorAssignments',
    components: {
        UserList,
        EnableMockEvaluatorsChatMessage,
    },
    data() {
        return {
            totalUsers: 3,
            includeUsers: null,
            excludeUsers: null,
            potentialBnEvaluators: null,
            potentialMockEvaluators: null,
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
            const reviews = this.selectedEvaluation.reviews || [];
            const evaluators = reviews.map(review => review.evaluator);
            const mockReviews = this.selectedEvaluation.mockReviews || [];
            
            // Add mock evaluators to the list with a special flag for styling (only those who submitted reviews)
            const mockEvaluatorsWithFlag = mockReviews.map(review => ({
                ...review.evaluator,
                isMockEvaluator: true
            }));
            
            return [...evaluators, ...mockEvaluatorsWithFlag];
        },
        hasMockEvaluators() {
            return this.selectedEvaluation.mockEvaluators && this.selectedEvaluation.mockEvaluators.length > 0;
        },
        columnClasses() {
            const hasBnEvaluators = this.selectedEvaluation.bnEvaluators && this.selectedEvaluation.bnEvaluators.length;
            const columnCount = hasBnEvaluators ? 4 : 3; // NAT, BN (optional), Mock, Total
            const colClass = columnCount === 4 ? 'col-lg-3' : 'col-lg-4';
            
            return {
                natEvaluators: colClass,
                bnEvaluators: colClass,
                mockEvaluators: colClass,
                totalEvaluations: colClass
            };
        },
    },
    watch: {
        selectedEvaluation() {
            this.potentialBnEvaluators = null;
            this.potentialMockEvaluators = null;
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
        async enableMockEvaluators(e) {
            const route = this.selectedEvaluation.isApplication ? 'appeval' : 'bneval';
            const r = await this.$http.executePost(`/${route}/selectMockEvaluators/${this.selectedEvaluation.id}`, {}, e);

            if (r && !r.error) {
                this.potentialMockEvaluators = r;
                this.$store.dispatch('updateToastMessages', {
                    message: `Generated ${r.length} potential mock evaluators`,
                    type: 'success',
                });
            }
        },
    },
};
</script>
