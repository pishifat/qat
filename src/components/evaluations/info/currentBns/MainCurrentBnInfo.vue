<template>
    <div>
        <p>
            <b>Recent BN activity</b>
        </p>

        <user-activity
            :osu-id="selectedEvaluation.user.osuId"
            :modes="modes"
            :deadline="selectedEvaluation.deadline"
            :mongo-id="selectedEvaluation.user.id"
        />
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import UserActivity from './userActivity/UserActivity.vue';

export default {
    name: 'MainCurrentBnInfo',
    components: {
        UserActivity,
    },
    computed: {
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
        modes () {
            if (!this.selectedEvaluation) return [];
            if (this.selectedEvaluation.user.modes.length) return this.selectedEvaluation.user.modes;

            return this.selectedEvaluation.mode;
        },
    },
};
</script>
