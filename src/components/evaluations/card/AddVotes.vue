<template>
    <div>
        <span
            v-if="pass"
            class="badge badge-pass mx-1"
            data-toggle="tooltip"
            data-placement="top"
            title="pass"
        >{{ pass }}</span>
        <span
            v-if="neutralOrExtend"
            class="badge badge-neutral mx-1"
            data-toggle="tooltip"
            data-placement="top"
            :title="isApplication ? 'neutral' : 'extend'"
        >{{ neutralOrExtend }}</span>
        <span
            v-if="fail"
            class="badge badge-fail mx-1"
            data-toggle="tooltip"
            data-placement="top"
            title="fail"
        >{{ fail }}</span>
    </div>
</template>

<script>
export default {
    name: 'add-votes',
    props: {
        evaluations: Array,
        isApplication: Boolean,
    },
    mounted() {
        this.addVotes();
    },
    watch: {
        evaluations() {
            this.addVotes();
        },
    },
    data() {
        return {
            pass: 0,
            neutralOrExtend: 0,
            fail: 0,
            isSelected: false,
        };
    },
    methods: {
        addVotes() {
            this.pass = 0;
            this.neutralOrExtend = 0;
            this.fail = 0;
            this.evaluations.forEach(evaluation => {
                if (evaluation.vote == 1) {
                    this.pass++;
                } else if (evaluation.vote == 2) {
                    this.neutralOrExtend++;
                } else if (evaluation.vote == 3) {
                    this.fail++;
                }
            });
        },
    }
};
</script>
