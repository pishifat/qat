<template>
    <div class="container">
        <div class="row">
            <div class="col-sm-6">
                <div>Do you want to show explicit content?</div>
                <small class="text-secondary">
                    For transparency, votes about explicit content usage can be viewed from the <a href="/discussionvote">Content Review</a> section of this website.
                </small>
            </div>
            <div class="col-sm-6">
                <div class="form-check">
                    <input
                        id="settings-explicit"
                        :checked="loggedInUser.showExplicitContent"
                        type="checkbox"
                        class="form-check-input"
                        @change="toggleShowExplicitContent"
                    >
                    <label
                        class="form-check-label text-secondary"
                        for="settings-explicit"
                    >
                        Show explicit content
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
        async toggleShowExplicitContent (e) {
            await this.$http.executePost(`/users/${this.loggedInUser.id}/toggleShowExplicitContent`, {}, e);
        },
    },
};
</script>
