<template>
    <div>
        <p class="text-shadow">
            Test results:
            <a
                :href="`http://bn.mappersguild.com/testresults?user=${osuId}`"
                target="_blank"
                :class="scoreColor()"
            >
                {{ testScore + '/20' }}
            </a>
        </p>
    </div>
</template>

<script>
export default {
    name: 'TestResults',
    props: {
        testScore: {
            type: Number,
            default: 0,
        },
        osuId: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {
            previousEvaluations: null,
        };
    },
    methods: {
        scoreColor() {
            if (this.testScore > 15) {
                return 'vote-green';
            } else if (this.testScore > 12.5) {
                return 'vote-yellow';
            } else {
                return 'vote-red';
            }
        },
    },
};
</script>