<template>
    <div class="row">
        <div v-if="bnDuration.length" class="col-sm-6">
            <p class="text-shadow mb-2 min-spacing">
                BN: {{ calculateDuration('bn') }}
            </p>
            <div class="text-shadow">
                <ul>
                    <li v-for="(date, i) in bnDuration" :key="date" class="small">
                        {{ date.slice(0, 10) }}: {{ i % 2 == 0 ? 'joined' : 'left' }}
                    </li>
                </ul>
            </div>
        </div>
        <div v-if="natDuration.length" class="col-sm-6">
            <p class="text-shadow mb-2 min-spacing">
                NAT: {{ calculateDuration('nat') }}
            </p>
            <div class="text-shadow">
                <ul>
                    <li v-for="(date, i) in natDuration" :key="date" class="small">
                        {{ date.slice(0, 10) }}: {{ i % 2 == 0 ? 'joined' : 'left' }}
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>

export default {
    name: 'Duration',
    props: {
        bnDuration: Array,
        natDuration: Array,
    },
    methods: {
        calculateDuration(group) {
            let dateArray = group == 'bn' ? this.bnDuration : this.natDuration;
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