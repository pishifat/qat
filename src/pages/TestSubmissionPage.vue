<template>
<div v-if="testList">
    <div v-if="!test">
        <small>
            <select class="custom-select inline-custom-select" v-model="selectedTest">
                <option v-for="pendingTest in testList" :key="pendingTest.id" :value="pendingTest.id">{{ pendingTest.mode }}</option>
            </select>
        </small>
        <button class="btn btn-sm btn-nat" @click="loadTest($event)">Start / Continue</button>
        <p class="text-danger">{{ info }}</p>
    </div>

    <div v-if="test" id="fullTest">
        <div class="segment segment-solid test-question">
            <p>this is the test</p>
            <p>take it, then u become bn!</p>
        </div>
        
        <p class="text-center segment">
            User: {{ test.applicant.username }} - 
            Mode: {{ test.mode }}<!-- - 
            Time remaining: 
                <span 
                    v-if="timeRemaining" 
                    :class="(timeRemaining < 5 ? 'text-danger' : timeRemaining < 30 ? 'text-warning' : '')"
                >
                    {{ timeRemaining }} minutes
                </span>-->
        </p>

        <div class="segment test-question" v-for="(answer, i) in test.answers" :key="answer.id">
            <small class="float-right">Q{{ ++i }} -- {{ answer.question.category }}</small>
            <div v-if="answer.question.questionType === 'text' || answer.question.questionType === 'image'">
                <h5 style="width: 90%">{{ answer.question.content }}</h5>
                <div v-for="option in getActiveOptions(answer.question.options)" :key="option.id">
                    <div class="form-check mb-2 ml-2" v-if="answer.question.questionType === 'text' || answer.question.questionType === 'image'">
                        <input class="form-check-input" type="checkbox" :value="option.id" :id="option.id">
                        <label class="form-check-label" v-if="answer.question.questionType === 'text'" :for="option.id">
                            {{ option.content }}
                        </label>
                        <label :for="option.id"><img :src="option.content" v-if="answer.question.questionType === 'image'" class="test-image"></label>
                    </div>
                </div>
            </div>

            <div v-else>
                <h5>Find the correct metadata of the following song (based on the current standards described in the Ranking Criteria) 
                    and provide a reliable source or links.</h5>
                <h5 class="pl-4"><a :href="answer.question.content" target="_blank">{{ answer.question.content }}</a></h5>
                <div class="mb-2"> <!-- only metadata questions for now -->
                    <input id="title" class="form-control" type="text" placeholder="Title...">
                    <input id="titleUnicode" class="form-control" type="text" placeholder="Unicode Title (if same as Title, copy that here)...">
                    <input id="artist" class="form-control" type="text" placeholder="Artist...">
                    <input id="artistUnicode" class="form-control" type="text" placeholder="Unicode Artist (if same as Artist, copy that here)...">
                    <input id="source" class="form-control" type="text" placeholder="Source (if unclear or non-existent, leave empty)...">
                    <small class="pl-4">Link sources for the song information (only one link is necessary, but more could help you!):</small>
                    <input id="reference1" class="form-control" type="text" placeholder="Reference 1">
                    <input id="reference2" class="form-control" type="text" placeholder="Reference 2">
                    <input id="reference3" class="form-control" type="text" placeholder="Reference 3">
                </div>
            </div>
            
        </div>
        <hr>
        <div class="mx-auto text-center mb-4">
            <a href="#top"><button type="submit" class="btn btn-lg btn-nat" @click="submit($event)">Submit</button></a>
            <p class="small pt-2">{{ info }}</p>
        </div>
    </div>
</div>
<div v-else>
    <div v-if="displayScore || displayScore == 0" class="segment">
        <p>Your test has been submitted! Your score is {{displayScore}}/20, but that may change when someone manually reviews your score.</p>
    </div>
    <p v-else class="text-center">Nothing to see here...</p>
</div>
</template>

<script>
import postData from '../mixins/postData.js';

export default {
    name: 'test-submission-page',
    mixins: [ postData ],
    data() {
        return {
            testList: null,
            selectedTest: null,
            test: null,
            info: null,
            timeRemaining: null,
            displayScore: null,
        };
    },
    methods: {
        // getCategories: function () {
        //     this.test.answers.filter(a => {
        //         a.question.category == 
        //     });
        // },
        getActiveOptions: function (options) {
            var currentIndex = options.length, temporaryValue, randomIndex;
            while (0 !== currentIndex) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;
                temporaryValue = options[currentIndex];
                options[currentIndex] = options[randomIndex];
                options[randomIndex] = temporaryValue;
            }
            return options.filter(o => o.active);
        },
        loadTest: async function (e) {
            if (this.selectedTest) {
                const test = await this.executePost('/nat/testSubmission/loadTest', { testId: this.selectedTest }, e);
                if (test) {
                    if (test.error) this.info = test.error;
                    this.test = test;
                }
            } else {
                this.info = 'Select the test to answer';
            }

            let startTime = new Date(this.test.startedAt);
            let timeLimit = new Date(this.test.startedAt);
            timeLimit.setHours(startTime.getHours() + 1);
            /*setInterval(() => {
                this.timeRemaining = new Date(timeLimit - Date.now()).getMinutes();
            }, 1000);*/
        },
        submit: async function (e) {
            this.info = 'Submitting... (this can take a few seconds)'
            let title = $('#title').val();
            let titleUnicode = $('#titleUnicode').val();
            let artist = $('#artist').val();
            let artistUnicode = $('#artistUnicode').val();
            let source = $('#source').val();
            let reference1 = $('#reference1').val();
            let reference2 = $('#reference2').val();
            let reference3 = $('#reference3').val();
            let checkedOptions = [];
            $("input:checked").each( function () {
                checkedOptions.push( $(this).val() );
            });
            $('.test-question').hide();
            const res = await this.executePost('/nat/testSubmission/submit', { 
                testId: this.selectedTest, checkedOptions: checkedOptions,
                title: title, titleUnicode: titleUnicode,
                artist: artist, artistUnicode: artistUnicode,
                source: source, reference1: reference1, reference2: reference2, reference3: reference3
            }, e);
            if (res || res == 0) {
                if (res.error) this.info = res.error;
                else{
                    this.selectedTest = null;
                    this.testList = null;
                    this.displayScore = res;
                }
            }
        }
    },
    created() {
        axios
            .get('/nat/testSubmission/tests')
            .then(async response => {
                if(response.data.testList){
                    this.testList = response.data.testList;
                    this.selectedTest = this.testList[0].id;
                    if(this.testList.length == 1){
                        await this.loadTest();
                    }
                }
            })
            .then(function() {
                $('#loading').fadeOut();
                $('#main')
                    .attr('style', 'visibility: visible')
                    .hide()
                    .fadeIn();
            });
    },
};
</script>

<style>

.test-image {
    border-radius: 5px 5px 5px 5px;
    -o-object-fit: contain;
    object-fit: contain;
    max-width: 500px;
    max-height: 500px;
}
</style>
