<template>
    <div>
        <p>
            <b>
                {{ selectedUser.isNatOrTrialNat ? "Evaluations" : "Mock evaluations" }}:
            </b>
            <a
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Toggle evaluations"
                href="#"
                @click.prevent="switchBnEvaluator($event)"
            >
                <i v-if="selectedUser.isBnEvaluator" class="fas fa-check text-success" />
                <i v-else class="fas fa-times text-danger" />
            </a>
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