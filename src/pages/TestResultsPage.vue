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
            </div>
        </section>

        <section v-if="tests" class="col-md-12 segment segment-image">
            <transition-group name="list" tag="div" class="row">
                <result-card
                    v-for="test in tests"
                    :key="test.id"
                    :selected-test="test"
                    @update:selected-test="selectedTest = $event"
                />
            </transition-group>
            <p v-if="!tests.length" class="text-center min-spacing">
                No test results...
            </p>
        </section>

        <section v-if="selectedTest">
            <p class="text-center segment">
                User: {{ selectedTest.applicant.username }} - Mode: {{ selectedTest.mode }} - Score:
                {{ selectedTest.totalScore }}
            </p>

            <div v-for="(answer, i) in selectedTest.answers" :key="answer.id" class="segment segment-image">
                <small class="float-right">
                    Q{{ ++i }} -- {{ answer.question.category }}
                    <span v-if="isNat && answer.question.questionType != 'fill'"> -- total: {{ calculateQuestionScore(answer) }}</span>
                </small>
                <div>
                    <h5 style="width: 90%">
                        {{ answer.question.content }}
                    </h5>
                    <div v-for="option in getActiveOptions(answer.question.options)" :key="option.id">
                        <div class="form-check mb-2 ml-2">
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
            </div>
        </section>
    </div>
</template>



<script>
import { mapState, mapGetters } from 'vuex';
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
            selectedOptionIds: [],
            searchValue: null,
        };
    },
    computed: {
        ...mapState([
            'tests',
            'isNat',
        ]),
        ...mapGetters([
            'selectedTest',
        ]),
    },
    watch: {
        selectedTest(v) {
            if (v) {
                this.getOptionIds();
            }
        },
    },
    async created() {
        const params = new URLSearchParams(document.location.search.substring(1));

        let res;

        if (params.get('user') && params.get('user').length) {
            res = await this.executeGet(`/testResults/search/${params.get('user')}`);
        } else {
            res = await this.executeGet('/testResults/relevantInfo');
        }

        if (res) {
            this.$store.commit('setIsNat', res.isNat);
            this.$store.commit('setTests', res.tests);

            if (this.tests && this.tests.length == 1) {
                this.$store.commit('setSelectedTestId', this.tests[0].id);
            }
        }

        $('#loading').fadeOut();
        $('#main')
            .attr('style', 'visibility: visible')
            .hide()
            .fadeIn();
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
                if (answer.optionsChosen.indexOf(option.id) >= 0) {
                    score += option.score;
                }
            });
            if (score < 0) score = 0;

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
            let user = this.searchValue;

            if (!user || !user.length) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Must enter username or ID!`,
                    type: 'danger',
                });
            } else {
                history.pushState(null, 'Ranking Criteria Test Results', `/testresults?user=${user}`);
                const result = await this.executeGet(`/testResults/search/${user}`, e);

                if (result && !result.error) {
                    this.$store.commit('setTests', result.tests);

                    if (this.tests && this.tests.length == 1) {
                        this.$store.commit('setSelectedTestId', this.tests[0].id);
                    } else {
                        this.$store.commit('setSelectedTestId', null);
                    }
                }
            }
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