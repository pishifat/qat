<template>
    <div class="container">
        <div class="row">
            <div class="col-sm-4">
                <div>Your Discord ID</div>
                <small class="text-secondary">
                    Used for deadline-related highlights
                </small>
            </div>
            <div class="col-sm-8">
                <div class="input-group">
                    <input
                        v-model="discordId"
                        type="number"
                        class="form-control"
                        placeholder="ID..."
                    >
                    <button
                        class="btn btn-sm btn-outline-success"
                        type="button"
                        @click="updateDiscordId"
                    >
                        <i class="fas fa-save" />
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
    data () {
        return {
            discordId: 0,
        };
    },
    computed: mapState([
        'loggedInUser',
    ]),
    created () {
        this.discordId = this.loggedInUser.discordId;
    },
    methods: {
        async updateDiscordId (e) {
            await this.$http.executePost(`/users/updateDiscordId`, {
                discordId: this.discordId,
            }, e);
        },
    },
};
</script>
