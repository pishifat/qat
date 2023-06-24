<template>
    <div class="col-md-6 col-sm-12 my-2" @click="selectReport()">
        <div
            class="card cursor-pointer"
            :class="report.valid == 1 ? 'border-success' : report.valid == 2 ? 'border-info' : report.valid == 3 ? 'border-danger' : ''"
            data-toggle="modal"
            data-target="#reportInfo"
            :data-user="report.id"
        >
            <div class="card-body">
                <p class="text-truncate text-secondary">
                    <user-link
                        v-if="report.culprit"
                        :osu-id="report.culprit.osuId"
                        :username="report.culprit.username"
                        @click.stop
                    />
                    <a
                        v-else
                        :href="report.link"
                        target="_blank"
                        @click.stop
                    >
                        {{ report.link }}
                    </a>
                    -
                    <span class="small">{{ report.reason }}</span>
                </p>
            </div>

            <div class="card-footer">
                <span class="small">
                    <i class="fas fa-clock mx-1" />
                    <date-display
                        :date="report.createdAt"
                        :include-time="true"
                    />
                </span>
                <span class="small float-right">{{ category }}</span>
            </div>
        </div>
    </div>
</template>

<script>
import DateDisplay from '../DateDisplay.vue';
import UserLink from '../UserLink.vue';

export default {
    name: 'ReportCard',
    components: {
        DateDisplay,
        UserLink,
    },
    props: {
        report: {
            type: Object,
            required: true,
        },
    },
    computed: {
        category() {
            switch (this.report.category) {
                case 'stolenBeatmap':
                    return 'Stolen beatmap';
                case 'beatmap':
                    return 'beatmap';
                case 'contentCaseSong':
                    return 'Inappropriate song';
                case 'contentCaseVisual':
                    return 'Inappropriate visual content';
                case 'behavior':
                    return 'User behavior';
                case 'other':
                    return 'Other';
                default:
                    return 'No category';
            }
        },
    },
    methods: {
        selectReport () {
            this.$store.commit('manageReports/setSelectedReportId', this.report.id);

            if (this.$route.query.id !== this.report.id) {
                this.$router.replace(`/managereports?id=${this.report.id}`);
            }
        },
    },
};
</script>

<style scoped>
.card {
    min-height: 80px;
}
</style>
