<template>
    <div>
        <p class="font-weight-bold form-inline">
            <span>User activity:</span>
            <input
                v-if="editingDaysInput"
                v-model="daysInput"
                class="form-control form-control-sm w-days"
                type="number"
                min="1"
                max="9999"
                @keyup.enter="search"
            />
            <span v-else class="mx-1">{{ daysInput }}</span>
            days
            <a href="#" @click.prevent="search">
                <i class="fas fa-edit ml-1" />
            </a>
        </p>

        <div class="container mb-3">
            <div>Nominations</div>
            <events-list
                :events="nominations"
                :events-id="'uniqueNominations'"
                :header="'Unique nominations'"
                :osu-id="osuId"
                :is-evaluation="isEvaluation"
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
            <div class="mt-2">Quality Assurance</div>
            <events-list
                :events="qualityAssuranceChecks"
                :events-id="'qualityAssuranceChecks'"
                :header="'Quality Assurance Checks'"
                :osu-id="osuId"
            />
            <nomination-resets
                :events="disqualifiedQualityAssuranceChecks"
                :events-id="'disqualifiedQualityAssuranceChecks'"
                :header="'Disqualified Quality Assurance Checks'"
            />

            <template
                v-if="
                    loggedInUser.isNat && (natApplications || natBnEvaluations)
                "
            >
                <div class="mt-2">Evaluations</div>
                <evaluation-list
                    v-if="
                        assignedBnApplications && assignedBnApplications.length
                    "
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
            </template>

            <template>
                <div class="mt-2">Modding</div>
                <events-list
                    :events="bnFinderMatches"
                    :events-id="'bnFinderMatches'"
                    :header="'BN Finder matches'"
                    :osu-id="osuId"
                />
            </template>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
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
    },
    data() {
        return {
            daysInput: this.overwriteDays,
            editingDaysInput: false,
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
            'bnFinderMatches',
        ]),
    },
    watch: {
        unique() {
            this.findRelevantActivity();
            this.daysInput = this.overwriteDays;
        },
    },
    created() {
        this.findRelevantActivity();
        this.daysInput = this.overwriteDays;
    },
    methods: {
        async search() {
            if (this.editingDaysInput) {
                await this.findRelevantActivity();
            }

            this.editingDaysInput = !this.editingDaysInput;
        },
        async findRelevantActivity() {
            this.$store.commit('activity/setIsLoading', true);

            let days = parseInt(this.daysInput.toString());
            if (isNaN(days)) days = 90 + 7;
            else if (days > 10000) days = 9999;
            else if (days < 2) days = 2;
            this.daysInput = days;

            const route = this.loggedInUser.isNat ? 'bnEval' : 'users';

            const res = await this.$http.executeGet(
                `/${route}/activity?osuId=${this.osuId}&modes=${
                    this.modes
                }&deadline=${new Date(this.deadline).getTime()}&mongoId=${
                    this.mongoId
                }&days=${days}`
            );

            if (res) {
                this.$store.commit(
                    'activity/setNominations',
                    res.uniqueNominations
                );
                this.$store.commit(
                    'activity/setNominationsDisqualified',
                    res.nominationsDisqualified
                );
                this.$store.commit(
                    'activity/setNominationsPopped',
                    res.nominationsPopped
                );
                this.$store.commit(
                    'activity/setDisqualifications',
                    res.disqualifications
                );
                this.$store.commit('activity/setPops', res.pops);
                this.$store.commit(
                    'activity/setQualityAssuranceChecks',
                    res.qualityAssuranceChecks
                );
                this.$store.commit(
                    'activity/setDisqualifiedQualityAssuranceChecks',
                    res.disqualifiedQualityAssuranceChecks
                );

                if (this.loggedInUser.isNat) {
                    this.$store.commit(
                        'activity/setBnApplications',
                        res.assignedBnApplications
                    );
                    this.$store.commit(
                        'activity/setNatApplications',
                        res.appEvaluations
                    );
                    this.$store.commit(
                        'activity/setNatBnEvaluations',
                        res.bnEvaluations
                    );
                }

                this.$store.commit(
                    'activity/setBnFinderMatches',
                    res.bnFinderMatches
                );

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