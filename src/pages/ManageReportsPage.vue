<template>
    <div class="row">
        <div class="col-md-12">
            <section class="card card-body">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h2 class="mb-0">Open Reports</h2>
                    <div class="form-check mb-0">
                        <input
                            id="showAiReports"
                            v-model="showAiReports"
                            class="form-check-input"
                            type="checkbox"
                        >
                        <label class="form-check-label text-secondary" for="showAiReports">
                            Show AI reports
                        </label>
                    </div>
                </div>

                <transition-group name="list" tag="div" class="row">
                    <report-card
                        v-for="report in displayedOpenReports"
                        :key="report.id"
                        :report="report"
                        @update:selected-report="selectedReport = $event"
                    />
                </transition-group>

                <p v-if="!displayedOpenReports.length" class="ms-4">
                    No open reports...
                </p>
            </section>

            <section class="card card-body">
                <h2>Closed Reports</h2>

                <div class="input-group w-25">
                    <input
                        v-model="searchValue"
                        type="text"
                        placeholder="username or osuID..."
                        maxlength="18"
                        autocomplete="off"
                        class="form-control"
                        @keyup.enter="query($event)"
                    >
                    <button class="btn btn-sm btn-primary h-75 mt-1" type="submit" @click="query($event)">
                        Search archives
                    </button>
                </div>

                <div class="input-group mt-2 w-25">
                    <input
                        v-model="limit"
                        type="text"
                        placeholder="# entries..."
                        maxlength="3"
                        autocomplete="off"
                        class="form-control"
                        @keyup.enter="queryRecent($event)"
                    >
                    <button class="btn btn-sm btn-primary h-75 mt-1" type="submit" @click="queryRecent($event)">
                        Show recent
                    </button>
                </div>

                <template v-if="isQueried">
                    <transition-group name="list" tag="div" class="row">
                        <report-card
                            v-for="report in displayedClosedReports"
                            :key="report.id"
                            :report="report"
                        />
                    </transition-group>

                    <p v-if="!displayedClosedReports.length" class="ms-4 mt-2">
                        No closed reports...
                    </p>
                </template>
            </section>
        </div>

        <report-info />

        <toast-messages />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import manageReportsModule from '../store/manageReports';
import ToastMessages from '../components/ToastMessages.vue';
import ReportCard from '../components/reports/ReportCard.vue';
import ReportInfo from '../components/reports/ReportInfo.vue';

export default {
    name: 'ManageReportsPage',
    components: {
        ToastMessages,
        ReportCard,
        ReportInfo,
    },
    data() {
        return {
            searchValue: null,
            limit: null,
            showAiReports: false,
            lastClosedSearch: null,
        };
    },
    computed: {
        ...mapState('manageReports', [
            'openReports',
            'closedReports',
            'isQueried',
        ]),
        displayedOpenReports () {
            return this.filterReports(this.openReports);
        },
        displayedClosedReports () {
            return this.filterReports(this.closedReports);
        },
    },
    watch: {
        showAiReports () {
            if (this.isQueried && this.lastClosedSearch === 'recent' && parseInt(this.limit)) {
                this.queryRecent();
            }
        },
    },
    beforeCreate () {
        if (!this.$store.hasModule('manageReports')) {
            this.$store.registerModule('manageReports', manageReportsModule);
        }
    },
    async created() {
        const res = await this.$http.initialRequest('/manageReports/relevantInfo');

        if (res) {
            this.$store.commit('manageReports/setOpenReports', res.openReports);
            const id = this.$route.query.id;
            const user = this.$route.query.user;

            if (id) {
                const i = this.openReports.findIndex(r => r.id == id);

                if (i >= 0) {
                    if (this.openReports[i].category === 'aiBeatmap') {
                        this.showAiReports = true;
                    }

                    this.$store.commit('manageReports/setSelectedReportId', id);
                    $('#reportInfo').modal('show');
                } else {
                    const report = await this.$http.executeGet(`/manageReports/searchById/${id}`);

                    if (report && !report.error) {
                        if (report.category === 'aiBeatmap') {
                            this.showAiReports = true;
                        }

                        this.$store.commit('manageReports/setClosedReports', [report]);
                        this.$store.commit('manageReports/setSelectedReportId', id);
                        this.$store.commit('manageReports/setIsQueried', true);
                        $('#reportInfo').modal('show');
                    }
                }
            }

            if (user && user) {
                this.searchValue = user;
                await this.query();
            }
        }
    },
    methods: {
        filterReports (reports) {
            if (!reports || !reports.length) return [];

            return reports.filter(report => this.showAiReports
                ? report.category === 'aiBeatmap'
                : report.category !== 'aiBeatmap'
            );
        },
        updateReports (data) {
            if (this.$http.isValid(data)) {
                this.$store.commit('manageReports/setIsQueried', true);
                this.$store.commit('manageReports/setClosedReports', data);
                this.$store.dispatch('updateToastMessages', {
                    message: `Reports loaded`,
                    type: 'info',
                });
            }
        },
        async query(e) {
            if (!this.searchValue || !this.searchValue.length) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Must enter username or osu ID!`,
                    type: 'danger',
                });
            } else {
                if (this.$route.query.user !== this.searchValue) {
                    this.$router.replace(`/managereports?user=${this.searchValue}`);
                }

                this.lastClosedSearch = 'user';
                const data = await this.$http.executeGet('/manageReports/search/' + this.searchValue, e);
                this.updateReports(data);
            }
        },
        async queryRecent(e) {
            if (!parseInt(this.limit)) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Invalid number!`,
                    type: 'danger',
                });
            } else {
                this.lastClosedSearch = 'recent';
                const aiQuery = this.showAiReports ? '?ai=true' : '';
                const data = await this.$http.executeGet('/manageReports/searchRecent/' + this.limit + aiQuery, e);
                this.updateReports(data);
            }
        },
    },
};
</script>
