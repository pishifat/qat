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
        <div class="segment segment-image test-question">
            <p>The purpose of this test is to show your understanding of the 
                <a href="https://osu.ppy.sh/wiki/Ranking_Criteria" target="_blank">Ranking Criteria</a>, the 
                <a href="https://osu.ppy.sh/help/wiki/People/Beatmap_Nominators/Rules" target="_blank">Beatmap Nominator Rules</a>, and the 
                <a href="https://osu.ppy.sh/help/wiki/Ranking_Criteria/Code_of_Conduct" target="_blank">Code of Conduct</a>.
            </p>
            <p>Feel free to reference those pages while taking this test. Maybe you'll learn something you didn't already know, which will make you more prepared than you would be otherwise!</p>
            <br>
            <p>There are 18 questions total, all of which require you to select all applicable answers, aside from the fill-in-the-blank metadata question. Categories of questions are listed in the upper right for you to reference on their respective wiki pages.</p>
            <p>The test has no time limit. If you close this page, your answers will not be saved, however you can still take the test at a later time.</p>
            <p>After submitting your answers, you will see a score out of 20 possible points. When your application is fully evaluated, you will be able to view which questions you answered correctly/incorrectly.</p>
            <p class="min-spacing">Good luck!</p>
        </div>

        <hr>
        
        <p class="text-center segment">
            User: {{ test.applicant.username }} - 
            Mode: {{ test.mode }}
        </p>

        <div class="segment segment-image test-question" v-for="(answer, i) in test.answers" :key="answer.id">
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
                    <input id="title" class="form-control mb-1" type="text" placeholder="Title...">
                    <input id="titleUnicode" class="form-control mb-1" type="text" placeholder="Unicode Title (if same as Title, copy that here)...">
                    <input id="artist" class="form-control mb-1" type="text" placeholder="Artist...">
                    <input id="artistUnicode" class="form-control mb-1" type="text" placeholder="Unicode Artist (if same as Artist, copy that here)...">
                    <input id="source" class="form-control mb-1" type="text" placeholder="Source (if unclear or non-existent, leave empty)...">
                    <small class="pl-4">Link sources for the song information (only one link is necessary, but more could help you!):</small>
                    <input id="reference1" class="form-control mb-1" type="text" placeholder="Reference 1">
                    <input id="reference2" class="form-control mb-1" type="text" placeholder="Reference 2">
                    <input id="reference3" class="form-control mb-1" type="text" placeholder="Reference 3">
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
    <div v-if="displayScore || displayScore == 0" class="segment segment-solid">
        <p>Your test has been submitted! Your score is {{displayScore}}/20, but that may change when someone manually reviews your score.</p>
    </div>
    <p v-else class="text-center">You have no pending test...</p>
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
                const test = await this.executePost('/testSubmission/loadTest', { testId: this.selectedTest }, e);
                if (test) {
                    if (test.error) this.info = test.error;
                    this.test = test;
                }
            } else {
                this.info = 'Select the test to answer';
            }
        },
        submit: async function (e) {
            this.info = 'Submitting... (this will take a few seconds)'
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
            const res = await this.executePost('/testSubmission/submit', { 
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
            .get('/testSubmission/tests')
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
