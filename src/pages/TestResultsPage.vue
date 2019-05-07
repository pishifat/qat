<template>
    <div class="row">
        <section class="col-md-12 mb-4 segment" v-if="isNat">
            <div class="input-group input-group-sm">
                <input
                    type="text"
                    placeholder="username..."
                    v-model="searchValue"
                    @keyup.enter="query($event)"
                    maxlength="18"
                    autocomplete="off"
                />
                <button class="btn btn-nat ml-2" @click="query($event)" type="submit">Search tests</button>
                <span v-if="info" class="errors ml-4 mt-2">Error: {{ info }}</span>
            </div>
        </section>

        <section class="col-md-12 segment segment-image" v-if="allTests">
            <transition-group name="list" tag="div" class="row">
                <result-card
                    v-for="test in allTests"
                    :key="test.id"
                    :selected-test="test"
                    @update:selected-test="selectedTest = $event"
                ></result-card>
            </transition-group>
            <p v-if="!allTests.length" class="text-center min-spacing">You have no test results saved...</p>
        </section>

        <section v-if="selectedTest">
            <p class="text-center segment">
                User: {{ selectedTest.applicant.username }} - Mode: {{ selectedTest.mode }} - Score:
                {{ selectedTest.totalScore + selectedTest.additionalPoints }}
            </p>

            <div class="segment segment-image" v-for="(answer, i) in selectedTest.answers" :key="answer.id">
                <small class="float-right">Q{{ ++i }} -- {{ answer.question.category }}</small>
                <div
                    v-if="answer.question.questionType === 'text' || answer.question.questionType === 'image'"
                >
                    <h5 style="width: 90%">{{ answer.question.content }}</h5>
                    <div v-for="option in getActiveOptions(answer.question.options)" :key="option.id">
                        <div
                            class="form-check mb-2 ml-2"
                            v-if="
                                answer.question.questionType === 'text' ||
                                    answer.question.questionType === 'image'
                            "
                        >
                            <input
                                class="form-check-input"
                                type="checkbox"
                                :value="option.id"
                                :id="option.id"
                                :checked="answer.optionsChosen.indexOf(option.id) >= 0"
                            />
                            <label
                                class="form-check-label"
                                v-if="answer.question.questionType === 'text'"
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
                                <img :src="option.content" class="test-image" />
                                <span :class="option.score > 0 ? 'vote-pass' : 'vote-fail'">{{
                                    option.score > 0 ? 'Correct' : 'Incorrect'
                                }}</span>
                            </label>
                            <small class="float-right" v-if="isNat">{{ option.score }}</small>
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
                        <!-- only metadata questions for now -->
                        <input
                            id="title"
                            class="form-control mb-1"
                            type="text"
                            placeholder="Title..."
                            v-model="answer.metadataInput.title"
                        />
                        <input
                            id="titleUnicode"
                            class="form-control mb-1"
                            type="text"
                            placeholder="Unicode Title (if same as Title, copy that here)..."
                            v-model="answer.metadataInput.titleUnicode"
                        />
                        <input
                            id="artist"
                            class="form-control mb-1"
                            type="text"
                            placeholder="Artist..."
                            v-model="answer.metadataInput.artist"
                        />
                        <input
                            id="artistUnicode"
                            class="form-control mb-1"
                            type="text"
                            placeholder="Unicode Artist (if same as Artist, copy that here)..."
                            v-model="answer.metadataInput.artistUnicode"
                        />
                        <input
                            id="source"
                            class="form-control mb-2"
                            type="text"
                            placeholder="Source (if unclear or non-existent, leave empty)..."
                            v-model="answer.metadataInput.source"
                        />
                        <small class="pl-4"
                            >Link sources for the song information (only one link is necessary, but more could
                            help you!):</small
                        >
                        <input
                            id="reference1"
                            class="form-control mb-1"
                            type="text"
                            placeholder="Reference 1"
                            v-model="answer.metadataInput.reference1"
                        />
                        <input
                            id="reference2"
                            class="form-control mb-1"
                            type="text"
                            placeholder="Reference 2"
                            v-model="answer.metadataInput.reference2"
                        />
                        <input
                            id="reference3"
                            class="form-control mb-1"
                            type="text"
                            placeholder="Reference 3"
                            v-model="answer.metadataInput.reference3"
                        />
                    </div>
                    <div v-if="isNat">
                        <h5 class="mt-4">Correct possibilities:</h5>
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
                            class="form-control-sm col-md-1 ml-1 mb-2"
                            type="text"
                            maxlength="5"
                            placeholder="points..."
                            style="min-width: 80px; width: 80;"
                            v-model="additionalPoints"
                        />
                        <button
                            type="submit"
                            class="btn btn-sm btn-nat mx-2"
                            @click="updateAdditionalPoints($event)"
                        >
                            Update Additional Points
                        </button>
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
    name: 'test-results-page',
    components: {
        ResultCard,
    },
    mixins: [postData],
    watch: {
        selectedTest: function(v) {
            if (v) {
                this.getOptionIds();
                this.additionalPoints = this.selectedTest.additionalPoints;
                this.confirm = '';
                this.info = '';
            }
        },
    },
    methods: {
        calculateTotalScore: function() {
            let displayScore = 0;
            this.selectedTest.answers.forEach(answer => {
                answer.optionsChosen.forEach(option => {
                    displayScore += option.score;
                });
            });
            return Math.round(displayScore * 10) / 10;
        },
        getActiveOptions: function(options) {
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
        updateAdditionalPoints: async function(e) {
            let points = parseFloat(this.additionalPoints);
            if (points || points == 0) {
                const result = await this.executePost(
                    '/testResults/updateAdditionalPoints/' + this.selectedTest.id,
                    { points: points },
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
        updateTest: function(t) {
            const i = this.allTests.findIndex(test => test.id == t.id);
            this.allTests[i] = t;
            this.selectedTest = t;
        },
    },
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