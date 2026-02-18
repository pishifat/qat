<template>
    <div class="container">
        <div>Evaluations required</div>
        <small class="text-secondary">
            Number of evaluations required before an application/BN eval is moved to group discussion. If a mode has BN Evaluators enabled, this number will be subtracted by 1 and applied to both NAT and BN assignments (e.g. setting is 3 --> 2 NAT and 2 BN will be assigned per evaluation)
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
                <a
                    href="#"
                    data-bs-toggle="tooltip"
                    data-bs-placement="right"
                    title="toggle BN Evaluators for mode"
                    @click.prevent="toggleHasTrialNat(setting.mode, $event)"
                >
                    <font-awesome-icon
                        icon="fa-solid fa-circle-check"
                        :class="
                            setting.hasTrialNat
                                ? 'text-success'
                                : 'text-secondary'
                        "
                    />
                </a>
                {{ formatMode(setting.mode) }}
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
                <button class="btn btn-sm btn-success" @click="update($event)">
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
        };
    },
    computed: mapState([
        'loggedInUser',
    ]),
    async created () {
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
        async toggleHasTrialNat (mode, e) {
            await this.$http.executePost(`/settings/toggleHasTrialNat`, {
                mode,
            }, e);

            await this.fetchSettings();
        },
    },
};
</script>
