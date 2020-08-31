<template>
    <div class="col-md-6 col-lg-4 my-2" @click="selectTest()">
        <div class="card cursor-pointer">
            <div class="card-body">
                <user-link
                    :osu-id="selectedTest.applicant.osuId"
                    :username="selectedTest.applicant.username"
                    @click.stop
                />
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
import UserLink from '../UserLink.vue';

export default {
    name: 'ResultCard',
    components: {
        ModeDisplay,
        UserLink,
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
