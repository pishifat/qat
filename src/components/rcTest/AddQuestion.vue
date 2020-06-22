<template>
    <modal-dialog
        id="addQuestion"
        title="Add question"
    >
        <div v-if="category" class="container">
            <question-type
                v-model="questionType"
                :for-label="'add'"
            />

            <question-content
                v-model="questionContent"
            />

            <hr>

            <button type="submit" class="btn btn-success btn-sm float-right" @click="addQuestion($event)">
                Add Question
            </button>
        </div>
    </modal-dialog>
</template>

<script>
import postData from '../../mixins/postData.js';
import ModalDialog from '../../components/ModalDialog.vue';
import QuestionType from './QuestionType.vue';
import QuestionContent from './QuestionContent.vue';

export default {
    name: 'AddQuestion',
    components: {
        ModalDialog,
        QuestionType,
        QuestionContent,
    },
    mixins: [ postData ],
    props: {
        category: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            questionContent: '',
            questionType: '',
        };
    },
    methods: {
        async addQuestion (e) {
            if (!this.questionContent || !this.questionType) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Cannot leave fields blank!`,
                    type: 'danger',
                });
            } else {
                const question = await this.executePost('/manageTest/store', {
                    questionType: this.questionType,
                    newQuestion: this.questionContent,
                    category: this.category,
                }, e);

                if (question && !question.error) {
                    this.$store.commit('manageTest/addQuestion', question);
                    this.$store.dispatch('updateToastMessages', {
                        message: `Question added`,
                        type: 'success',
                    });
                }
            }
        },
    },
};
</script>
