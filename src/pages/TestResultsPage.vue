<template>
    <div class="row">
        <section v-if="isNat" class="col-md-12 mb-4 segment">
            <div class="input-group input-group-sm">
                <input
                    v-model="searchValue"
                    type="text"
                    placeholder="username..."
                    maxlength="18"
                    autocomplete="off"
                    @keyup.enter="query($event)"
                >
                <button class="btn btn-nat ml-2" type="submit" @click="query($event)">
                    Search tests
                </button>
                <span v-if="info" class="errors ml-4 mt-2">Error: {{ info }}</span>
            </div>
        </section>

        <section v-if="allTests" class="col-md-12 segment segment-image">
            <transition-group name="list" tag="div" class="row">
                <result-card
                    v-for="test in allTests"
                    :key="test.id"
                    :selected-test="test"
                    @update:selected-test="selectedTest = $event"
                />
            </transition-group>
            <p v-if="!allTests.length" class="text-center min-spacing">
                You have no test results saved...
            </p>
        </section>

        <section v-if="selectedTest">
            <p class="text-center segment">
                User: {{ selectedTest.applicant.username }} - Mode: {{ selectedTest.mode }} - Score:
                {{ selectedTest.totalScore + selectedTest.additionalPoints }}
            </p>

            <div v-for="(answer, i) in selectedTest.answers" :key="answer.id" class="segment segment-image">
                <small class="float-right">
                    Q{{ ++i }} -- {{ answer.question.category }}
                    <span v-if="isNat && answer.question.questionType != 'fill'"> -- total: {{ calculateQuestionScore(answer) }}</span>
                </small>
                <div
                    v-if="answer.question.questionType === 'text' || answer.question.questionType === 'image'"
                >
                    <h5 style="width: 90%">
                        {{ answer.question.content }}
                    </h5>
                    <div v-for="option in getActiveOptions(answer.question.options)" :key="option.id">
                        <div
                            v-if="
                                answer.question.questionType === 'text' ||
                                    answer.question.questionType === 'image'
                            "
                            class="form-check mb-2 ml-2"
                        >
                            <input
                                :id="option.id"
                                class="form-check-input"
                                type="checkbox"
                                :value="option.id"
                                :checked="answer.optionsChosen.indexOf(option.id) >= 0"
                            >
                            <label
                                v-if="answer.question.questionType === 'text'"
                                class="form-check-label"
                                style="width: 90%"
                                :for="option.id"
                                :class="[
                                    option.score > 0 ? 'vote-pass' : 'vote-fail',
                                    answer.optionsChosen.indexOf(option.id) >= 0 ? 'selected-answer' : '',
                                ]"
                            >
                                {{ option.content }}
                            </label>
                            <label
                                v-else
                                :for="option.id"
                                :class="
                                    answer.optionsChosen.indexOf(option.id) >= 0
                                        ? 'selected-image-answer'
                                        : ''
                                "
                            >
                                <img :src="option.content" class="test-image">
                                <span :class="option.score > 0 ? 'vote-pass' : 'vote-fail'">{{
                                    option.score > 0 ? 'Correct' : 'Incorrect'
                                }}</span>
                            </label>
                            <small v-if="isNat" class="float-right">{{ option.score }}</small>
                        </div>
                    </div>
                </div>

                <div v-else>
                    <h5>
                        Find the correct metadata of the following song (based on the current standards
                        described in the Ranking Criteria) and provide a reliable source or links.
                    </h5>
                    <h5 class="pl-4">
                        <a :href="answer.question.content" target="_blank">{{ answer.question.content }}</a>
                    </h5>
                    <div class="mb-2">
                        <small class="pl-2">
                            Romanised Title:
                        </small>
                        <input
                            id="title"
                            v-model="answer.metadataInput.title"
                            class="form-control mb-1"
                            type="text"
                            placeholder="Romanised Title..."
                        >
                        <small class="pl-2">
                            Unicode Title:
                        </small>
                        <input
                            id="titleUnicode"
                            v-model="answer.metadataInput.titleUnicode"
                            class="form-control mb-1"
                            type="text"
                            placeholder="Unicode Title (if same as Romanised Title, copy that here)..."
                        >
                        <small class="pl-2">
                            Romanised Artist:
                        </small>
                        <input
                            id="artist"
                            v-model="answer.metadataInput.artist"
                            class="form-control mb-1"
                            type="text"
                            placeholder="Romanised Artist..."
                        >
                        <small class="pl-2">
                            Unicode Artist:
                        </small>
                        <input
                            id="artistUnicode"
                            v-model="answer.metadataInput.artistUnicode"
                            class="form-control mb-1"
                            type="text"
                            placeholder="Unicode Artist (if same as Romanised Artist, copy that here)..."
                        >
                        <small class="pl-2">
                            Source:
                        </small>
                        <input
                            id="source"
                            v-model="answer.metadataInput.source"
                            class="form-control mb-2"
                            type="text"
                            placeholder="Source (if unclear or non-existent, leave empty)..."
                        >
                        <small class="pl-2">
                            References:
                        </small>
                        <input
                            id="reference1"
                            v-model="answer.metadataInput.reference1"
                            class="form-control mb-1"
                            type="text"
                            placeholder="Reference 1"
                        >
                        <input
                            id="reference2"
                            v-model="answer.metadataInput.reference2"
                            class="form-control mb-1"
                            type="text"
                            placeholder="Reference 2"
                        >
                        <input
                            id="reference3"
                            v-model="answer.metadataInput.reference3"
                            class="form-control mb-1"
                            type="text"
                            placeholder="Reference 3"
                        >
                    </div>
                    <div v-if="isNat">
                        <h5 class="mt-4">
                            Correct possibilities:
                        </h5>
                        <p
                            v-for="option in answer.question.options"
                            :key="option.id"
                            class="ml-2 min-spacing small"
                        >
                            {{ option.metadataType }}: {{ option.content }}
                        </p>
                        Add to/subtract from total score:
                        <input
                            id="score"
                            v-model="additionalPoints"
                            class="form-control-sm col-md-1 ml-1 mb-2"
                            type="text"
                            maxlength="5"
                            placeholder="points..."
                            style="min-width: 80px; width: 80;"
                        >
                        <button
                            type="submit"
                            class="btn btn-sm btn-nat mx-2"
                            @click="updateAdditionalPoints($event)"
                        >
                            Update Additional Points
                        </button>
                        <p class="ml-2 min-spacing small">
                            Each input is worth 0.5 points. Additional points are added when an answer correct, but is not listed in the question's available correct answers
                        </p>
                        <span v-if="confirm.length" class="confirm small">{{ confirm }}</span>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>



