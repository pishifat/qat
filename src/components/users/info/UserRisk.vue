<template>
    <div v-if="userId">
        <risk-card
            v-for="mode in displayModes"
            :key="mode"
            :result="resultFor(mode)"
            :loading="isLoading(mode)"
            :can-refresh="true"
            :title="cardTitle(mode)"
            :breakdown-id="'user-' + userId + '-' + mode"
            :empty-text="'Risk has not been calculated yet.'"
            @refresh="load(mode, $event)"
        />
    </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import RiskCard from '../../penalties/RiskCard.vue';

const GAMEPLAY_MODES = ['osu', 'taiko', 'catch', 'mania'];

export default {
    name: 'UserRisk',
    components: {
        RiskCard,
    },
    props: {
        refreshNonce: {
            type: Number,
            default: 0,
        },
    },
    data() {
        return {
            results: {},
            loadingModes: {},
        };
    },
    computed: {
        ...mapState(['loggedInUser']),
        ...mapGetters('users', ['selectedUser']),
        userId() {
            return this.selectedUser && this.selectedUser.id;
        },
        displayModes() {
            if (!this.selectedUser || !this.selectedUser.isBnOrNat) return [];

            return [...new Set(
                ((this.selectedUser.modes) || [])
                    .filter(mode => GAMEPLAY_MODES.includes(mode))
            )];
        },
    },
    watch: {
        userId: {
            immediate: true,
            handler() {
                this.results = {};
                this.loadingModes = {};
                this.load();
            },
        },
        refreshNonce() {
            this.load();
        },
    },
    methods: {
        resultFor(mode) {
            return this.results[mode] || null;
        },
        isLoading(mode) {
            return Boolean(this.loadingModes[mode]);
        },
        cardTitle(mode) {
            if (this.displayModes.length < 2) return 'Evaluation Risk';

            return 'Evaluation Risk · ' + this.formatMode(mode);
        },
        setLoading(modes, value) {
            const loadingModes = { ...this.loadingModes };

            for (const mode of modes) {
                loadingModes[mode] = value;
            }

            this.loadingModes = loadingModes;
        },
        async load(mode, e) {
            if (!this.userId || !this.displayModes.length) return;

            const userId = this.userId;
            const modes = mode ? [mode] : this.displayModes;
            let url = '/penalties/user/' + userId + '/risk';

            if (mode) url += '?mode=' + mode;

            this.setLoading(modes, true);

            const data = await this.$http.executeGet(url, e);

            if (this.userId !== userId) return;

            if (this.$http.isValid(data) && Array.isArray(data.results)) {
                const results = { ...this.results };

                for (const result of data.results) {
                    results[result.mode] = result;
                }

                this.results = results;
            }

            this.setLoading(modes, false);
        },
    },
};
</script>
