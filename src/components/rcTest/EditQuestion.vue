<template>
    <modal-dialog
        id="editQuestion"
        :title="`Edit ${category} question`"
    >
        <div class="container">
            <div class="form-inline mb-2">
                <b>Question type:</b>

                <div class="form-check form-check-inline ml-2">
                    <input
                        id="text"
                        class="form-check-input"
                        type="radio"
                        name="questionTypeEdit"
                        value="text"
                        :checked="question.questionType == 'text'"
                    >
                    <label class="form-check-label" for="text">Select text</label>
                </div>
                <div class="form-check form-check-inline ml-2">
                    <input
                        id="image"
                        class="form-check-input"
                        type="radio"
                        name="questionTypeEdit"
                        value="image"
                        :checked="question.questionType == 'image'"
                    >
                    <label class="form-check-label" for="image">Select Image</label>
                </div>
            </div>

            <textarea
                id="newQuestionEdit"
                v-model="question.content"
                class="form-control mb-2"
                placeholder="question..."
                maxlength="300"
                rows="4"
                @keyup.enter="editQuestion($event)"
            />

            <div class="text-right">
                <button type="submit" class="btn btn-sm btn-success ml-2" @click="updateQuestion($event)">
                    Update Question
                </button>

                <button
                    type="submit"
                    class="btn btn-sm ml-2"
                    :class="question.active ? 'btn-danger' : 'btn-success'"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Changes whether or not question appears on newly generated tests"
                    @click="toggleActive($event)"
                >
                    {{ question.active ? "Mark as inactive" : "Mark as active" }}
                </button>
            </div>

            <hr>

            <data-table :headers="['Option', 'Score', 'Select']">
                <tr v-for="option in sortedOptions" :key="option.id" :class="option.active ? 'border-active' : 'border-inactive'">
                    <td>
                        <a v-if="question.questionType == 'image'" :href="option.content" target="_blank">{{ option.content }}</a>
                        <span v-else>{{ option.content }}</span>
                    </td>
                    <td>
                        {{ option.score }}
                    </td>
                    <td>
                        <input type="checkbox" name="optionList" :value="option.id">
                    </td>
                </tr>
            </data-table>

            <div class="form-inline mb-2">
                <input
                    id="option"
                    class="form-control w-75"
                    type="text"
                    maxlength="200"
                    placeholder="potential answer... (if image, post link)"
                >
                <input
                    id="score"
                    class="form-control w-25"
                    type="text"
                    maxlength="5"
                    placeholder="points..."
                >
            </div>

            <div class="text-right">
                <button type="submit" class="btn btn-sm btn-danger" @click="toggleActiveOption($event)">
                    Toggle activity
                </button>
                <button type="submit" class="btn btn-sm btn-success ml-2" @click="updateOption($event)">
                    Update Selected Option
                </button>
                <button type="submit" class="btn btn-sm btn-success ml-2" @click="addOption($event)">
                    Add Option
                </button>
            </div>
        </div>
    </modal-dialog>
</template>

<script>
import ModalDialog from '../../components/ModalDialog.vue';
import DataTable from '../../components/DataTable.vue';
import postData from '../../mixins/postData.js';

export default {
    name: 'EditQuestion',
    components: {
        ModalDialog,
        DataTable,
    },
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
