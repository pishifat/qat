<template>
    <div class="col-md-6 col-lg-4 my-2" @click="selectTest()">
        <div class="card cursor-pointer">
            <div class="card-body">
                <a
                    :href="'https://osu.ppy.sh/users/' + selectedTest.applicant.osuId"
                    target="_blank"
                    @click.stop
                >
                    {{ selectedTest.applicant.username }}
                </a>
            </div>

            <div class="card-footer small d-flex">
                <i class="fas fa-trophy mr-2" /> {{ selectedTest.totalScore }}/20

                <i class="fas fa-clock mx-2" /> {{ selectedTest.submittedAt.slice(0, 10) }}

                <div class="ml-auto">
                    <i v-if="selectedTest.mode == 'osu'" class="far fa-circle" />
                    <i v-else-if="selectedTest.mode == 'taiko'" class="fas fa-drum" />
                    <i v-else-if="selectedTest.mode == 'catch'" class="fas fa-apple-alt" />
                    <i v-else-if="selectedTest.mode == 'mania'" class="fas fa-stream" />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ResultCard',
    props: {
        selectedTest: {
            type: Object,
            required: true,
        },
    },
    methods: {
        selectTest() {
            this.$store.commit('setSelectedTestId', this.selectedTest.id);
        },
    },
};
</script>
