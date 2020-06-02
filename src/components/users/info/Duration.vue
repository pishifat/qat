<template>
    <div class="row">
        <div v-if="selectedUser.bnDuration.length" class="col-sm-6">
            <p class="mb-2">
                <b>BN:</b> {{ calculateDuration('bn') }}
            </p>
            <div class="text-secondary">
                <ul>
                    <li v-for="(date, i) in selectedUser.bnDuration" :key="date" class="small">
                        {{ date.slice(0, 10) }}: {{ i % 2 == 0 ? 'joined' : 'left' }}
                    </li>
                </ul>
            </div>
        </div>
        <div v-if="selectedUser.natDuration.length" class="col-sm-6">
            <p class="mb-2">
                <b>NAT:</b> {{ calculateDuration('nat') }}
            </p>
            <div>
                <ul>
                    <li v-for="(date, i) in selectedUser.natDuration" :key="date" class="small">
                        {{ date.slice(0, 10) }}: {{ i % 2 == 0 ? 'joined' : 'left' }}
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'Duration',
    computed: {
        ...mapGetters([
            'selectedUser',
        ]),
    },
    methods: {
        calculateDuration(group) {
            let dateArray = group == 'bn' ? this.selectedUser.bnDuration : this.selectedUser.natDuration;
            let days = 0;

            for (let i = 0; i < dateArray.length; i += 2) {
                let a = new Date(dateArray[i]);
                let b = new Date(dateArray[i + 1]);

                if (dateArray[i + 1]) {
                    days += Math.abs(b.getTime() - a.getTime()) / (1000 * 3600 * 24);
                } else {
                    days += Math.abs(new Date().getTime() - a.getTime()) / (1000 * 3600 * 24);
                }
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