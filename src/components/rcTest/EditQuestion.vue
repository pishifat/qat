<template>
    <div id="editQuestion" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="question" class="modal-content">
                <div class="modal-header bg-nat-logo">
                    <h5 class="modal-title text-dark">
                        Edit "{{ category }}" question
                    </h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body" style="overflow: hidden">
                    <div class="container mb-2">
                        <div class="text-shadow mb-2">
                            <p>Question:</p>
                            <div>
                                <div class="form-check form-check-inline ml-2">
                                    <input
                                        id="text"
                                        class="form-check-input"
                                        type="radio"
                                        name="questionTypeEdit"
                                        value="text"
                                        :checked="question.questionType == 'text'"
                                    >
                                    <label class="form-check-label text-shadow" for="text">Select text</label>
                                </div>
                                <div class="form-check form-check-inline">
                                    <input
                                        id="image"
                                        class="form-check-input"
                                        type="radio"
                                        name="questionTypeEdit"
                                        value="image"
                                        :checked="question.questionType == 'image'"
                                    >
                                    <label class="form-check-label text-shadow" for="image">Select Image</label>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <textarea
                                id="newQuestionEdit"
                                v-model="question.content"
                                class="form-control dark-textarea"
                                placeholder="question..."
                                maxlength="300"
                                rows="2"
                                @keyup.enter="editQuestion($event)"
                            />
                        </div>
                        <button type="submit" class="btn btn-sm btn-nat float-right ml-2" @click="updateQuestion($event)">
                            Update Question
                        </button>
                        <button
                            type="submit"
                            class="btn btn-sm float-right ml-2"
                            :class="question.active ? 'btn-nat-red' : 'btn-nat'"
                            data-toggle="tooltip"
                            data-placement="top"
                            title="Changes whether or not question appears on newly generated tests"
                            @click="toggleActive($event)"
                        >
                            {{ question.active ? "Mark as inactive" : "Mark as active" }}
                        </button>
                    </div>
                    <br class="mb-2">
                    <hr>
                    <div class="container">
                        <p class="text-shadow">
                            Options:
                        </p>

                        <table class="table table-sm table-dark table-hover col-md-12 mt-2">
                            <thead>
                                <td scope="col">
                                    Option
                                </td>
                                <td scope="col">
                                    Score
                                </td>
                                <td scope="col">
                                    Select
                                </td>
                            </thead>
                            <tbody>
                                <tr v-for="option in sortedOptions" :key="option.id" :class="option.active ? 'border-active' : 'border-inactive'">
                                    <td scope="row">
                                        <a v-if="question.questionType == 'image'" :href="option.content" target="_blank">{{ option.content }}</a>
                                        <span v-else>{{ option.content }}</span>
                                    </td>
                                    <td scope="row">
                                        {{ option.score }}
                                    </td>
                                    <td scope="row">
                                        <input type="checkbox" name="optionList" :value="option.id">
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="row col-md-12">
                            <input
                                id="option"
                                class="form-control-sm col-md-9 mb-2"
                                type="text"
                                maxlength="200"
                                placeholder="potential answer... (if image, post link)"
                            >
                            <input
                                id="score"
                                class="form-control-sm col-md-1 ml-1 mb-2"
                                type="text"
                                maxlength="5"
                                placeholder="points..."
                                style="min-width: 80px; width: 80;"
                            >
                        </div>
                    </div>
                    <hr>
                    <button type="submit" class="btn btn-sm btn-nat-red float-right ml-2" @click="toggleActiveOption($event)">
                        Toggle activity
                    </button>
                    <button type="submit" class="btn btn-sm btn-nat float-right ml-2" @click="updateOption($event)">
                        Update Selected Option
                    </button>
                    <button type="submit" class="btn btn-sm btn-nat float-right ml-2" @click="addOption($event)">
                        Add Option
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';

export default {
    name: 'EditQuestion',
    mixins: [ postData ],
    props: {
        question: {
            type: Object,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
    },
    computed: {
        sortedOptions() {
            let sorted = this.question.options;

            for (let i = 0; i < sorted.length; i++) {
                let option = sorted[i];

                if (!option.active) {
                    sorted.splice(sorted.length, 0, sorted.splice(i, 1)[0]);
                }
            }

            return sorted;
        },
    },
    methods: {
        async updateQuestion (e) {
            let questionType = $('input[name=questionTypeEdit]:checked').val();
            let newQuestion = $('#newQuestionEdit').val();

            if (!newQuestion || !newQuestion.length || !questionType || !questionType.length) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Cannot leave question fields blank!`,
                    type: 'danger',
                });
            } else {
                const question = await this.executePost('/manageTest/updateQuestion/' + this.question.id, { questionType, newQuestion }, e);

                if (question && !question.error) {
                    this.$emit('update-question', question);
                    this.$store.dispatch('updateToastMessages', {
                        message: `Question content updated`,
                        type: 'success',
                    });
                }
            }
        },
        async toggleActive(e) {
            const question = await this.executePost('/manageTest/toggleActive/' + this.question.id, { status: !this.question.active }, e);

            if (question && !question.error) {
                this.$emit('update-question', question);
                this.$store.dispatch('updateToastMessages', {
                    message: `Question activity updated`,
                    type: 'success',
                });
            }
        },
        async addOption(e) {
            let option = $('#option').val();
            let score = parseFloat($('#score').val());

            if ((!option || !option.length) || (!score && score != 0)) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Cannot leave option fields blank!`,
                    type: 'danger',
                });
            } else {
                const question = await this.executePost('/manageTest/addOption/' + this.question.id, { option, score }, e);

                if (question && !question.error) {
                    this.$emit('update-question', question);
                    this.$store.dispatch('updateToastMessages', {
                        message: `Option added`,
                        type: 'success',
                    });
                }
            }
        },
        async updateOption(e) {
            let id = $('input[name=\'optionList\']:checked').val();
            let option = $('#option').val();
            let score = parseFloat($('#score').val());
            let checked = $('input[name=\'optionList\']:checked').length;

            if (checked != 1) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Select only one option!`,
                    type: 'danger',
                });
                this.$store.dispatch('updateToastMessages', {
                    message: `Apologies for how terribly designed this part of the website is. I can't justify improving it because nobody uses it`,
                    type: 'info',
                });
            } else if (!option || !option.length || (!score && score != 0)) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Cannot leave option fields blank!`,
                    type: 'danger',
                });
                this.$store.dispatch('updateToastMessages', {
                    message: `Apologies for how terribly designed this part of the website is. I can't justify improving it because nobody uses it`,
                    type: 'info',
                });
            } else {
                const question = await this.executePost('/manageTest/updateOption/' + id, { option, score, questionId: this.question.id }, e);

                if (question && !question.error) {
                    this.$emit('update-question', question);
                    this.$store.dispatch('updateToastMessages', {
                        message: `Option added`,
                        type: 'success',
                    });
                }
            }
        },
        async toggleActiveOption(e) {
            let checkedOptions = [];
            $('input[name=\'optionList\']:checked').each(function() {
                checkedOptions.push( $(this).val() );
            });

            if (!checkedOptions.length) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Must select options!`,
                    type: 'danger',
                });
            } else {
                const question = await this.executePost('/manageTest/toggleActiveOption/', { checkedOptions, questionId: this.question.id }, e);

                if (question && !question.error) {
                    this.$emit('update-question', question);
                    this.$store.dispatch('updateToastMessages', {
                        message: `Question updated`,
                        type: 'success',
                    });
                }
            }
        },
    },
};
</script>

<style>

td {
    word-break: break-word;
}

</style>
