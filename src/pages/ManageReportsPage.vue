<template>
    <div class="row">
        <div class="col-md-12">
            <section class="col-md-12 segment segment-image mx-0">
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

            <section class="col-md-12 segment segment-image mx-0">
                <h2>Closed Reports</h2>
                <div class="input-group input-group-sm small">
                    <input
                        v-model="searchValue"
                        type="text"
                        placeholder="username or osuID..."
                        maxlength="18"
                        autocomplete="off"
                        @keyup.enter="query($event)"
                    >
                    <button class="btn btn-sm btn-nat ml-2" type="submit" @click="query($event)">
                        Search archives
                    </button>
                    <span v-if="info" class="errors ml-4 mt-2">Error: {{ info }}</span>
                </div>
                <div class="input-group input-group-sm small my-2">
                    <input
                        v-model="limit"
                        type="text"
                        placeholder="# entries..."
                        maxlength="3"
                        autocomplete="off"
                        @keyup.enter="queryRecent($event)"
                    >
                    <button class="btn btn-sm btn-nat ml-2" type="submit" @click="queryRecent($event)">
                        Show recent
                    </button>
                </div>
                <template v-if="queried">
                    <transition-group name="list" tag="div" class="row">
                        <report-card
                            v-for="report in closedReports"
                            :key="report.id"
                            :report="report"
                            @update:selectedReport="selectedReport = $event"
                        />
                    </transition-group>

                    <p v-if="!closedReports || closedReports.length == 0" class="ml-4 mt-2">
                        No closed reports...
                    </p>
                </template>
            </section>
        </div>

        <report-info
            :report="selectedReport"
            @update-report="updateReport($event)"
        />
    </div>
</template>

<script>
import ReportCard from '../components/reports/ReportCard.vue';
import ReportInfo from '../components/reports/ReportInfo.vue';
import postData from '../mixins/postData.js';

export default {
    name: 'ManageReportsPage',
    components: {
        ReportCard,
        ReportInfo,
    },
    mixins: [postData],
    data() {
        return {
            searchValue: null,
            limit: null,
            queried: false,
            openReports: null,
            closedReports: null,
            selectedReport: null,
            info: '',
        };
    },
    async created() {
        const response = await this.executeGet('/manageReports/relevantInfo');

        if (response) {
            this.openReports = response.openReports;
            this.hasPagination = false;
            const params = new URLSearchParams(document.location.search.substring(1));

            if (params.get('report') && params.get('report').length) {
                const i = this.openReports.findIndex(r => r.id == params.get('report'));

                if (i >= 0) {
                    this.selectedReport = this.openReports[i];
                    $('#reportInfo').modal('show');
                } else {
                    const report = await this.executeGet(`/manageReports/searchById/${params.get('report')}`);

                    if (report) {
                        if (report.error) {
                            this.info = report.error;
                        } else {
                            this.closedReports = [report];
                            this.selectedReport = this.closedReports[0];
                            this.queried = true;
                            $('#reportInfo').modal('show');
                        }
                    }
                }
            }

            if (params.get('user') && params.get('user').length) {
                this.searchValue = params.get('user');
                await this.query();
            }
        }

        $('#loading').fadeOut();
        $('#main').attr('style', 'visibility: visible').hide().fadeIn();
    },
    methods: {
        updateReport (report) {
            const i = this.openReports.findIndex(r => r.id == report.id);

            if (report.isActive) {
                this.openReports[i] = report;
            } else {
                this.openReports.splice(i,1);
                this.closedReports = [report];
            }

            this.selectedReport = report;
        },
        async query(e) {
            this.info = '';

            if (!this.searchValue || !this.searchValue.length) {
                this.info = 'Must enter a username or osu ID!';
            } else {
                history.pushState(null, 'Evaluation Archives', `/manageReports?user=${this.searchValue}`);
                const result = await this.executeGet('/manageReports/search/' + this.searchValue, e);

                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.queried = true;
                        this.closedReports = result;
                    }
                }
            }
        },
        async queryRecent(e) {
            this.info = '';

            if (parseInt(this.limit)) {
                const result = await this.executeGet('/manageReports/searchRecent/' + this.limit, e);

                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.queried = true;
                        this.closedReports = result;
                    }
                }
            } else {
                this.info = 'Invalid number';
            }
        },
    },
};
</script>