<template>
    <div>
        <data-table :headers="['Option', 'Score', '']">
            <tr
                v-for="option in selectedQuestion.options"
                :key="option.id"
                :class="option.active ? 'border-active' : 'border-inactive'"
            >
                <td v-if="optionEditingId === option.id">
                    <input
                        v-model="content"
                        class="form-control form-control-sm"
                        type="text"
                        maxlength="200"
                        placeholder="potential answer... (if image, post link)"
                    >
                </td>
                <td v-else>
                    <a
                        v-if="selectedQuestion.questionType == 'image'"
                        :href="option.content"
                        target="_blank"
                    >
                        {{ option.content }}
                    </a>

                    <span v-else>{{ option.content }}</span>
                </td>

                <td>
                    <input
                        v-if="optionEditingId === option.id"
                        v-model="score"
                        class="form-control form-control-sm"
                        type="number"
                        placeholder="points..."
                    >
                    <span v-else>{{ option.score }}</span>
                </td>

                <td class="text-right">
                    <a
                        v-if="optionEditingId === option.id"
                        href="#"
                        @click="updateOption($event)"
                    >
                        <i class="fas fa-save" />
                    </a>
                    <a
                        v-else
                        href="#"
                        @click="optionEditingId = option.id"
                    >
                        <i class="fas fa-edit" />
                    </a>
                    <a
                        href="#"
                        data-toggle="tooltip"
                        title="Toggle activity"
                        @click="toggleActivity(option.id, $event)"
                    >
                        <i
                            class="fas"
                            :class="option.active ? 'fa-toggle-on' : 'fa-toggle-off'"
                        />
                    </a>
                </td>
            </tr>
        </data-table>

        <hr>

        <p>
            <b>New option:</b>
        </p>

        <div class="form-inline mb-2">
            <input
                v-model="newContent"
                class="form-control w-75"
                type="text"
                maxlength="200"
                placeholder="potential answer... (if image, post link)"
            >
            <input
                v-model="newScore"
                class="form-control w-25"
                type="number"
                placeholder="points..."
            >
        </div>

        <div class="text-right">
            <button type="submit" class="btn btn-sm btn-success ml-2" @click="addOption($event)">
                Add Option
            </button>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import DataTable from '../../components/DataTable.vue';

export default {
    name: 'EditOptions',
    components: {
        DataTable,
    },
    data () {
        return {
            optionEditingId: null,
            content: '',
            score: 0,
            newContent: '',
            newScore: 0,
        };
    },
    computed: {
        ...mapGetters('manageTest', [
            'selectedQuestion',
        ]),
    },
    watch: {
        optionEditingId (id) {
            if (!id) return;

            const option = this.selectedQuestion.options.find(o => o.id == id);
            this.content = option.content;
            this.score = option.score;
        },
    },
    methods: {
        updateQuestion (question, message) {
            if (question && !question.error) {
                this.$store.commit('manageTest/updateQuestion', question);
                this.$store.dispatch('updateToastMessages', {
                    message,
                    type: 'success',
                });
            }
        },
        async addOption(e) {
            const question = await this.$http.executePost(`/manageTest/${this.selectedQuestion.id}/options/store`, {
                content: this.newContent,
                score: this.newScore,
            }, e);

            this.updateQuestion(question, 'Option added');
        },
        async updateOption(e) {
            const question = await this.$http.executePost(`/manageTest/${this.selectedQuestion.id}/options/${this.optionEditingId}/update`, {
                content: this.content,
                score: this.score,
            }, e);

            if (!question.error) {
                this.optionEditingId = null;
            }

            this.updateQuestion(question, 'Option updated');
        },
        async toggleActivity(id, e) {
            const question = await this.$http.executePost(`/manageTest/${this.selectedQuestion.id}/options/${id}/toggleActivity`, {}, e);
            this.updateQuestion(question, 'Option updated');
        },
    },
};
</script>
