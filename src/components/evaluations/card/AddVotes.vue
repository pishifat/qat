<template>
    <div>
        <span
            v-if="pass"
            class="badge badge-pass mx-1"
        >
            {{ pass }}
        </span>

        <span
            v-if="neutral"
            class="badge badge-light mx-1"
        >
            {{ neutral }}
        </span>

        <span
            v-if="fail"
            class="badge badge-fail mx-1"
        >
            {{ fail }}
        </span>
    </div>
</template>

<script>
export default {
    name: 'AddVotes',
    props: {
        reviews: {
            type: Array,
            default() {
                return [];
            },
        },
    },
    data() {
        return {
            pass: 0,
            neutral: 0,
            fail: 0,
            isSelected: false,
        };
    },
    watch: {
        reviews() {
            this.addVotes();
        },
    },
    mounted() {
        this.addVotes();
    },
    methods: {
        addVotes() {
            this.pass = 0;
            this.neutral = 0;
            this.fail = 0;
            this.reviews.forEach(review => {
                if (review.vote == 1) {
                    this.pass++;
                } else if (review.vote == 2) {
                    this.neutral++;
                } else if (review.vote == 3) {
                    this.fail++;
                }
            });
        },
    },
};
</script>