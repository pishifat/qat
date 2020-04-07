<template>
    <div>
        <p class="text-shadow">
            BN application input:
            <span :class="{ 'vote-fail': !isBnEvaluator, 'vote-pass': isBnEvaluator }">
                {{ isBnEvaluator ? 'Enabled' : 'Disabled' }}
            </span>
            <button
                class="btn btn-sm ml-2"
                :class="{ 'btn-nat-green': !isBnEvaluator, 'btn-nat-red': isBnEvaluator }"
                data-toggle="tooltip"
                data-placement="top"
                title="Toggle ability to give input on BN applications"
                @click="switchBnEvaluator($event)"
            >
                {{ isBnEvaluator ? 'Deactivate' : 'Enable' }}
            </button>
        </p>
    </div>
</template>

<script>
import postData from '../../../mixins/postData.js';

export default {
    name: 'BnEvaluatorToggle',
    mixins: [postData],
    props: {
        isBnEvaluator: Boolean,
        userId: String,
    },
    methods: {
        async switchBnEvaluator(e) {
            const u = await this.executePost('/users/switchBnEvaluator/' + this.userId, { isBnEvaluator: this.isBnEvaluator }, e);

            if (u) {
                if (u.error) {
                    this.info = u.error;
                } else {
                    this.$emit('update-user', u);
                }
            }
        },
    },
};
</script>