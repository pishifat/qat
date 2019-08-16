<template>
    <div class="col-md-3 col-lg-2 col-sm-6 my-2" @click="selectReport()">
        <div
            class="card" 
            :class="report.valid == 1 ? 'border-pass' : report.valid == 2 ? 'border-extend' : report.valid == 3 ? 'border-fail' : ''"
            data-toggle="modal"
            data-target="#reportInfo"
            :data-user="report.id"
        >
            <div class="card-body">
                <a
                    v-if="report.culprit"
                    :href="'https://osu.ppy.sh/users/' + report.culprit.osuId"
                    class="text-shadow"
                    target="_blank"
                    @click.stop
                >{{ report.culprit.username }}
                </a>
                <a
                    v-else
                    :href="report.link"
                    target="_blank"
                    class="text-shadow"
                    @click.stop
                >
                    {{ report.link.length > 15 ? report.link.slice(0,15) + "..." : report.link }}
                </a>
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
    props: ['report'],
    methods: {
        selectReport () {
            this.$emit('update:selectedReport', this.report);
        },
    },
};
</script>

<style>
.card {
    min-height: 80px;
}
</style>
