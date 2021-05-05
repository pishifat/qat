<template>
    <div class="container">
        <div class="row">
            <div class="col-sm-6">
                <div>Do you want to do BN evaluations?</div>
                <small class="text-secondary">
                    You can give input on new BN applicants and current BNs
                </small>
            </div>

            <div class="col-sm-6">
                <div class="form-check">
                    <input
                        id="settings-evaluator"
                        :checked="loggedInUser.isBnEvaluator"
                        type="checkbox"
                        class="form-check-input"
                        @change="updateBnEvaluator"
                    >
                    <label
                        class="form-check-label text-secondary"
                        for="settings-evaluator"
                    >
                        BN application evaluator
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
        async updateBnEvaluator (e) {
            await this.$http.executePost(`/users/${this.loggedInUser.id}/switchBnEvaluator`, {}, e);
        },
    },
};
</script>
