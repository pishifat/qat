<template>

<div class="row">
    <div class="col-md-12 mb-4">
        <h2>Open Reports</h2>
        <transition-group name="list" tag="div" class="row">
            <report-card
                v-for="report in openReports"
                :key="report.id"
                :report="report"
                @update:selectedReport="selectedReport = $event"
            ></report-card>
        </transition-group>
        
        <p v-if="!openReports || openReports.length == 0" class="ml-4">No open reports...</p>
    </div>

    <div class="col-md-12">
        <h2>Closed Reports</h2>
        <transition-group name="list" tag="div" class="row">
            <report-card
                v-for="report in closedReports"
                :key="report.id"
                :report="report"
                @update:selectedReport="selectedReport = $event"
            ></report-card>
        </transition-group>

        <p v-if="!closedReports || closedReports.length == 0" class="ml-4">No closed reports...</p>
    </div>
    
   <report-info
        :report="selectedReport"
        @update-report="updateReport($event)"
    ></report-info>

</div>

</template>



<script>
import ReportCard from '../components/reports/ReportCard.vue';
import ReportInfo from '../components/reports/ReportInfo.vue';

export default {
    name: 'manage-reports-page',
    components: {
        ReportCard,
        ReportInfo
    },
    watch: {
        reports: function(v){
            if(v){
                this.categorize();
            }
        },
    },
    methods: {
        executePost: async function (path, data, e) {
            if (e) e.target.disabled = true;

            try {
                const res = await axios.post(path, data)
                
                if (res.data.error) {
                    this.info = res.data.error;
                } else {
                    if (e) e.target.disabled = false;
                    return res.data;
                }
            } catch (error) {
                console.log(error)
            }

            if (e) e.target.disabled = false;
        },
        updateReport: function (report) {
			const i = this.reports.findIndex(r => r.id == report.id);
			this.reports[i] = report;
            this.selectedReport = report;
            this.categorize();
        },
        categorize: function(){
            this.openReports = this.reports.filter( report => !report.feedback || !report.valid);
            this.closedReports = this.reports.filter( report => report.feedback && report.valid);
        }
    },
    data() {
        return {
            reports: null,
            openReports: null,
            closedReports: null,
            selectedReport: null,
            info: '',
        }
    },
    created() {
        axios
            .get('/qat/manageReports/relevantInfo')
            .then(response => {
                this.reports = response.data.r;
            }).then(function(){
                $("#loading").fadeOut();
                $("#main").attr("style", "visibility: visible").hide().fadeIn();
            });
    },
    mounted () {
        setInterval(() => {
            axios
                .get('/qat/manageReports/relevantInfo')
                .then(response => {
                    this.reports = response.data.r;
                });
        }, 300000);
    }
}
</script>