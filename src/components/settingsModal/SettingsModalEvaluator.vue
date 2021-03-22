<template>
    <div class="container">
        <div class="row">
            <div class="col-sm-6">
                <div>Do you want to evaluate new BN applications?</div>
                <small class="text-secondary">
                    You can give input on occasional new BN applicants and may be considered for joining the NAT in the future
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
