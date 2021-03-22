<template>
    <div>
        <p>
            <b>BN application input:</b>
            <span :class="{ 'text-danger': !selectedUser.isBnEvaluator, 'text-success': selectedUser.isBnEvaluator }">
                {{ selectedUser.isBnEvaluator ? 'Enabled' : 'Disabled' }}
            </span>
            <button
                class="btn btn-sm ml-2"
                :class="{ 'btn-success': !selectedUser.isBnEvaluator, 'btn-danger': selectedUser.isBnEvaluator }"
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

export default {
    name: 'BnEvaluatorToggle',
    computed: {
        ...mapGetters('users', [
            'selectedUser',
        ]),
    },
    methods: {
        async switchBnEvaluator(e) {
            const data = await this.$http.executePost(`/users/${this.selectedUser.id}/switchBnEvaluator`, {}, e);

            if (this.$http.isValid(data)) {
                this.$store.commit('users/updateUser', data.user);
            }
        },
    },
};
</script>