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
    name: 'test-results',
    props: {
        testScore: Number,
        osuId: Number,
    },
    data() {
        return {
            previousEvaluations: null,
        };
    },
    methods: {
        scoreColor(){
            if(this.testScore > 15){
                return 'vote-pass';
            }else if(this.testScore > 12.5){
                return 'vote-extend';
            }else{
                return 'vote-fail'
            }
        }
    },
};
</script>