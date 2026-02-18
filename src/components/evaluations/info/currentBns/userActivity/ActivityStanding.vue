<template>
    <div>
        <div v-if="!isLoading" class="progress-bar osu-badge rounded mb-3">
            <div
                v-for="(month, i) in [month1Nominations, month2Nominations, month3Nominations, currentMonthNominations]"
                :key="i"
                class="segment w-25"
                :class="bgClass(month, i)"
            >
                <span class="segment-text">
                    <b class="me-1">{{ $moment().subtract(3 - i, 'months').format('MMMM') }}: </b> {{ month }} map{{ month == 1 ? '' : 's' }}
                </span>
            </div>
        </div>
        <div v-else class="progress-bar osu-badge rounded mb-3">
            <div
                v-for="i in 4"
                :key="i"
                class="segment bg-secondary w-25"
            >
                <span class="segment-text">
                    <b class="me-1">{{ $moment().subtract(4 - i, 'months').format('MMMM') }}: </b> loading...
                </span>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
    name: 'UserActivity',
    computed: {
        ...mapState(['loggedInUser']),
        ...mapState('activity', [
            'month1Nominations',
            'month2Nominations',
            'month3Nominations',
            'currentMonthNominations',
            'isLoading',
            'selectedUser',
        ]),
        bnJoinDate() {
            if (this.selectedUser.groups.includes('bn') && this.selectedUser.history && this.selectedUser.history.length) {
                return new Date(this.selectedUser.history[this.selectedUser.history.length - 1].date);
            }

            return new Date();
        },
    },
    methods: {
        generateDisplayText (month, i) {
            const monthName = this.$moment().subtract(3 - i, 'months').format('MMMM');

            return `${monthName}: ${month} nominations`;
        },
        bgClass (month, i) {
            const monthStartDate = this.$moment().subtract(3 - i, 'months').startOf('month');

            if (new Date(monthStartDate) < this.bnJoinDate) {
                return 'bg-secondary';
            }

            if (month == 0) {
                return 'bg-danger';
            } else if (month == 1) {
                return 'bg-warning';
            } else if (month >= 2) {
                return 'bg-success';
            }
        },
    },
};
</script>

<style scoped>
.progress-bar {
    display: block;
    width: 100%;
    height: 30px;
    background-color: black;
}

.segment {
    float: left;
    height: 100%;
    min-width: 0;
    box-shadow: -2px 0 4px rgba(0, 0, 0, 0.3); /* Left side shadow */
}

.segment-text {
    display: flex;
    white-space: nowrap;
    overflow: hidden;
    font-size: 12px;
    transform: translateY(10%);
    color: black;
    margin: 4px;
}
</style>