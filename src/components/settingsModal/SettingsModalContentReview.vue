<template>
    <div class="container">
        <div class="row">
            <div class="col-sm-6">
                <div>Do you want to get notified for content reviews?</div>
                <span class="text-secondary small">
                    You'll get a ping upon creation, and when a deadline is soon
                </span>
            </div>
            <div class="col-sm-6">
                <div class="form-check">
                    <input
                        id="settings-content-review"
                        :checked="loggedInUser.isActiveContentReviewer"
                        type="checkbox"
                        class="form-check-input"
                        @change="toggleContentReviewPings"
                    >
                    <label
                        class="form-check-label text-secondary"
                        for="settings-content-review"
                    >
                    Content review pings
                    </label>
                </div>
                <span class="text-danger small" v-if="!loggedInUser.discordId">
                    Make sure to set your Discord ID below for this to work!
                </span>
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
        async toggleContentReviewPings (e) {
            await this.$http.executePost(`/users/${this.loggedInUser.id}/toggleIsActiveContentReviewer`, {}, e);
        },
    },
};
</script>
