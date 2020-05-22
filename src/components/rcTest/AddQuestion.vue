<template>
    <div id="addQuestion" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-nat-logo">
                    <h5 class="modal-title text-dark">
                        Add question: {{ category }}
                    </h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body" style="overflow: hidden">
                    <div class="container">
                        <div class="text-shadow mb-2">
                            <p>Question:</p>
                            <div>
                                <div class="form-check form-check-inline ml-2">
                                    <input
                                        id="text"
                                        class="form-check-input"
                                        type="radio"
                                        name="questionType"
                                        value="text"
                                    >
                                    <label class="form-check-label text-shadow" for="text">Select text</label>
                                </div>
                                <div class="form-check form-check-inline">
                                    <input
                                        id="image"
                                        class="form-check-input"
                                        type="radio"
                                        name="questionType"
                                        value="image"
                                    >
                                    <label class="form-check-label text-shadow" for="image">Select Image</label>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <textarea
                                id="newQuestion"
                                class="form-control dark-textarea"
                                placeholder="question..."
                                maxlength="300"
                                rows="2"
                                @keyup.enter="addQuestion($event)"
                            />
                        </div>
                    </div>
                    <hr>
                    <button type="submit" class="btn btn-nat btn-sm float-right" @click="addQuestion($event)">
                        Add Question
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';

export default {
    name: 'AddQuestion',
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
                    message: `cannot leave fields blank!`,
                    type: 'danger',
                });
            } else {
                const question = await this.executePost('/manageTest/addQuestion', { questionType, newQuestion: newQuestion.trim(), category: this.rawCategory }, e);

                if (question && !question.error) {
                    this.$emit('add-question', question);
                    this.$store.dispatch('updateToastMessages', {
                        message: `question added`,
                        type: 'info',
                    });
                }
            }
        },
    },
};
</script>

<style>

</style>
