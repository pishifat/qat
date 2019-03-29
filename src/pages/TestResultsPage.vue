<template>

<div class="row">
   <div class="col-md-12 mb-4">
       <div class="col-md-4 input-group input-group-sm mb-3">
            <input class="form-control form-control-sm" type="text" placeholder="username" id="search" 
                style="filter: drop-shadow(1px 1px 1px #000000); border-radius: 100px 0 0 100px" 
                @keyup.enter="query($event)" maxlength="18"/>
            <div class="input-group-append">
                <button style="border-radius: 0 100px 100px 0;" class="btn btn-nat" @click="query($event)" type="submit">Search tests</button>
            </div>
        </div>
        <p class="errors">{{info}}</p> 
    </div>

    <div class="col-md-12" v-if="allTests">
        <transition-group name="list" tag="div" class="row">
            <result-card
                v-for="test in allTests"
                :key="test.id"
                :selected-test="test"
                @update:selected-test="selectedTest = $event"
            ></result-card>
        </transition-group>
        <hr>
    </div>

    <div v-if="selectedTest">
        <p class="text-center">
            User: {{ selectedTest.applicant.username }} - 
            Mode: {{ selectedTest.mode }} - 
            Score: {{ selectedTest.totalScore }}
        </p>

        <div class="segment" v-for="(answer, i) in selectedTest.answers" :key="answer.id">
            <small class="float-right">Q{{ ++i }} -- {{ answer.question.category }}</small>
            <div v-if="answer.question.questionType === 'text' || answer.question.questionType === 'image'">
                <h5 style="width: 90%">{{ answer.question.content }}</h5>
                <div v-for="option in getActiveOptions(answer.question.options)" :key="option.id">
                    <div class="form-check mb-2 ml-2" v-if="answer.question.questionType === 'text' || answer.question.questionType === 'image'">
                        <input class="form-check-input" type="checkbox" :value="option.id" :id="option.id" :checked="answer.optionsChosen.indexOf(option.id) >= 0"> 
                        <label class="form-check-label" 
                            :class="answer.optionsChosen.indexOf(option.id) >= 0 && option.score > 0 ? 'vote-pass' : answer.optionsChosen.indexOf(option.id) >= 0 ? 'vote-fail' : ''" 
                            v-if="answer.question.questionType === 'text'" :for="option.id">
                            {{ option.content }}
                        </label>
                        <label :for="option.id"><img :src="option.content" v-if="answer.question.questionType === 'image'" class="test-image"></label>
                        <small class="float-right">{{ option.score }}</small>
                    </div>
                </div>
            </div>

            <div v-else>
                <h5>Find the correct metadata of the following song (based on the current standards described in the Ranking Criteria) 
                    and provide a reliable source or links.</h5>
                <h5 class="pl-4"><a :href="answer.question.content" target="_blank">{{ answer.question.content }}</a></h5>
                <div class="mb-2"> <!-- only metadata questions for now -->
                    <input id="title" class="form-control" type="text" placeholder="Title..." v-model="answer.metadataInput.title">
                    <input id="titleUnicode" class="form-control" type="text" placeholder="Unicode Title (if same as Title, copy that here)..." v-model="answer.metadataInput.titleUnicode">
                    <input id="artist" class="form-control" type="text" placeholder="Artist..." v-model="answer.metadataInput.artist">
                    <input id="artistUnicode" class="form-control" type="text" placeholder="Unicode Artist (if same as Artist, copy that here)..." v-model="answer.metadataInput.artistUnicode">
                    <input id="source" class="form-control" type="text" placeholder="Source (if unclear or non-existent, leave empty)..." v-model="answer.metadataInput.source">
                    <small class="pl-4">Link sources for the song information (only one link is necessary, but more could help you!):</small>
                    <input id="reference1" class="form-control" type="text" placeholder="Reference 1" v-model="answer.metadataInput.reference1">
                    <input id="reference2" class="form-control" type="text" placeholder="Reference 2" v-model="answer.metadataInput.reference2">
                    <input id="reference3" class="form-control" type="text" placeholder="Reference 3" v-model="answer.metadataInput.reference3">
                </div>
            </div>
        </div>
        <hr>
    </div>


</div>

</template>



<script>
import postData from '../mixins/postData.js';
import ResultCard from '../components/rcTest/ResultCard.vue';

export default {
    name: 'test-results-page',
    components: {
        ResultCard
    },
    mixins: [postData],
    watch: {
        selectedTest: function(v) {
            if(v){
                this.getOptionIds();
            }
        }
    },
    methods: {
        calculateTotalScore: function() {
            let displayScore = 0;
            this.selectedTest.answers.forEach(answer => {
                answer.optionsChosen.forEach(option => {
                    displayScore += option.score;
                });
            });
            return Math.round(displayScore*10)/10;
        },
        getActiveOptions: function (options) {
            return options.filter(o => o.active);
        },
        getOptionIds: function() {
            this.selectedOptionIds = [];
            this.selectedTest.answers.forEach(answer => {
                answer.optionsChosen.forEach(option => {
                    this.selectedOptionIds.push(option.id);
                });
            });
        },
        query: async function(e) {
            this.allTests = null;
            this.selectedTest = null;
            this.info = '';
            let username = $('#search').val();
            if(!username || !username.length){
                this.info = "Must enter a username!"
            }else{
                const result = await this.executePost('/nat/testResults/search/', { username: username }, e);
                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.allTests = result;
                        if(this.allTests.length == 1){
                            this.selectedTest = result[0];
                        }
                    }
                }
            }
        }
    },
    data() {
        return {
            info: '',
            allTests: null,
            selectedTest: null,
            selectedOptionIds: [],
        }
    },
    created() {
        $("#loading").hide(); //this is temporary
        $("#main").attr("style", "visibility: visible");
    }
}
</script>

<style>

.option-chosen {
    font-weight: bold;
}

.test-image {
    border-radius: 5px 5px 5px 5px;
    -o-object-fit: contain;
    object-fit: contain;
    max-width: 500px;
    max-height: 500px;
}
</style>