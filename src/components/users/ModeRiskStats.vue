<template>
    <div>
        <div class="d-flex flex-wrap align-items-center gap-2 my-2">
            <select v-model="mode" class="form-select w-auto" :disabled="loading">
                <option value="osu">
                    osu!
                </option>
                <option value="taiko">
                    osu!taiko
                </option>
                <option value="catch">
                    osu!catch
                </option>
                <option value="mania">
                    osu!mania
                </option>
            </select>
        </div>

        <p v-if="loaded" class="small text-secondary mb-2">
            Last updated: {{ lastUpdatedLabel }}
            <br>
            Next update: {{ nextUpdateLabel }}
        </p>

        <p v-if="loading" class="small text-secondary mb-2">
            Loading...
        </p>

        <div v-for="user in users" :key="user.id">
            <b>
                <user-link
                    :osu-id="user.osuId"
                    :username="user.username"
                />
                —
                <span :style="{ color: scoreColor(user.score) }">{{ user.score }}</span>
            </b>
        </div>

        <p v-if="loaded && !users.length && !loading" class="small text-secondary mb-0">
            No stored risk for this mode yet.
        </p>
    </div>
</template>

<script>
import UserLink from '../UserLink.vue';
import { riskColor } from '../../helpers/riskColor';

export default {
    name: 'ModeRiskStats',
    components: {
        UserLink,
    },
    data() {
        return {
            mode: 'osu',
            users: [],
            lastUpdated: null,
            nextUpdate: null,
            loading: false,
            loaded: false,
        };
    },
    computed: {
        lastUpdatedLabel() {
            if (!this.lastUpdated) return 'not synced yet';

            return this.toRelativeDate(this.lastUpdated) + ' (' + this.toStandardDetailedDate(this.lastUpdated) + ')';
        },
        nextUpdateLabel() {
            if (!this.nextUpdate) return '—';

            return this.toRelativeDate(this.nextUpdate) + ' (' + this.toStandardDetailedDate(this.nextUpdate) + ')';
        },
    },
    watch: {
        mode() {
            this.load();
        },
    },
    created() {
        this.load();
    },
    methods: {
        scoreColor(score) {
            return riskColor(score) || '';
        },
        async load() {
            this.loading = true;

            const data = await this.$http.executeGet('/users/findModeRisk?mode=' + this.mode);

            if (this.$http.isValid(data)) {
                this.users = data.users || [];
                this.lastUpdated = data.lastUpdated || null;
                this.nextUpdate = data.nextUpdate || null;
                this.loaded = true;
            }

            this.loading = false;
        },
    },
};
</script>
