<template>
    <div class="container">
        <div class="row">
            <div class="col-sm-6">
                <div>Where do you take requests from?</div>
                <small class="text-secondary">
                    Displayed on the home page. Changes are only visible after refreshing
                </small>
            </div>

            <div class="col-sm-6">
                <div class="form-check">
                    <input
                        id="settings-requests-game-chat"
                        v-model="requestStatus"
                        value="gameChat"
                        type="checkbox"
                        class="form-check-input"
                        @change="updateRequestStatus"
                    >
                    <label
                        class="form-check-label text-secondary"
                        for="settings-requests-game-chat"
                    >
                        In-game chat
                    </label>
                </div>
                <div class="form-check">
                    <input
                        id="settings-requests-personal"
                        v-model="requestStatus"
                        value="personalQueue"
                        type="checkbox"
                        class="form-check-input"
                        @change="updateRequestStatus"
                    >
                    <label
                        class="form-check-label text-secondary"
                        for="settings-requests-personal"
                    >
                        Personal queue
                    </label>
                    <template v-if="hasPersonalQueue">
                        <div class="input-group">
                            <input
                                v-model="requestLink"
                                type="text"
                                class="form-control"
                                placeholder="Link your modding queue/form..."
                            >
                            <div class="input-group-append">
                                <button
                                    class="btn btn-sm btn-outline-success"
                                    type="button"
                                    @click="updateRequestStatus"
                                >
                                    <i class="fas fa-save" />
                                </button>
                            </div>
                        </div>
                    </template>
                </div>
                <div class="form-check">
                    <input
                        id="settings-requests-closed"
                        v-model="requestStatus"
                        value="closed"
                        type="checkbox"
                        class="form-check-input"
                        @change="updateRequestStatus"
                    >
                    <label
                        class="form-check-label text-secondary"
                        for="settings-requests-closed"
                    >
                        Closed
                    </label>
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
            requestStatus: [],
            requestLink: '',
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        /** @returns {boolean} */
        hasPersonalQueue () {
            return this.requestStatus.includes('personalQueue');
        },
    },
    created () {
        this.requestStatus = this.loggedInUser.requestStatus;
        this.requestLink = this.loggedInUser.requestLink;
    },
    methods: {
        async updateRequestStatus (e) {
            await this.$http.executePost(`/users/${this.loggedInUser.id}/updateRequestStatus`, {
                requestStatus: this.requestStatus,
                requestLink: this.requestLink,
            }, e);
        },
    },
};
</script>
