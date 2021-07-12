<template>
    <div>
        <div v-if="testList">
            <section v-if="!test" class="card card-body">
                <select
                    v-model="selectedTest"
                    class="form-control mb-1"
                >
                    <option
                        v-for="pendingTest in testList"
                        :key="pendingTest.id"
                        :value="pendingTest.id"
                    >
                        {{ pendingTest.mode }}
                    </option>
                </select>

                <button class="btn btn-block btn-primary" @click="loadTest($event)">
                    Start / Continue
                </button>
            </section>

            <div v-if="test" id="fullTest">
                <section v-if="!isSubmitting" class="card card-body">
                    <p>
                        The purpose of this test is to show your understanding of the
                        <a href="https://osu.ppy.sh/wiki/Ranking_Criteria" target="_blank">Ranking Criteria</a>, the
                        <a href="https://osu.ppy.sh/help/wiki/People/Beatmap_Nominators/Rules" target="_blank">Beatmap Nominator Rules</a>, and the
                        <a href="https://osu.ppy.sh/help/wiki/Ranking_Criteria/Code_of_Conduct" target="_blank">Code of Conduct</a>.
                    </p>
                    <p>Feel free to reference those pages while taking this test. Maybe you'll learn something you didn't already know, which will make you more prepared than you would be otherwise!</p>
                    <br>
                    <p>There are 20 questions total, all of which require you to select all applicable answers. Categories of questions are listed in the upper right for you to reference on their respective wiki pages.</p>
                    <p>The test has no time limit. If you close this page, your answers will be saved to continue at another time.</p>
                    <p>After submitting your answers, you will see a score out of 20 possible points. When your application is fully evaluated, you will be able to view which questions you answered correctly/incorrectly.</p>
                    <br>
                    Good luck!
                </section>

                <section class="card card-body text-center">
                    <div>
                        <b>User:</b> {{ test.applicant.username }} -
                        <b>Mode:</b> {{ test.mode }}
                    </div>

                    <div v-if="!test.answers.length">
                        Something went wrong and your test was not generated. Contact <a href="https://osu.ppy.sh/users/3178418" target="_blank">pishifat</a> to fix this.
                    </div>
                </section>

                <template v-if="!isSubmitting">
                    <section v-for="(answer, i) in test.answers" :key="answer.id" class="card card-body">
                        <div class="form-inline mb-2">
                            <h5>
                                {{ answer.question.content }}
                            </h5>

                            <div class="small ml-0 mr-2 ml-lg-auto order-first order-lg-last">
                                Q{{ ++i }} -- {{ answer.question.category }}
                            </div>
                        </div>

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
                    </section>

                    <section class="card card-body">
                        <p class="mb-1">
                            If you have anything to say to the NAT members evaluating your application, write it here! (optional):
                        </p>
                        <input
                            v-model="comment"
                            class="form-control"
                            type="text"
                            maxlength="1000"
                            placeholder="comment..."
                        >

                        <hr>

                        <a href="#top" class="btn btn-lg btn-primary btn-block" @click="submitTest($event)">Submit</a>
                    </section>
                </template>
            </div>
        </div>

        <div v-else class="card card-body">
            <div v-if="displayScore || displayScore == 0">
                <p class="small">
                    If you see nonsense below this line, you'll need to visit the
                    <router-link to="/bnapps">
                        BN Application page
                    </router-link>
                    and re-submit your test. Sorry!
                </p>

                <p>Your test has been submitted! Your score is <b>{{ displayScore }}/20.</b></p>
                <p v-if="displayScore < 12.5 && isOsu">
                    Due to poor test results, we feel you need to brush up on your general knowledge before being able to apply for the BNG. Since you failed due to your test results and not your modding itself, you may apply again 1 month from now.
                </p>
            </div>
            <div v-else class="text-center">
                You have no pending test...
            </div>
        </div>

        <toast-messages />
    </div>
</template>

<script>
import ToastMessages from '../components/ToastMessages.vue';

export default {
    name: 'TestSubmissionPage',
    components: {
        ToastMessages,
    },
    data() {
        return {
            testList: null,
            selectedTest: null,
            test: null,
            timeRemaining: null,
            displayScore: null,
            isOsu: false,
            checkedOptions: {},
            comment: '',
            isSubmitting: false,
        };
    },
    async created() {
        const data = await this.$http.initialRequest('/testSubmission/tests');

        if (data && data.testList && data.testList.length) {
            this.testList = data.testList;
            this.selectedTest = this.testList[0].id;

            if (this.testList.length == 1) {
                await this.loadTest();
            }
        }
    },
    methods: {
        randomSort (options) {
            let currentIndex = options.length;
            let temporaryValue, randomIndex;

            while (0 !== currentIndex) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;
                temporaryValue = options[currentIndex];
                options[currentIndex] = options[randomIndex];
                options[randomIndex] = temporaryValue;
            }

            return options;
        },
        async loadTest (e) {
            if (this.selectedTest) {
                const data = await this.$http.executeGet(`/testSubmission/tests/${this.selectedTest}`, e);

                if (data.test && !data.error) {
                    data.test.answers.forEach(a => {
                        this.checkedOptions[a.id] = a.optionsChosen;

                        a.question.options = this.randomSort(a.question.options);
                    });
                    this.test = data.test;
                }
            } else {
                this.$store.dispatch('updateToastMessages', {
                    message: `Select a test to answer!`,
                    type: 'danger',
                });
            }
        },
        async submitTest (e) {
            this.$store.dispatch('updateToastMessages', {
                message: `Submitting... (this will take a few seconds)`,
                type: 'info',
            });
            this.isSubmitting = true;
            const data = await this.$http.executePost('/testSubmission/submitTest', {
                testId: this.selectedTest,
                comment: this.comment,
            }, e);

            if (data.totalScore != undefined) {
                this.selectedTest = null;
                this.testList = null;
                this.displayScore = data.totalScore;
                this.isOsu = data.isOsu;
            } else {
                this.loadTest();
                this.isSubmitting = false;
            }
        },
        async submitAnswer (answerId, e) {
            const data = await this.$http.executePost('/testSubmission/submitAnswer', {
                testId: this.selectedTest,
                answerId,
                checkedOptions: this.checkedOptions[answerId],
            }, e);

            // Reload just in case of error
            if (!this.$http.isValid(data)) {
                this.loadTest();
            }
        },
    },
};
</script>
