<template>
    <div class="col-md-4 col-lg-3 col-sm-6 my-2" @click="selectTest()">
        <div class="card">
            <div class="card-body text-shadow">
                <a
                    :href="'https://osu.ppy.sh/users/' + selectedTest.applicant.osuId"
                    target="_blank"
                    @click.stop
                    >{{ selectedTest.applicant.username }}</a
                >
            </div>
            <div class="card-footer small">
                <i class="fas fa-trophy mr-1"></i> {{ selectedTest.totalScore + selectedTest.additionalPoints }}/20
                <i class="fas fa-clock mx-1"></i> {{ selectedTest.submittedAt.slice(0, 10) }}
                <i v-if="selectedTest.mode == 'osu'" class="far fa-circle float-right"></i>
                <i v-else-if="selectedTest.mode == 'taiko'" class="fas fa-drum float-right"></i>
                <i v-else-if="selectedTest.mode == 'catch'" class="fas fa-apple-alt float-right"></i>
                <i v-else-if="selectedTest.mode == 'mania'" class="fas fa-stream float-right"></i>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'result-card',
    props: ['selected-test'],
    methods: {
        selectTest: function() {
            this.$emit('update:selected-test', this.selectedTest);
        },
    },
};
</script>

<style>
.card {
    min-height: 80px;
}
</style>
