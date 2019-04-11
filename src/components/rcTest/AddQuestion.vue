<template>
<div id="addQuestion" class="modal fade" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header bg-nat-logo">
                <h5 class="modal-title text-dark">Add "{{category}}" question</h5>
                <button type="button" class="close" data-dismiss="modal">
                <span>&times;</span>
                </button>
            </div>
            <div class="modal-body" style="overflow: hidden">
                <div class="container">
                    <div class="text-shadow mb-2"><p>Question:</p>
                        <div v-if="rawCategory == 'metadata'">
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="questionType" id="fill" value="fill">
                                <label class="form-check-label text-shadow" for="fill">Fill in the blank</label>
                            </div>
                        </div>
                        <div v-else>
                            <div class="form-check form-check-inline ml-2">
                                <input class="form-check-input" type="radio" name="questionType" id="text" value="text">
                                <label class="form-check-label text-shadow" for="text">Select text</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="questionType" id="image" value="image">
                                <label class="form-check-label text-shadow" for="image">Select Image</label>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <textarea class="form-control dark-textarea" id="newQuestion" 
                            :placeholder="rawCategory == 'metadata' ? 'link to mapset with incorrect metadata...' : 'avoid confusing wording...'" 
                            maxlength="300" rows="2" @keyup.enter="addQuestion($event)">
                        </textarea>
                    </div>
                </div>
                <hr>
                <span class="errors text-shadow" id="addEvalRoundsErrors">{{ info }}</span>
                <span class="confirm text-shadow" id="addEvalRoundsConfirm">{{ confirm }}</span>
                <button type="submit" class="btn btn-nat btn-sm float-right" @click="addQuestion($event)">Add Question</button>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import postData from '../../mixins/postData.js'

export default {
    name: 'add-question',
    mixins: [ postData ],
    props: ['category', 'raw-category'],
    methods: {
        addQuestion: async function (e) {
            this.info = '';
            this.confirm = '';
            let questionType = $('input[name=questionType]:checked').val();
            let newQuestion = $('#newQuestion').val();
            if(!newQuestion || !newQuestion.length || !questionType || !questionType.length){
                this.info = "Cannot leave fields blank!"
            }else{
                const question = await this.executePost('/manageTest/addQuestion', {questionType: questionType, newQuestion: newQuestion.trim(), category: this.rawCategory}, e);
                if (question) {
                    if (question.error) {
                        this.info = question.error;
                    } else {
                        this.$emit('add-question', question);
                        this.confirm = 'Question added! ';
                    }
                }
            }
        },
    },
    data() {
        return {
            info: '',
            confirm: '',
            type: null
        };
    },
}
</script>

<style>

</style>
