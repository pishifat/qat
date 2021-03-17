<template>
    <div class="container">
        <div class="row">
            <div class="col-sm-6">
                <p>Do you want to evaluate new BN applications?</p>
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
                        BN Evaluator
                    </label>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import postData from '../../mixins/postData.js';

export default {
    mixins: [ postData ],
    computed: mapState([
        'loggedInUser',
    ]),
    methods: {
        async updateBnEvaluator (e) {
            await this.executePost(`/users/${this.loggedInUser.id}/switchBnEvaluator`, {}, e);
        },
    },
};
</script>
