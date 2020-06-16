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

            <div class="card-footer small d-flex align-items-center">
                <i class="fas fa-trophy mr-2" /> {{ selectedTest.totalScore }}/20

                <i class="fas fa-clock mx-2" /> {{ selectedTest.submittedAt | toStandardDate }}

                <mode-display
                    class="ml-auto"
                    :modes="selectedTest.mode"
                />
            </div>
        </div>
    </div>
</template>

<script>
import ModeDisplay from '../ModeDisplay.vue';

export default {
    name: 'ResultCard',
    components: {
        ModeDisplay,
    },
    props: {
        selectedTest: {
            type: Object,
            required: true,
        },
    },
    methods: {
        selectTest() {
            this.$store.commit('testResults/setSelectedTestId', this.selectedTest.id);
        },
    },
};
</script>
