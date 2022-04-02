<template>
    <div class="row">
        <div v-if="bnHistory.length" class="col-sm-6">
            <p class="mb-2">
                <b>BN:</b> {{ calculateDuration('bn') }}
            </p>

            <ul class="text-secondary">
                <li v-for="history in sortedBnHistory" :key="history.date" class="small">
                    {{ history.date | toStandardDate }}: {{ history.kind }} ({{ history.mode }})
                </li>
            </ul>
        </div>
        <div v-if="natHistory.length" class="col-sm-6">
            <p class="mb-2">
                <b>NAT:</b> {{ calculateDuration('nat') }}
            </p>

            <ul class="text-secondary">
                <li v-for="history in sortedNatHistory" :key="history.date" class="small">
                    {{ history.date | toStandardDate }}: {{ history.kind }} ({{ history.mode }})
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import duration from '../../../mixins/duration.js';

export default {
    name: 'Duration',
    mixins: [ duration ],
    computed: {
        ...mapGetters('users', [
            'selectedUser',
        ]),
        sortedBnHistory () {
            return [...this.bnHistory].sort((a, b) => {
                if (a.date > b.date) return 1;
                if (a.date < b.date) return -1;

                return 0;
            });
        },
        sortedNatHistory () {
            return [...this.natHistory].sort((a, b) => {
                if (a.date > b.date) return 1;
                if (a.date < b.date) return -1;

                return 0;
            });
        },
    },
};
</script>