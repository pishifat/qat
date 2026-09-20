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

        <div v-if="sync.inProgress" class="mb-3">
            <div class="d-flex justify-content-between small text-secondary mb-1">
                <span>Syncing</span>
                <span>{{ sync.current }} / {{ sync.total }} synced</span>
            </div>
            <div class="progress" style="height: 6px;">
                <div
                    class="progress-bar bg-bright-blue"
                    :style="{ width: syncPct + '%' }"
                />
            </div>
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
            sync: {
                inProgress: false,
                current: 0,
                total: 0,
            },
            loading: false,
            loaded: false,
            pollTimer: null,
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
        syncPct() {
            if (!this.sync.total) return 0;

            return Math.min(100, (this.sync.current / this.sync.total) * 100);
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
    beforeUnmount() {
        this.stopPoll();
    },
    methods: {
        scoreColor(score) {
            return riskColor(score) || '';
        },
        startPoll() {
            if (this.pollTimer) return;

            this.pollTimer = setInterval(() => this.load(true), 2500);
        },
        stopPoll() {
            if (!this.pollTimer) return;

            clearInterval(this.pollTimer);
            this.pollTimer = null;
        },
        async load(quiet) {
            if (!quiet) this.loading = true;

            const data = await this.$http.executeGet('/users/findModeRisk?mode=' + this.mode);

            if (this.$http.isValid(data)) {
                this.users = data.users || [];
                this.lastUpdated = data.lastUpdated || null;
                this.nextUpdate = data.nextUpdate || null;
                this.sync = data.sync || { inProgress: false, current: 0, total: 0 };
                this.loaded = true;

                if (this.sync.inProgress) this.startPoll();
                else this.stopPoll();
            }

            this.loading = false;
        },
    },
};
</script>
