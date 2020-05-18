<template>
    <div>
        <p class="text-shadow">
            BN application input:
            <span :class="{ 'vote-fail': !selectedUser.isBnEvaluator, 'vote-pass': selectedUser.isBnEvaluator }">
                {{ selectedUser.isBnEvaluator ? 'Enabled' : 'Disabled' }}
            </span>
            <button
                class="btn btn-sm ml-2"
                :class="{ 'btn-nat-green': !selectedUser.isBnEvaluator, 'btn-nat-red': selectedUser.isBnEvaluator }"
                data-toggle="tooltip"
                data-placement="top"
                title="Toggle ability to give input on BN applications"
                @click="switchBnEvaluator($event)"
            >
                {{ selectedUser.isBnEvaluator ? 'Disable' : 'Enable' }}
            </button>
        </p>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import postData from '../../../mixins/postData.js';

export default {
    name: 'BnEvaluatorToggle',
    mixins: [postData],
    computed: {
        ...mapGetters([
            'selectedUser',
        ]),
    },
    methods: {
        async switchBnEvaluator(e) {
            const user = await this.executePost('/users/switchBnEvaluator/' + this.selectedUser.id, { isBnEvaluator: this.selectedUser.isBnEvaluator }, e);

            if (user) {
                if (user.error) {
                    this.info = user.error;
                } else {
                    this.$store.dispatch('updateUser', user);
                    this.$store.dispatch('updateToastMessages', {
                        message: `toggled BN evaluator`,
                        type: 'info',
                    });
                }
            }
        },
    },
};
</script>