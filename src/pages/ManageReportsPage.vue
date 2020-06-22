<template>
    <div class="row">
        <div class="col-md-12">
            <section class="card card-body">
                <h2>Open Reports</h2>

                <transition-group name="list" tag="div" class="row">
                    <report-card
                        v-for="report in openReports"
                        :key="report.id"
                        :report="report"
                        @update:selectedReport="selectedReport = $event"
                    />
                </transition-group>

                <p v-if="!openReports || openReports.length == 0" class="ml-4">
                    No open reports...
                </p>
            </section>

            <section class="card card-body">
                <h2>Closed Reports</h2>

                <div class="form-inline">
                    <input
                        v-model="searchValue"
                        type="text"
                        placeholder="username or osuID..."
                        maxlength="18"
                        autocomplete="off"
                        class="form-control"
                        @keyup.enter="query($event)"
                    >
                    <button class="btn btn-sm btn-primary ml-2" type="submit" @click="query($event)">
                        Search archives
                    </button>
                </div>

                <div class="form-inline mt-2">
                    <input
                        v-model="limit"
                        type="text"
                        placeholder="# entries..."
                        maxlength="3"
                        autocomplete="off"
                        class="form-control"
                        @keyup.enter="queryRecent($event)"
                    >
                    <button class="btn btn-sm btn-primary ml-2" type="submit" @click="queryRecent($event)">
                        Show recent
                    </button>
                </div>

                <template v-if="isQueried">
                    <transition-group name="list" tag="div" class="row">
                        <report-card
                            v-for="report in closedReports"
                            :key="report.id"
                            :report="report"
                        />
                    </transition-group>

                    <p v-if="!closedReports || closedReports.length == 0" class="ml-4 mt-2">
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
import postData from '../mixins/postData.js';

export default {
    name: 'ManageReportsPage',
    components: {
        ToastMessages,
        ReportCard,
        ReportInfo,
    },
    mixins: [postData],
    data() {
        return {
            searchValue: null,
            limit: null,
        };
    },
    computed: {
        ...mapState('manageReports', [
            'openReports',
            'closedReports',
            'isQueried',
        ]),
    },
    beforeCreate () {
        if (!this.$store.hasModule('manageReports')) {
            this.$store.registerModule('manageReports', manageReportsModule);
        }
    },
    async created() {
        const res = await this.initialRequest('/manageReports/relevantInfo');

        if (res) {
            this.$store.commit('manageReports/setOpenReports', res.openReports);
            const id = this.$route.query.id;
            const user = this.$route.query.user;

            if (id) {
                const i = this.openReports.findIndex(r => r.id == id);

                if (i >= 0) {
                    this.$store.commit('manageReports/setSelectedReportId', id);
                    $('#reportInfo').modal('show');
                } else {
                    const report = await this.executeGet(`/manageReports/searchById/${id}`);

                    if (report && !report.error) {
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
        updateReports (data) {
            if (data && !data.error) {
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

                const data = await this.executeGet('/manageReports/search/' + this.searchValue, e);
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
                const data = await this.executeGet('/manageReports/searchRecent/' + this.limit, e);
                this.updateReports(data);
            }
        },
    },
};
</script>
