<template>
    <div class="row">
        <div v-if="bnHistory.length" class="col-sm-6">
            <p class="mb-2">
                <b>BN:</b> {{ calculateDuration('bn') }}
            </p>

            <ul class="text-secondary">
                <li v-for="history in bnHistory" :key="history.date" class="small">
                    {{ history.date | toStandardDate }}: {{ history.kind }} ({{ history.mode }})
                </li>
            </ul>
        </div>
        <div v-if="natHistory.length" class="col-sm-6">
            <p class="mb-2">
                <b>NAT:</b> {{ calculateDuration('nat') }}
            </p>

            <ul class="text-secondary">
                <li v-for="history in natHistory" :key="history.date" class="small">
                    {{ history.date | toStandardDate }}: {{ history.kind }} ({{ history.mode }})
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
        bnHistory () {
            return this.selectedUser.history.filter(h => h.group === 'bn');
        },
        natHistory () {
            return this.selectedUser.history.filter(h => h.group === 'nat');
        },
    },
    methods: {
        calculateDuration (group) {
            let days = group == 'bn' ? this.selectedUser.bnDuration : this.selectedUser.natDuration;
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