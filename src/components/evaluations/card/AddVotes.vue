<template>
    <div>
        <span
            v-if="pass"
            class="badge badge-pass mx-1"
            data-toggle="tooltip"
            data-placement="top"
            title="pass"
        >
            {{ pass }}
        </span>

        <span
            v-if="neutralOrProbation"
            class="badge badge-light mx-1"
            data-toggle="tooltip"
            data-placement="top"
            :title="isApplication ? 'neutral' : 'probation'"
        >
            {{ neutralOrProbation }}
        </span>

        <span
            v-if="fail"
            class="badge badge-fail mx-1"
            data-toggle="tooltip"
            data-placement="top"
            title="fail"
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
        isApplication: Boolean,
    },
    data() {
        return {
            pass: 0,
            neutralOrProbation: 0,
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
            this.neutralOrProbation = 0;
            this.fail = 0;
            this.reviews.forEach(review => {
                if (review.vote == 1) {
                    this.pass++;
                } else if (review.vote == 2) {
                    this.neutralOrProbation++;
                } else if (review.vote == 3) {
                    this.fail++;
                }
            });
        },
    },
};
</script>