<template>
    <div class="container">
        <div class="row">
            <div class="col-sm-6">
                <div>Do you want to receive subjective feedback in your BN evaluations?</div>
                <span class="text-secondary small">
                    This won't affect the consensus of your evaluations whatsoever, and it's mainly for when you want to receive more detailed feedback to improve!
                </span>
            </div>
            <div class="col-sm-6">
                <div class="form-check">
                    <input
                        id="settings-subjective-eval-feedback"
                        :checked="loggedInUser.subjectiveEvalFeedback"
                        type="checkbox"
                        class="form-check-input"
                        @change="toggleSubjectiveEvalFeedback"
                    >
                    <label
                        class="form-check-label text-secondary"
                        for="settings-subjective-eval-feedback"
                    >
                    Subjective feedback in evaluations
                    </label>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
    computed: mapState([
        'loggedInUser',
    ]),
    methods: {
        async toggleSubjectiveEvalFeedback (e) {
            await this.$http.executePost(`/users/${this.loggedInUser.id}/toggleSubjectiveEvalFeedback`, {}, e);
        },
    },
};
</script>
