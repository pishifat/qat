<template>
<div v-if="testList">
    <div v-if="!test">
        <select class="custom-select" v-model="selectedTest">
            <option v-for="pendingTest in testList" :key="pendingTest.id" :value="pendingTest.id">{{ pendingTest.mode }}</option>
        </select>
        <button class="btn btn-sm btn-qat" @click="loadTest($event)">Start / Continue</button>
        <p class="text-danger">{{ info }}</p>
    </div>

    <div v-if="test">
        <p class="text-center">
            User: {{ test.applicant.username }} - 
            Mode: {{ test.mode }} - 
            Time remaining: 
                <span 
                    v-if="timeRemaining" 
                    :class="(timeRemaining < 5 ? 'text-danger' : timeRemaining < 30 ? 'text-warning' : '')"
                >
                    {{ timeRemaining }} minutes
                </span>
        </p>

        <div v-for="(answer, i) in test.answers" :key="answer.id">
            <h3>Q{{ ++i }}: {{ answer.question.content }} - {{ answer.question.category }}</h3>
            <div v-for="option in getActiveOptions(answer.question.options)" :key="option.id">
                <div class="form-check mb-2" v-if="answer.question.questionType === 'text' || answer.question.questionType === 'image'">
                    <input class="form-check-input" type="checkbox" value="">
                    <label class="form-check-label" v-if="answer.question.questionType === 'text'">
                        {{ option.content }}
                    </label>
                    <img :src="option.content" v-if="answer.question.questionType === 'image'">
                </div>
                <div class="mb-2" v-else>
                    <label>{{ option.content }}</label>
                    <input class="form-control" type="text" >
                </div>
            </div>
        </div>
        <hr>
        <button type="submit" class="btn btn-lg btn-qat" @click="submit($event)">Submit</button>
    </div>
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
        };
    },
    methods: {
        // getCategories: function () {
        //     this.test.answers.filter(a => {
        //         a.question.category == 
        //     });
        // },
        getActiveOptions: function (options) {
            return options.filter(o => o.active);
        },
        loadTest: async function (e) {
            if (this.selectedTest) {
                const test = await this.executePost('/qat/testSubmission/loadTest', { testId: this.selectedTest }, e);
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
            setInterval(() => {
                this.timeRemaining = new Date(timeLimit - Date.now()).getMinutes();
            }, 1000);
        },
        submit: async function (e) {
            const res = await this.executePost('/qat/testSubmission/submit', { testId: this.selectedTest }, e);
            if (res) {
                if (res.error) this.info = res.error;
                else this.info = 'Test submitted'
            }
        }
    },
    created() {
        axios
            .get('/qat/testSubmission/tests')
            .then(response => {
                this.testList = response.data.testList;
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
</style>
