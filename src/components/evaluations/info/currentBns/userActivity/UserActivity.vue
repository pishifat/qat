<template>
    <div :key="mongoId">
        <activity-standing v-if="showActivityStanding" />

        <p v-if="modes.length > 1" class="font-weight-bold form-inline">
            Game mode:
                <mode-select 
                class="ml-2"
                v-model="selectedMode"
                :max-selection="1"
                :modes-filter="modes"
            />
        </p>

        <p class="font-weight-bold form-inline">
            <span>User activity</span>
            <input
                v-if="editingDaysInput"
                v-model="daysInput"
                class="form-control form-control-sm w-days"
                type="number"
                min="1"
                max="9999"
                @keyup.enter="search"
            />
            <span v-else class="mx-1">({{ daysInput }}</span>
            days)
            <a href="#" @click.prevent="search">
                <i class="fas fa-edit ml-1" />
            </a>
        </p>

        <div class="container mb-3">
            <div>Nominations</div>
            <events-list
                :events="filterEvents(nominations, selectedMode)"
                :events-id="'uniqueNominations'"
                :header="'Unique nominations'"
                :osu-id="osuId"
                :is-evaluation="isEvaluation"
            />
            <nomination-resets
                :events="filterEvents(nominationsDisqualified, selectedMode)"
                :events-id="'nominationsDisqualified'"
                :header="'Nominations disqualified'"
            />
            <nomination-resets
                :events="filterEvents(nominationsPopped, selectedMode)"
                :events-id="'nominationsPopped'"
                :header="'Nominations popped'"
            />
            <nomination-resets
                :events="filterEvents(disqualifications, selectedMode)"
                :events-id="'disqualificationsByUser'"
                :header="'Disqualifications done by user'"
            />
            <nomination-resets
                :events="filterEvents(pops, selectedMode)"
                :events-id="'popsByUser'"
                :header="'Pops done by user'"
            />

            <template v-if="loggedInUser && loggedInUser.isNat">
                <div class="mt-2">Evaluations</div>
                <evaluation-list
                    v-if="!isNat && assignedBnApplications && assignedBnApplications.length"
                    :events="assignedBnApplications"
                    :events-id="'assignedBnApplications'"
                    :header="'Application Evaluations (BN)'"
                    :is-application="true"
                    :mongo-id="mongoId"
                />
                <evaluation-list
                    :events="natApplications"
                    :events-id="'natApplications'"
                    :header="'Application Evaluations (NAT)'"
                    :is-application="true"
                    :mongo-id="mongoId"
                />
                <evaluation-list
                    :events="natBnEvaluations"
                    :events-id="'natBnEvaluations'"
                    :header="'Current BN Evaluations (NAT)'"
                    :is-application="false"
                    :mongo-id="mongoId"
                />
                <evaluation-list
                    v-if="!isNat"
                    :events="mockApplications"
                    :events-id="'mockApplications'"
                    :header="'Mock Application Evaluations'"
                    :is-application="true"
                    :is-mock="true"
                    :mongo-id="mongoId"
                />
                <evaluation-list
                    v-if="!isNat"
                    :events="mockBnEvaluations"
                    :events-id="'mockBnEvaluations'"
                    :header="'Mock Current BN Evaluations'"
                    :is-application="false"
                    :is-mock="true"
                    :mongo-id="mongoId"
                />
            </template>
                
            <template v-else-if="loggedInUser && !loggedInUser.isNat && isNat">
                <div class="mt-2">Evaluations</div>
                <public-evaluation-list
                    v-if="isNat"
                    :events="natApplications"
                    :events-id="'natApplications'"
                    :header="'Application Evaluations'"
                    :is-application="true"
                    :mongo-id="mongoId"
                />
                <public-evaluation-list
                    v-if="isNat"
                    :events="natBnEvaluations"
                    :events-id="'natBnEvaluations'"
                    :header="'Current BN Evaluations'"
                    :is-application="false"
                    :mongo-id="mongoId"
                />
            </template>

            <template v-if="loggedInUser && loggedInUser.hasFullReadAccess && showArchive">
                <div class="mt-2">Archives</div>
                <previous-evaluations
                    v-if="loggedInUser && loggedInUser.isNat"
                    :header="'Previous Evaluations'"
                    :event-id="'previousEvaluations'"
                    :mongo-id="mongoId"
                />
                <reports
                    :header="'Reports'"
                    :event-id="'reports'"
                    :mongo-id="mongoId"
                />
            </template>
        </div>
        <hr />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import EventsList from './EventsList.vue';
