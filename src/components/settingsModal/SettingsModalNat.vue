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
                    <div class="input-group-append">
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
        <hr>

        <div>Evaluations required</div>
        <small class="text-secondary">
            Number of evaluations required before an application/BN eval is moved to group discussion
        </small>

        <button v-if="!modeSettings.length" @click="create">
            init
        </button>

        <div
            v-for="(setting, i) in modeSettings"
            :key="i"
            class="row"
        >
            <label
                :for="`mode-settings-${setting.mode}`"
                class="col-sm-4 col-form-label"
            >
                {{ setting.mode }}
            </label>
            <div class="col-sm-8">
                <input
                    :id="`mode-settings-${setting.mode}`"
                    v-model="setting.evalsRequired"
                    type="number"
                    class="form-control"
                >
            </div>
        </div>

        <div class="row">
            <div class="col text-right">
                <button class="btn btn-success" @click="update">
                    Save
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
    data () {
        return {
            modeSettings: [],
            discordId: 0,
        };
    },
    computed: mapState([
        'loggedInUser',
    ]),
    async created () {
        this.discordId = this.loggedInUser.discordId;
        await this.fetchSettings();
    },
    methods: {
        async fetchSettings () {
            const settings = await this.$http.executeGet(`/settings`);

            if (!settings.error) {
                this.modeSettings = settings.modeSettings;
            }
        },
        async create (e) {
            await this.$http.executePost(`/settings/create`, {}, e);
            await this.fetchSettings();
        },
        async update (e) {
            await this.$http.executePost(`/settings/update`, {
                modeSettings: this.modeSettings,
            }, e);
        },
        async updateDiscordId (e) {
            await this.$http.executePost(`/users/updateDiscordId`, {
                discordId: this.discordId,
            }, e);
        },
    },
};
</script>
