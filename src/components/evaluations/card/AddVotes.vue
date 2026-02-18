<template>
    <span>
        <span
            v-if="positive"
            class="badge badge-pass mx-1"
        >
            {{ positive }}
        </span>

        <span
            v-if="neutral"
            class="badge bg-light mx-1"
        >
            {{ neutral }}
        </span>

        <span
            v-if="negative"
            class="badge badge-fail mx-1"
        >
            {{ negative }}
        </span>
    </span>
</template>

<script>
export default {
    name: 'AddVotes',
    props: {
        inputs: {
            type: Array,
            default() {
                return [];
            },
        },
    },
    data() {
        return {
            positive: 0,
            neutral: 0,
            negative: 0,
        };
    },
    watch: {
        inputs() {
            this.addVotes();
        },
    },
    mounted() {
        this.addVotes();
    },
    methods: {
        addVotes() {
            this.positive = 0;
            this.neutral = 0;
            this.negative = 0;
            this.inputs.forEach(input => {
                if (input.vote == 1) {
                    this.positive++;
                } else if (input.vote == 2) {
                    this.neutral++;
                } else if (input.vote == 3) {
                    this.negative++;
                }
            });
        },
    },
};
</script>