import NominationResets from './NominationResets.vue';
import EvaluationList from './EvaluationList.vue';
import PublicEvaluationList from './PublicEvaluationList.vue';
import PreviousEvaluations from './PreviousEvaluations.vue';
import Reports from './Reports.vue';
import ModeSelect from '../../../../ModeSelect.vue';
import ActivityStanding from './ActivityStanding.vue';

export default {
    name: 'UserActivity',
    components: {
        EventsList,
        NominationResets,
        EvaluationList,
        PublicEvaluationList,
        PreviousEvaluations,
        Reports,
        ModeSelect,
        ActivityStanding,
    },
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
        unique: {
            type: String,
            required: true,
        },
        overwriteDays: {
            type: Number,
            required: true,
        },
        isEvaluation: {
            type: Boolean,
            default: false,
        },
        showArchive: {
            type: Boolean,
            default: false,
        },
        isNat: {
            type: Boolean,
            default: false,
        },
        user: {
            type: Object,
            required: true,
        },
        showActivityStanding: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            daysInput: this.overwriteDays,
            editingDaysInput: false,
            selectedMode: '',
        };
    },
    computed: {
        ...mapState(['loggedInUser']),
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
            'mockApplications',
            'mockBnEvaluations',
            'isLoading',
        ]),
    },
    watch: {
        unique() {
            this.daysInput = this.overwriteDays;
            this.selectedMode = '';
            this.findRelevantActivity();
        },
    },
    created() {
        this.daysInput = this.overwriteDays;
        this.selectedMode = '';
        this.findRelevantActivity();
    },
    methods: {
        async search() {
            if (this.editingDaysInput) {
                await this.findRelevantActivity();
            }

            this.editingDaysInput = !this.editingDaysInput;
        },
        filterEvents (events, mode) {
            if (!mode.length) return events;

            return events.filter(event => {
                if (this.eventsId == 'qualityAssuranceChecks') {
                    return event.event.modes.includes(mode);
                } else {
                    return event.modes.includes(mode);
                }
            });
        },
        async findRelevantActivity() {
            this.$store.commit('activity/setIsLoading', true);

            let days = parseInt(this.daysInput.toString());
            if (isNaN(days)) days = 90 + 7;
            else if (days > 10000) days = 9999;
            else if (days < 2) days = 2;
            this.daysInput = days;

            const route = this.loggedInUser && this.loggedInUser.isNat ? 'bnEval' : 'users';

            const res = await this.$http.executeGet(`/${route}/activity?osuId=${this.osuId}&modes=${this.modes}&deadline=${new Date(this.deadline).getTime()}&mongoId=${this.mongoId}&days=${days}`);

            if (res) {
                this.$store.commit('activity/setNominations', res.uniqueNominations);
                this.$store.commit('activity/setNominationsDisqualified', res.nominationsDisqualified);
                this.$store.commit('activity/setNominationsPopped', res.nominationsPopped);
                this.$store.commit('activity/setDisqualifications', res.disqualifications);
                this.$store.commit('activity/setPops', res.pops);
                this.$store.commit('activity/setQualityAssuranceChecks', res.qualityAssuranceChecks);
                this.$store.commit('activity/setDisqualifiedQualityAssuranceChecks', res.disqualifiedQualityAssuranceChecks);
                this.$store.commit('activity/setMonth1Nominations', res.month1Nominations);
                this.$store.commit('activity/setMonth2Nominations', res.month2Nominations);
                this.$store.commit('activity/setMonth3Nominations', res.month3Nominations);
                this.$store.commit('activity/setCurrentMonthNominations', res.currentMonthNominations);
                this.$store.commit('activity/setSelectedUser', this.user);

                if ((this.loggedInUser && this.loggedInUser.isNat) || this.isNat) {
                    this.$store.commit('activity/setBnApplications', res.assignedBnApplications);
                    this.$store.commit('activity/setNatApplications', res.appEvaluations);
                    this.$store.commit('activity/setNatBnEvaluations', res.bnEvaluations);
                    this.$store.commit('activity/setMockApplications', res.mockAppEvaluations);
                    this.$store.commit('activity/setMockBnEvaluations', res.mockBnEvaluations);
                }

                this.$store.commit('activity/setIsLoading', false);
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