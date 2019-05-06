<template>

<div class="row">
    <section class="col-md-12 segment mb-4">
        <select class="custom-select small" id="questionType" style="width: 200px;">
            <option value='codeOfConduct'>Code of Conduct</option>
            <option value='general'>General</option>
            <option value='spread'>Spread</option>
            <option value='metadata'>Metadata</option>
            <option value='timing'>Timing</option>
            <option value='audio'>Audio</option>
            <option value='videoBackground'>Video/BG</option>
            <option value='skinning'>Skinning</option>
            <option value='storyboarding'>Storyboarding</option>
            <option value='osu'>osu!</option>
            <option value='taiko'>osu!taiko</option>
            <option value='catch'>osu!catch</option>
            <option value='mania'>osu!mania</option>
            <option value='bn'>BN Rules</option>
        </select>
        <button class="btn btn-nat btn-sm ml-2" id="artistButton" @click="loadContent($event);">Load test content</button>
        <span v-if="info" class="errors mt-1">{{info}}</span>
    </section>
    <section v-if="category" class="col-md-12 segment segment-image">
        <h2>{{category}} Questions 
            <button
            class="btn btn-nat"
            data-toggle="modal"
            data-target="#addQuestion"
            @click="resetInput()"
        >Add question</button></h2>
        <table v-if="questions && questions.length" class="table table-sm table-dark table-hover col-md-12 mt-2">
            <thead>
                <td scope="col">Question</td>
                <td scope="col"></td>
            </thead>
            <tbody>
                <tr v-for="question in questions" :key="question.id" :class="question.active ? 'border-active' : 'border-inactive'">
                    <td scope="row">
                        {{question.content}}
                    </td>
                    <td scope="row" class="text-right">
                        <a href="#" data-toggle="modal" data-target="#editQuestion" :data-entry="question.id" @click.prevent="selectQuestion(question)">
                            <i class="fas fa-edit"></i>
                        </a>
                    </td>
                </tr>
            </tbody>
        </table>

    </section>

    <add-question
        :category="category"
        :raw-category="rawCategory"
        :is-spectator="isSpectator"
        @add-question="addQuestionToList($event)"
    ></add-question>

    <edit-question
        :question="selectedQuestion"
        :category="category"
        :is-spectator="isSpectator"
        @update-question="updateQuestion($event)"
        @delete-question="deleteQuestion($event)"
    ></edit-question>

</div>

</template>



<script>
import AddQuestion from '../components/rcTest/AddQuestion.vue';
import EditQuestion from '../components/rcTest/EditQuestion.vue';

export default {
    name: 'manage-test-page',
    components: {
        AddQuestion,
        EditQuestion
    },
    watch: {
        
    },
    methods: {
        updateQuestion: function (question) {
			const i = this.questions.findIndex(q => q.id == question.id);
			this.questions[i] = question;
            this.selectedQuestion = question;
        },
        deleteQuestion: function (question) {
            const i = this.questions.findIndex(q => q.id == question);
            this.questions.splice(i, 1);
            this.selectedQuestion = null;
        },
        selectQuestion: function(q){
            this.selectedQuestion = q;
        },
        loadContent: function (e) {
            e.target.disabled = true;
            let questionType = $('#questionType').val();
            axios
                .get('/manageTest/load/' + questionType)
                .then(response => {
                    this.questions = response.data.questions;
                    this.isSpectator = response.data.isSpectator;
                    this.category = $("#questionType option:selected").text();
                    this.rawCategory = $("#questionType").val();
                    e.target.disabled = false;
                });
        },
        resetInput: function() {
            $('#optionList').text('');
        },
        addQuestionToList: function(q) {
            this.questions.unshift(q);
        }
    },
    data() {
        return {
            category: null,
            rawCategory: null,
            questions: [],
            selectedQuestion: null,
            isSpectator: false,
            info: '',
        }
    },
    created() {
        $("#loading").hide(); //this is temporary
        $("#main").attr("style", "visibility: visible");
    }
}
</script>

<style>
.border-active {
    border-left: 5px solid var(--pass);
}

.border-inactive {
    border-left: 5px solid var(--fail);
}
</style>