<script>
import postData from '../mixins/postData.js';
import ResultCard from '../components/rcTest/ResultCard.vue';

export default {
    name: 'TestResultsPage',
    components: {
        ResultCard,
    },
    mixins: [postData],
    data() {
        return {
            info: '',
            confirm: '',
            isNat: false,
            additionalPoints: null,
            allTests: null,
            selectedTest: null,
            selectedOptionIds: [],
            searchValue: null,
        };
    },
    watch: {
        selectedTest(v) {
            if (v) {
                this.getOptionIds();
                this.additionalPoints = this.selectedTest.additionalPoints;
                this.confirm = '';
                this.info = '';
            }
        },
    },
    created() {
        const params = new URLSearchParams(document.location.search.substring(1));
        if (params.get('user') && params.get('user').length) {
            axios
                .get(`/testResults/search/${params.get('user')}`)
                .then(response => {
                    this.isNat = response.data.isNat;
                    this.allTests = response.data.tests;
                    if (this.allTests && this.allTests.length == 1) {
                        this.selectedTest = this.allTests[0];
                    }
                })
                .then(function() {
                    $('#loading').fadeOut();
                    $('#main')
                        .attr('style', 'visibility: visible')
                        .hide()
                        .fadeIn();
                });
        } else {
            axios
                .get('/testResults/relevantInfo')
                .then(response => {
                    this.isNat = response.data.isNat;
                    this.allTests = response.data.tests;
                    if (this.allTests && this.allTests.length == 1) {
                        this.selectedTest = this.allTests[0];
                    }
                })
                .then(function() {
                    $('#loading').fadeOut();
                    $('#main')
                        .attr('style', 'visibility: visible')
                        .hide()
                        .fadeIn();
                });
        }
    },
    methods: {
        calculateTotalScore() {
            let displayScore = 0;
            this.selectedTest.answers.forEach(answer => {
                answer.optionsChosen.forEach(option => {
                    displayScore += option.score;
                });
            });
            return Math.round(displayScore * 10) / 10;
        },
        calculateQuestionScore(answer) {
            let score = 0;
            answer.question.options.forEach(option => {
                if(answer.optionsChosen.indexOf(option.id) >= 0){
                    score += option.score;
                }
            });
            if(score < 0) score = 0;
            return score;
        },
        getActiveOptions(options) {
            return options.filter(o => o.active);
        },
        getOptionIds() {
            this.selectedOptionIds = [];
            this.selectedTest.answers.forEach(answer => {
                answer.optionsChosen.forEach(option => {
                    this.selectedOptionIds.push(option.id);
                });
            });
        },
        async query(e) {
            this.allTests = null;
            this.selectedTest = null;
            this.info = '';
            let user = this.searchValue;
            if (!user || !user.length) {
                this.info = 'Must enter a username or ID!';
            } else {
                history.pushState(null, 'Ranking Criteria Test Results', `/testresults?user=${user}`);
                const result = await this.executeGet(`/testResults/search/${user}`, e);
                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.allTests = result.tests;
                        if (this.allTests.length == 1) {
                            this.selectedTest = result[0];
                        }
                    }
                }
            }
        },
        async updateAdditionalPoints(e) {
            let points = parseFloat(this.additionalPoints);
            if (points || points == 0) {
                const result = await this.executePost(
                    '/testResults/updateAdditionalPoints/' + this.selectedTest.id,
                    { points },
                    e
                );
                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.updateTest(result);
                        this.confirm = points + ' point(s) added';
                    }
                }
            }
        },
        updateTest(t) {
            const i = this.allTests.findIndex(test => test.id == t.id);
            this.allTests[i] = t;
            this.selectedTest = t;
        },
    },
};
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