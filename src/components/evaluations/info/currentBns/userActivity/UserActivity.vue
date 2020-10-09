<template>
    <div>
        <p class="font-weight-bold form-inline">
            <span>BN activity:</span>
            <input
                v-if="editingDaysInput"
                v-model="daysInput"
                class="form-control form-control-sm w-days"
                type="number"
                min="1"
                max="999"
                @keyup.enter="editingDaysInput = false; findRelevantActivity();"
            >
            <span v-else class="mx-1">{{ daysInput }}</span>
            days
            <a href="#" @click.prevent="editingDaysInput ? findRelevantActivity() : ''; editingDaysInput = !editingDaysInput;">
                <i class="fas fa-edit ml-1" />
            </a>
        </p>

        <div class="container mb-3">
            <events-list
                :events="nominations"
                :events-id="'uniqueNominations'"
                :header="'Unique nominations'"
            />
            <nomination-resets
                :events="nominationsDisqualified"
                :events-id="'nominationsDisqualified'"
                :header="'Nominations disqualified'"
            />
            <nomination-resets
                :events="nominationsPopped"
                :events-id="'nominationsPopped'"
                :header="'Nominations popped'"
            />
            <nomination-resets
                :events="disqualifications"
                :events-id="'disqualificationsByUser'"
                :header="'Disqualifications done by user'"
            />
            <nomination-resets
                :events="pops"
                :events-id="'popsByUser'"
                :header="'Pops done by user'"
            />
            <events-list
                :events="qualityAssuranceChecks"
                :events-id="'qualityAssuranceChecks'"
                :header="'Quality Assurance Checks'"
            />
            <nomination-resets
                :events="disqualifiedQualityAssuranceChecks"
                :events-id="'disqualifiedQualityAssuranceChecks'"
                :header="'Disqualified Quality Assurance Checks'"
            />

            <template v-if="loggedInUser.isNat">
                <evaluation-list
                    v-if="assignedBnApplications && assignedBnApplications.length"
                    :events="assignedBnApplications"
                    :events-id="'assignedBnApplications'"
                    :header="'Application Evaluations (BN)'"
                    :is-application="true"
                    :mongo-id="mongoId"
                />
                <evaluation-list
                    v-if="natApplications && natApplications.length"
                    :events="natApplications"
                    :events-id="'natApplications'"
                    :header="'Application Evaluations (NAT)'"
                    :is-application="true"
                    :mongo-id="mongoId"
                />
                <evaluation-list
                    v-if="natBnEvaluations && natBnEvaluations.length"
                    :events="natBnEvaluations"
                    :events-id="'natBnEvaluations'"
                    :header="'Current BN Evaluations (NAT)'"
                    :is-application="false"
                    :mongo-id="mongoId"
                />
            </template>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import postData from '../../../../../mixins/postData.js';
import EventsList from './EventsList.vue';
import NominationResets from './NominationResets.vue';
import EvaluationList from './EvaluationList.vue';

export default {
    name: 'UserActivity',
    components: {
        EventsList,
        NominationResets,
        EvaluationList,
    },
    mixins: [ postData ],
    props: {
        modes: {
            type: [Array, String],
            required: true,
        },
        deadline: {
            type: String,
            required: true,
        },
        osuId: {
            type: Number,
            required: true,
        },
        mongoId: {
            type: String,
            required: true,
        },
    },
    data () {
        return {
            daysInput: 90,
            editingDaysInput: false,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapState('activity', [
            'nominations',
            'nominationsDisqualified',
            'nominationsPopped',
            'disqualifications',
            'pops',
            'qualityAssuranceChecks',
            'disqualifiedQualityAssuranceChecks',
            'assignedBnApplications',
            'natApplications',
            'natBnEvaluations',
        ]),
    },
    watch: {
        mongoId() {
            this.findRelevantActivity();
            this.daysInput = 90;
        },
    },
    created () {
        this.findRelevantActivity();
        this.daysInput = 90;
    },
    methods: {
        async findRelevantActivity() {
            this.$store.commit('activity/setIsLoading', true);

            let days = parseInt(this.daysInput);
            if (isNaN(days)) days = 90;
            else if (days > 1000) days = 999;
            else if (days < 2) days = 2;
            this.daysInput = days;

            if (this.loggedInUser.isNat) {
                const res = await this.executeGet(`/bnEval/activity?osuId=${this.osuId}&modes=${this.modes}&deadline=${new Date(this.deadline).getTime()}&mongoId=${this.mongoId}&days=${days}`);

                if (res) {
                    this.$store.commit('activity/setNominations', res.uniqueNominations);
                    this.$store.commit('activity/setNominationsDisqualified', res.nominationsDisqualified);
                    this.$store.commit('activity/setNominationsPopped', res.nominationsPopped);
                    this.$store.commit('activity/setDisqualifications', res.disqualifications);
                    this.$store.commit('activity/setPops', res.pops);
                    this.$store.commit('activity/setQualityAssuranceChecks', res.qualityAssuranceChecks);
                    this.$store.commit('activity/setDisqualifiedQualityAssuranceChecks', res.disqualifiedQualityAssuranceChecks);

                    this.$store.commit('activity/setBnApplications', res.assignedBnApplications);
                    this.$store.commit('activity/setNatApplications', res.appEvaluations);
                    this.$store.commit('activity/setNatBnEvaluations', res.bnEvaluations);
                    this.$store.commit('activity/setIsLoading', false);
                }
            } else {
                const res = await this.executeGet(`/users/activity?osuId=${this.osuId}&modes=${this.modes}&deadline=${new Date(this.deadline).getTime()}&mongoId=${this.mongoId}&days=${days}`);

                if (res) {
                    this.$store.commit('activity/setNominations', res.uniqueNominations);
                    this.$store.commit('activity/setNominationsDisqualified', res.nominationsDisqualified);
                    this.$store.commit('activity/setNominationsPopped', res.nominationsPopped);
                    this.$store.commit('activity/setDisqualifications', res.disqualifications);
                    this.$store.commit('activity/setPops', res.pops);
                    this.$store.commit('activity/setQualityAssuranceChecks', res.qualityAssuranceChecks);
                    this.$store.commit('activity/setDisqualifiedQualityAssuranceChecks', res.disqualifiedQualityAssuranceChecks);
                    this.$store.commit('activity/setIsLoading', false);
                }
            }
        },
    },
};
</script>

<style scoped>

.w-days {
    max-width: 50px;
}

</style>