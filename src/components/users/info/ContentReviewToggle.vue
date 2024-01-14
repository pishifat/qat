<template>
    <div>
        <p>
            <b>
                Content reviews:
            </b>
            <a
                class="ml-1"
                data-toggle="tooltip"
                data-placement="top"
                title="Toggle content review pings"
                href="#"
                @click.prevent="switchContentReview($event)"
            >
                <i v-if="selectedUser.isActiveContentReviewer" class="fas fa-check text-success" />
                <i v-else class="fas fa-times text-danger" />
            </a>
        </p>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'ContentReviewToggle',
    computed: {
        ...mapGetters('users', [
            'selectedUser',
        ]),
    },
    methods: {
        async switchContentReview(e) {
            const data = await this.$http.executePost(`/users/${this.selectedUser.id}/toggleIsActiveContentReviewer`, {}, e);

            if (this.$http.isValid(data)) {
                this.$store.commit('users/updateUser', data.user);
            }
        },
    },
};
</script>