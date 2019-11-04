<template>
    <div class="row">
        <div class="col-md-12">
            <section class="segment my-1">
                <small>Search:
                    <input
                        id="search"
                        v-model="filterValue"
                        class="ml-1"
                        type="text"
                        placeholder="username..."
                    >
                </small>
                <small class="ml-1">
                    <select id="validity" v-model="filterVote" class="custom-select">
                        <option class="ml-2" value="" selected>All statuses</option>
                        <option class="ml-2" value="1">Valid</option>
                        <option class="ml-2" value="2">Partial</option>
                        <option class="ml-2" value="3">Invalid</option>
                        <option class="ml-2" value="none">Unmarked</option>
                    </select>
                </small>
                <span class="errors">{{ info }}</span>
            </section>
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
                <transition-group name="list" tag="div" class="row">
                    <report-card
                        v-for="report in closedReports"
                        :key="report.id"
                        :report="report"
                        @update:selectedReport="selectedReport = $event"
                    />
                </transition-group>

                <p v-if="!closedReports || closedReports.length == 0" class="ml-4">
                    No closed reports...
                </p>
            </section>
        </div>
    
        <report-info
            :report="selectedReport"
            :is-leader="isLeader"
            @update-report="updateReport($event)"
        />
    </div>
</template>

<script>
import ReportCard from '../components/reports/ReportCard.vue';
import ReportInfo from '../components/reports/ReportInfo.vue';
import filters from '../mixins/filters.js';

export default {
    name: 'ManageReportsPage',
    components: {
        ReportCard,
        ReportInfo,
    },
    mixins: [filters],
    data() {
        return {
            allObjs: null,
            pageObjs: null,
            openReports: null,
            closedReports: null,
            selectedReport: null,
            isLeader: null,
            info: '',
        };
    },
    watch: {
        allObjs(){
            this.filter();
        },
    },
    created() {
        axios
            .get('/manageReports/relevantInfo')
            .then(response => {
                this.allObjs = response.data.r;
                this.hasPagination = false;
                this.hasSeparation = true;
                this.isLeader = response.data.isLeader;
                const params = new URLSearchParams(document.location.search.substring(1));
                if (params.get('report') && params.get('report').length) {
                    const i = this.allObjs.findIndex(r => r.id == params.get('report'));
                    if(i >= 0){
                        this.selectedReport = this.allObjs[i];
                        $('#reportInfo').modal('show');
                    }else{
                        this.info = "Cannot find report!"
                    }
                }
            }).then(function(){
                $('#loading').fadeOut();
                $('#main').attr('style', 'visibility: visible').hide().fadeIn();
            });
    },
    mounted () {
        setInterval(() => {
            axios
                .get('/manageReports/relevantInfo')
                .then(response => {
                    this.allObjs = response.data.r;
                });
        }, 300000);
    },
    methods: {
        filterBySearchValueContext(o) {
            if (o.culprit && o.culprit.username.toLowerCase().indexOf(this.filterValue.toLowerCase()) >= 0) {
                return true;
            } else {
                return false;
            }
        },
        separateObjs() {
            this.openReports = this.pageObjs.filter( report =>{
                if(this.isLeader){
                    return report.isActive;
                }else{
                    return report.isActive && (!report.culprit || report.culprit.group != 'nat');
                }
                
            });
            this.closedReports = this.pageObjs.filter( report =>{
                if(this.isLeader){
                    return !report.isActive;
                }else{
                    return !report.isActive && (!report.culprit || report.culprit.group != 'nat');
                }
            });
        },
        updateReport (report) {
            const i = this.allObjs.findIndex(r => r.id == report.id);
            this.allObjs[i] = report;
            this.selectedReport = report;
            this.filter();
        },
    },
};
</script>