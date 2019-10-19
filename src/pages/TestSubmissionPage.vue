<template>
    <div v-if="testList">
        <div v-if="!test">
            <small>
                <select v-model="selectedTest" class="custom-select">
                    <option v-for="pendingTest in testList" :key="pendingTest.id" :value="pendingTest.id">{{ pendingTest.mode }}</option>
                </select>
            </small>
            <button class="btn btn-sm btn-nat" @click="loadTest($event)">
                Start / Continue
            </button>
            <p class="text-danger">
                {{ info }}
            </p>
        </div>

        <div v-if="test" id="fullTest">
            <div class="segment segment-image test-question">
                <p>
                    The purpose of this test is to show your understanding of the 
                    <a href="https://osu.ppy.sh/wiki/Ranking_Criteria" target="_blank">Ranking Criteria</a>, the 
                    <a href="https://osu.ppy.sh/help/wiki/People/Beatmap_Nominators/Rules" target="_blank">Beatmap Nominator Rules</a>, and the 
                    <a href="https://osu.ppy.sh/help/wiki/Ranking_Criteria/Code_of_Conduct" target="_blank">Code of Conduct</a>.
                </p>
                <p>Feel free to reference those pages while taking this test. Maybe you'll learn something you didn't already know, which will make you more prepared than you would be otherwise!</p>
                <br>
                <p>There are 20 questions total, all of which require you to select all applicable answers. Categories of questions are listed in the upper right for you to reference on their respective wiki pages.</p>
                <p>The test has no time limit. If you close this page, your answers will not be saved, however you can still take the test at a later time.</p>
                <p>After submitting your answers, you will see a score out of 20 possible points. When your application is fully evaluated, you will be able to view which questions you answered correctly/incorrectly.</p>
                <p class="min-spacing">
                    Good luck!
                </p>
            </div>

            <hr>
        
            <p class="text-center segment">
                User: {{ test.applicant.username }} - 
                Mode: {{ test.mode }}
            </p>

            <div v-if="!test.answers.length">
                <p>Something went wrong and your test was not generated. Contact <a href="https://osu.ppy.sh/users/3178418" target="_blank">pishifat</a> to fix this.</p>
            </div>

        

            <div v-for="(answer, i) in test.answers" :key="answer.id" class="segment segment-image test-question">
                <small class="float-right">Q{{ ++i }} -- {{ answer.question.category }}</small>
                <div>
                    <h5 style="width: 90%">
                        {{ answer.question.content }}
                    </h5>
                    <div v-for="option in answer.question.options" :key="option.id">
                        <div class="form-check mb-2 ml-2">
                            <input 
                                :id="option.id" 
                                v-model="checkedOptions[answer.id]" 
                                :checked="checkedOptions[answer.id].includes(answer.id)"
                                :value="option.id"
                                class="form-check-input"
                                type="checkbox"
                                @change="submitAnswer(answer.id, $event)"
                            >
                            <label class="form-check-label" :for="option.id">
                                <img v-if="answer.question.questionType === 'image'" :src="option.content" class="test-image">
                                <span v-if="answer.question.questionType === 'text'">{{ option.content }}</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            <hr>
            <div class="segment segment-image">
                <p class="small min-spacing mb-1">If you have anything to say to the NAT members evaluating your application, write it here! (optional): </p>
                <input v-model="comment" class="form-control mb-4" type="text" maxlength="1000" placeholder="comment...">
                <div class="mx-auto text-center">
                    <a href="#top"><button type="submit" class="btn btn-lg btn-nat w-50" @click="submitTest($event)">Submit</button></a>
                    <p class="small pt-2">
                        {{ info }}
                    </p>
                </div>
            </div>
            
        </div>
    </div>
    <div v-else>
        <div v-if="displayScore || displayScore == 0" class="segment segment-solid">
            <p class="small">
                If you see nonsense below this line, you'll need to visit the <a href="http://bn.mappersguild.com/bnapps">BN Application page</a> and re-submit your test. Sorry!
            </p>
            <p>Your test has been submitted! Your score is {{ displayScore }}/20, but that may change when someone manually reviews your score.</p>
        </div>
        <p v-else class="text-center">
            You have no pending test...
        </p>
    </div>
</template>

<script>
import postData from '../mixins/postData.js';

export default {
    name: 'TestSubmissionPage',
    mixins: [ postData ],
    data() {
        return {
            testList: null,
            selectedTest: null,
            test: null,
            info: null,
            timeRemaining: null,
            displayScore: null,
            checkedOptions: {},
            comment: '',
        };
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
    methods: {
        getActiveOptions (options) {
            let currentIndex = options.length;
            let temporaryValue, randomIndex;
            while (0 !== currentIndex) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;
                temporaryValue = options[currentIndex];
                options[currentIndex] = options[randomIndex];
                options[randomIndex] = temporaryValue;
            }
            return options.filter(o => o.active);
        },
        async loadTest (e) {
            if (this.selectedTest) {
                const test = await this.executePost('/testSubmission/loadTest', { testId: this.selectedTest }, e);
                
                if (test) {
                    if (test.error) this.info = test.error;

                    test.answers.forEach(a => {
                        this.checkedOptions[a.id] = a.optionsChosen;

                        a.question.options = this.getActiveOptions(a.question.options);
                    });
                    this.test = test;
                }
            } else {
                this.info = 'Select the test to answer';
            }
        },
        async submitTest (e) {
            this.info = 'Submitting... (this will take a few seconds)';
            $('.test-question').hide();
            const res = await this.executePost('/testSubmission/submitTest', { 
                testId: this.selectedTest,
                comment: this.comment
            }, e);
            if (res || res == 0) {
                if (res.error) {
                    this.info = res.error;
                    this.loadTest();
                    $('.test-question').show();
                } else {
                    this.selectedTest = null;
                    this.testList = null;
                    this.displayScore = res;
                }
            }
        },
        async submitAnswer (answerId, e) {
            const res = await this.executePost('/testSubmission/submitAnswer', { 
                testId: this.selectedTest, 
                answerId,
                checkedOptions: this.checkedOptions[answerId],
            }, e);
            if (res) {
                if (res.error) {
                    this.loadTest();
                    this.info = res.error;
                }
            }
        },
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
