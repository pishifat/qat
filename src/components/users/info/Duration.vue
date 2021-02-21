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
import duration from '../../../mixins/duration.js';

export default {
    name: 'Duration',
    mixins: [ duration ],
    computed: {
        ...mapGetters('users', [
            'selectedUser',
        ]),
    },
};
</script>