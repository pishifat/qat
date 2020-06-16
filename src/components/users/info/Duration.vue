<template>
    <div class="row">
        <div v-if="selectedUser.bnDuration.length" class="col-sm-6">
            <p class="mb-2">
                <b>BN:</b> {{ calculateDuration('bn') }}
            </p>

            <ul class="text-secondary">
                <li v-for="(date, i) in selectedUser.bnDuration" :key="date" class="small">
                    {{ date | toStandardDate }}: {{ i % 2 == 0 ? 'joined' : 'left' }}
                </li>
            </ul>
        </div>
        <div v-if="selectedUser.natDuration.length" class="col-sm-6">
            <p class="mb-2">
                <b>NAT:</b> {{ calculateDuration('nat') }}
            </p>

            <ul class="text-secondary">
                <li v-for="(date, i) in selectedUser.natDuration" :key="date" class="small">
                    {{ date | toStandardDate }}: {{ i % 2 == 0 ? 'joined' : 'left' }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'Duration',
    computed: {
        ...mapGetters('users', [
            'selectedUser',
        ]),
    },
    methods: {
        calculateDuration (group) {
            let dateArray = group == 'bn' ? this.selectedUser.bnDuration : this.selectedUser.natDuration;
            let days = 0;

            for (let i = 0; i < dateArray.length; i += 2) {
                let a = this.$moment(dateArray[i]);
                let b = this.$moment(dateArray[i + 1]); // becomes new date if doesn't exists
                days += b.diff(a, 'days');
            }

            let years = Math.floor(days / 365);
            let remainingDays = Math.round(days % 365);

            if (years > 0) {
                return `${years} ${years == 1 ? 'year' : 'years'}, ${remainingDays} days`;
            } else {
                return `${remainingDays} days`;
            }
        },
    },
};
</script>