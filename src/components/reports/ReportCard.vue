<template>
    <div class="col-md-6 col-sm-12 my-2" @click="selectReport()">
        <div
            class="card"
            :class="report.valid == 1 ? 'border-green' : report.valid == 2 ? 'border-blue' : report.valid == 3 ? 'border-red' : ''"
            data-toggle="modal"
            data-target="#reportInfo"
            :data-user="report.id"
        >
            <div class="card-body">
                <p class="truncate text-shadow text-white-50">
                    <a
                        v-if="report.culprit"
                        :href="'https://osu.ppy.sh/users/' + report.culprit.osuId"
                        target="_blank"
                        @click.stop
                    >{{ report.culprit.username }}
                    </a>
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
                <span class="small text-shadow"><i class="fas fa-clock mx-1" /> {{ report.createdAt.slice(0,10) }}</span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ReportCard',
    props: {
        report: {
            type: Object,
            required: true,
        },
    },
    methods: {
        selectReport () {
            this.$store.commit('setSelectedReportId', this.report.id);
        },
    },
};
</script>

<style>
.card {
    min-height: 80px;
}

.truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
