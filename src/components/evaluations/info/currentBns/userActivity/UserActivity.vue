<template>
    <div>
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
                v-if="natEvalRounds && natEvalRounds.length"
                :events="natEvalRounds"
                :events-id="'natEvalRounds'"
                :header="'Current BN Evaluations (NAT)'"
                :is-application="false"
                :mongo-id="mongoId"
            />
        </template>
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
            'natEvalRounds',
        ]),
    },
    watch: {
        mongoId() {
            this.findRelevantActivity();
        },
    },
    created () {
        this.findRelevantActivity();
    },
    methods: {
        async findRelevantActivity() {
            this.$store.commit('activity/setIsLoading', true);

            if (this.loggedInUser.isNat) {
                const res = await this.executeGet(`/bnEval/activity?osuId=${this.osuId}&modes=${this.modes}&deadline=${parseInt(new Date(this.deadline).getTime())}&mongoId=${this.mongoId}`);

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
                    this.$store.commit('activity/setNatEvalRounds', res.bnEvaluations);
                    this.$store.commit('activity/setIsLoading', false);
                }
            } else {
                const res = await this.executeGet(`/users/activity?osuId=${this.osuId}&modes=${this.modes}&deadline=${parseInt(new Date(this.deadline).getTime())}&mongoId=${this.mongoId}`);

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