<template>
    <div class="row">
        <section class="col-md-12 segment mb-4">
            <select id="questionType" class="custom-select small" style="width: 200px;">
                <option value="codeOfConduct">
                    Code of Conduct
                </option>
                <option value="general">
                    General
                </option>
                <option value="spread">
                    Spread
                </option>
                <option value="metadata">
                    Metadata
                </option>
                <option value="timing">
                    Timing
                </option>
                <option value="audio">
                    Audio
                </option>
                <option value="videoBackground">
                    Video/BG
                </option>
                <option value="skinning">
                    Skinning
                </option>
                <option value="storyboarding">
                    Storyboarding
                </option>
                <option value="osu">
                    osu!
                </option>
                <option value="taiko">
                    osu!taiko
                </option>
                <option value="catch">
                    osu!catch
                </option>
                <option value="mania">
                    osu!mania
                </option>
                <option value="bn">
                    BN Rules
                </option>
            </select>
            <button id="artistButton" class="btn btn-nat btn-sm ml-2" @click="loadContent($event);">
                Load test content
            </button>
        </section>
        <section v-if="category" class="col-md-12 segment segment-image">
            <h2>
                {{ category }} Questions
                <button
                    class="btn btn-nat"
                    data-toggle="modal"
                    data-target="#addQuestion"
                    @click="resetInput()"
                >
                    Add question
                </button>
            </h2>
            <table v-if="questions && questions.length" class="table table-sm table-dark table-hover col-md-12 mt-2">
                <thead>
                    <td scope="col">
                        Question
                    </td>
                    <td scope="col">
                        Updated
                    </td>
                    <td scope="col" />
                </thead>
                <tbody>
                    <tr v-for="question in questions" :key="question.id" :class="question.active ? 'border-active' : 'border-inactive'">
                        <td scope="row">
                            {{ question.content }}
                        </td>
                        <td scope="row" style="white-space: nowrap;">
                            {{ question.updatedAt.slice(0,10) }}
                        </td>
                        <td scope="row" class="text-right">
                            <a
                                href="#"
                                data-toggle="modal"
                                data-target="#editQuestion"
                                :data-entry="question.id"
                                @click.prevent="selectQuestion(question)"
                            >
                                <i class="fas fa-edit" />
                            </a>
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>

        <add-question
            :category="category"
            :raw-category="rawCategory"
            @add-question="addQuestionToList($event)"
        />

        <edit-question
            v-if="selectedQuestion"
            :question="selectedQuestion"
            :category="category"
            @update-question="updateQuestion($event)"
            @delete-question="deleteQuestion($event)"
        />

        <toast-messages />
    </div>
</template>



<script>
import ToastMessages from '../components/ToastMessages.vue';
import AddQuestion from '../components/rcTest/AddQuestion.vue';
import EditQuestion from '../components/rcTest/EditQuestion.vue';
import postData from '../mixins/postData.js';

export default {
    name: 'ManageTestPage',
    components: {
        ToastMessages,
        AddQuestion,
        EditQuestion,
    },
    mixins: [ postData ],
    data() {
        return {
            category: '',
            rawCategory: '',
            questions: [],
            selectedQuestion: null,
        };
    },
    watch: {

    },
    created() {
        $('#loading').hide(); //this is temporary
        $('#main').attr('style', 'visibility: visible');
    },
    methods: {
        updateQuestion (question) {
            const i = this.questions.findIndex(q => q.id == question.id);
            this.questions[i] = question;
            this.selectedQuestion = question;
        },
        deleteQuestion (question) {
            const i = this.questions.findIndex(q => q.id == question);
            this.questions.splice(i, 1);
            this.selectedQuestion = null;
        },
        selectQuestion(q) {
            this.selectedQuestion = q;
        },
        async loadContent (e) {
            e.target.disabled = true;
            let questionType = $('#questionType').val();
            const res = await this.executeGet('/manageTest/load/' + questionType);

            if (res) {
                this.questions = res.questions;
                this.category = $('#questionType option:selected').text();
                this.rawCategory = $('#questionType').val();
            }

            e.target.disabled = false;
        },
        resetInput() {
            $('#optionList').text('');
        },
        addQuestionToList(q) {
            this.questions.unshift(q);
        },
    },
};
</script>

<style>
.border-active {
    border-left: 5px solid var(--pass);
}

.border-inactive {
    border-left: 5px solid var(--fail);
}
</style>
