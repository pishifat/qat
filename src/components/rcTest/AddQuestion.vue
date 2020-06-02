<template>
    <modal-dialog id="addQuestion" :title="`Add question: ${category}`">
        <div class="container">
            <div class="form-inline mb-2">
                <b>Question type:</b>

                <div class="form-check form-check-inline ml-2">
                    <input
                        id="text"
                        class="form-check-input"
                        type="radio"
                        name="questionType"
                        value="text"
                    >
                    <label class="form-check-label" for="text">Select text</label>
                </div>
                <div class="form-check form-check-inline">
                    <input
                        id="image"
                        class="form-check-input"
                        type="radio"
                        name="questionType"
                        value="image"
                    >
                    <label class="form-check-label" for="image">Select Image</label>
                </div>
            </div>

            <textarea
                id="newQuestion"
                class="form-control mb-2"
                placeholder="question..."
                maxlength="300"
                rows="4"
                @keyup.enter="addQuestion($event)"
            />

            <hr>

            <button type="submit" class="btn btn-success btn-sm float-right" @click="addQuestion($event)">
                Add Question
            </button>
        </div>
    </modal-dialog>
</template>

<script>
import ModalDialog from '../../components/ModalDialog.vue';
import postData from '../../mixins/postData.js';

export default {
    name: 'AddQuestion',
    components: {
        ModalDialog,
    },
    mixins: [ postData ],
    props: {
        category: {
            type: String,
            required: true,
        },
        rawCategory: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            type: null,
        };
    },
    methods: {
        async addQuestion (e) {
            let questionType = $('input[name=questionType]:checked').val();
            let newQuestion = $('#newQuestion').val();

            if (!newQuestion || !newQuestion.length || !questionType || !questionType.length) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Cannot leave fields blank!`,
                    type: 'danger',
                });
            } else {
                const question = await this.executePost('/manageTest/addQuestion', { questionType, newQuestion: newQuestion.trim(), category: this.rawCategory }, e);

                if (question && !question.error) {
                    this.$emit('add-question', question);
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

<style>

</style>
