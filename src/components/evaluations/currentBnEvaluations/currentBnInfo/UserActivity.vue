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
        <evaluation-list
            v-if="isNat && assignedApplications && assignedApplications.length"
            :events="assignedApplications"
            :events-id="'assignedApplications'"
            :header="'Application Evaluations (BN)'"
            :is-application="true"
        />
        <evaluation-list
            v-if="isNat && natApplications && natApplications.length"
            :events="natApplications"
            :events-id="'natApplications'"
            :header="'Application Evaluations (NAT)'"
            :is-application="true"
        />
        <evaluation-list
            v-if="isNat && natEvalRounds && natEvalRounds.length"
            :events="natEvalRounds"
            :events-id="'natEvalRounds'"
            :header="'Current BN Evaluations (NAT)'"
            :is-application="false"
        />
        <p v-if="isNat" class="small">
            bnscore: {{ bnScore }}
        </p>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import postData from '../../../../mixins/postData.js';
import filterLinks from '../../../../mixins/filterLinks.js';
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
    mixins: [ postData, filterLinks ],
    props: {
        modes: {
            type: Array,
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
        isNat: Boolean,
    },
    computed: {
        ...mapState({
            nominations: (state) => state.userActivity.nominations,
            nominationsDisqualified: (state) => state.userActivity.nominationsDisqualified,
            nominationsPopped: (state) => state.userActivity.nominationsPopped,
            disqualifications: (state) => state.userActivity.disqualifications,
            pops: (state) => state.userActivity.pops,
            qualityAssuranceChecks: (state) => state.userActivity.qualityAssuranceChecks,
            disqualifiedQualityAssuranceChecks: (state) => state.userActivity.disqualifiedQualityAssuranceChecks,
            assignedApplications: (state) => state.userActivity.assignedApplications,
            natApplications: (state) => state.userActivity.natApplications,
            natEvalRounds: (state) => state.userActivity.natEvalRounds,
        }),
    },
    computed: {
        bnScore() {
            if (this.loading) {
                return '...';
            } else {
                let score = 0;
                score += this.nominations.length;
                //score += (this.qualityAssuranceChecks.length/4);

                this.nominationsDisqualified.forEach(dq => {
                    let tempScore = 0;
                    if (dq.obviousness) tempScore += dq.obviousness;
                    if (dq.severity) tempScore += dq.severity;
                    score -= Math.floor(tempScore*1.5);
                });

                /*this.disqualifiedQualityAssuranceChecks.forEach(dq => {
                    let tempScore = -2;
                    if (dq.obviousness) tempScore += dq.obviousness;
                    if (dq.severity) tempScore += dq.severity;
                    if (tempScore > 0) score -= tempScore;
                });*/

                return score;
            }
        },
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
            this.$store.commit('setIsLoading', true);

            const res = await this.executeGet('/bnEval/userActivity/' + this.osuId + '/' + this.modes + '/' + new Date(this.deadline).getTime() + '/' + this.mongoId);

            if (res) {
                this.$store.commit('setNominations', res.noms);
                this.$store.commit('setNominationsDisqualified', res.nominationsDisqualified);
                this.$store.commit('setNominationsPopped', res.nominationsPopped);
                this.$store.commit('setDisqualifications', res.disqualifications);
                this.$store.commit('setPops', res.pops);
                this.$store.commit('setQualityAssuranceChecks', res.qualityAssuranceChecks);
                this.$store.commit('setDisqualifiedQualityAssuranceChecks', res.disqualifiedQualityAssuranceChecks);
                this.$store.commit('setAssignedApplications', res.assignedApplications);
                this.$store.commit('setNatApplications', res.natApplications);
                this.$store.commit('setNatEvalRounds', res.natEvalRounds);
                this.$store.commit('setIsLoading', false);
            }
        },
    },
};
</script>