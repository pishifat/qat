<template>

<div class='col-md-4 my-2' @click="selectTest()">
    <div class="card" style="height: 100%">   
        <div class='card-body user-card-spacing'>
            <a :href="'https://osu.ppy.sh/users/' + selectedTest.applicant.osuId"
                class="text-shadow" target="_blank" @click.stop>{{selectedTest.applicant.username}}</a>
                <i v-if="selectedTest.mode == 'osu'" class="far fa-circle"></i>
                <i v-else-if="selectedTest.mode == 'taiko'" class="fas fa-drum"></i>
                <i v-else-if="selectedTest.mode == 'catch'" class="fas fa-apple-alt"></i>
                <i v-else-if="selectedTest.mode == 'mania'" class="fas fa-stream"></i>
            <p class="small ml-1 text-shadow">Score: {{calculateTotalScore()}}/20</p>
            <p class="small ml-1 text-shadow">Application date: {{selectedTest.createdAt.slice(0,10)}}</p>
            
        </div>
    </div>
</div>

</template>

<script>
export default {
    name: 'result-card',
    props: ['selected-test'],
    methods: {
        selectTest: function () {
            this.$emit('update:selected-test', this.selectedTest)
        },
        calculateTotalScore: function() {
            let displayScore = 0;
            this.selectedTest.answers.forEach(answer => {
                answer.optionsChosen.forEach(option => {
                    displayScore += option.score;
                });
            });
            return Math.round(displayScore*10)/10;
        },
    }
}
</script>

<style>
    .avatar-mini-thumb{
        height:40px;
        width:40px;
        object-fit:cover;
        filter: drop-shadow(1px 1px 1px #000000);
    }

    .pseudo-float-right-avatar{
        position:absolute;
        top:0.5rem;
        right:0.75rem;
    }

    .user-card-spacing{
        margin: 0;
        padding: 0.5rem 0.5rem 0.5rem 0.5rem;
    }

</style>
