<template>
    <div class="card border-secondary mb-3">
        <div class="card-body">
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div class="d-flex flex-wrap align-items-center gap-2">
                    <b>Evaluation Risk</b>
                    <span
                        v-if="result"
                        class="badge rounded-pill risk-level-badge"
                        :class="levelBadgeClass"
                    >
                        {{ result.level }}
                        <span v-if="result.limitedHistory" class="ms-1">· LIMITED HISTORY</span>
                    </span>
                </div>
                <button
                    v-if="canRefresh"
                    class="btn btn-sm btn-secondary"
                    type="button"
                    :disabled="loading"
                    @click="$emit('refresh', $event)"
                >
                    {{ refreshButtonLabel }}
                </button>
            </div>

            <template v-if="result">
                <p class="mb-1 mt-2">
                    <span class="fs-4">{{ result.score }}</span>
                    <span class="text-secondary"> / 100</span>
                </p>

                <ul v-if="policyMessages.length" class="small mb-2 ps-3">
                    <li
                        v-for="message in policyMessages"
                        :key="message"
                        class="text-warning"
                    >
                        {{ message }}
                    </li>
                </ul>

                <div v-if="result.contributors && result.contributors.length">
                    <div class="small text-secondary">Main signals</div>
                    <ul class="small mb-2 ps-3">
                        <li
                            v-for="signal in mainSignals"
                            :key="signal.type + signal.id"
                        >
                            <template v-if="signal.sev">
                                SEV <span :class="sevColorClass(signal.sev)">{{ signal.sev.obviousness }}/{{ signal.sev.severity }}</span>{{ signal.rest }}
                            </template>
                            <template v-else>
                                {{ signal.label }}
                            </template>
                        </li>
                    </ul>
                </div>
                <p v-else class="small text-secondary mb-2">
                    No recent evidence of elevated concern.
                </p>

                <p v-if="result.guidance" class="small mb-2">
                    <b>Evaluator guidance</b><br>
                    {{ result.guidance }}
                </p>

                <p class="mb-0">
                    <a :href="'#' + collapseId" data-bs-toggle="collapse">
                        Risk breakdown <i class="fas fa-angle-down" />
                    </a>
                </p>
                <div :id="collapseId" class="collapse mt-2 pt-2">
                    <div
                        v-for="row in componentRows"
                        :key="row.key"
                        class="mb-2"
                    >
                        <div class="d-flex justify-content-between small mb-1">
                            <span class="text-secondary">{{ row.label }}</span>
                            <span class="risk-value">{{ row.display }}</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div
                                class="progress-bar"
                                :class="row.barClass"
                                :style="{ width: row.pct + '%' }"
                            />
                        </div>
                    </div>
                    <hr>
                    <div class="d-flex justify-content-between small pt-2 mt-1">
                        <span class="text-secondary">Policy floor</span>
                        <span :class="policyFloorClass">{{ policyFloorLabel }}</span>
                    </div>
                    <div class="d-flex justify-content-between small mt-1">
                        <span class="text-secondary">Final score</span>
                        <span class="risk-value" :class="levelTextClass">{{ result.score }}</span>
                    </div>
                </div>
            </template>
            <p v-else-if="loading" class="small text-secondary mb-0 mt-2">
                Calculating evaluation risk...
            </p>
            <p v-else class="small text-secondary mb-0 mt-2">
                {{ canRefresh
                    ? 'Risk has not been calculated for this evaluation.'
                    : 'Risk was not calculated for this evaluation.' }}
            </p>
        </div>
    </div>
</template>

<script>
export default {
    name: 'RiskCard',
    props: {
        result: {
            type: Object,
            default: null,
        },
        loading: {
            type: Boolean,
            default: false,
        },
        canRefresh: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['refresh'],
    computed: {
        levelBadgeClass() {
            const level = this.result && this.result.level;

            if (level === 'HIGH') return 'bg-danger';
            if (level === 'MEDIUM') return 'bg-warning text-dark';

            return 'bg-success';
        },
        policyMessages() {
            const messages = [];
            const policy = this.result && this.result.policy;

            if (!policy) return messages;

            if (policy.sameTypeWarningKick) {
                messages.push('⚠ Policy status: Repeated warning of same type within 12 months');
            }

            if (policy.highScrutiny) {
                messages.push('⚠ High scrutiny: Two warning categories within 12 months');
            }

            if (policy.activeSevereConcern) {
                messages.push('⚠ Active severe concern recorded');
            }

            return messages;
        },
        policyFloorLabel() {
            const floor = this.result && this.result.policy && this.result.policy.floor;

            if (floor === 'oneWarning') return 'one warning (30)';
            if (floor === 'twoWarnings') return 'two warnings (60)';
            if (floor === 'highScrutiny') return 'high scrutiny (60)';
            if (floor === 'severeConcern') return 'severe concern (80)';

            return 'none';
        },
        policyFloorClass() {
            return this.result && this.result.policy && this.result.policy.floor
                ? 'text-warning'
                : 'text-secondary';
        },
        levelTextClass() {
            const level = this.result && this.result.level;

            if (level === 'HIGH') return 'text-danger';
            if (level === 'MEDIUM') return 'text-warning';

            return 'text-success';
        },
        componentRows() {
            const components = (this.result && this.result.components) || {};
            const scale = 0.4;

            return [
                { key: 'evaluation', label: 'Evaluation history', value: components.evaluation, barClass: 'bg-info' },
                { key: 'dq', label: 'DQ history', value: components.dq, barClass: 'bg-warning' },
                { key: 'penalty', label: 'Penalty history', value: components.penalty, barClass: 'bg-danger' },
                { key: 'conduct', label: 'Conduct', value: components.conduct, barClass: 'bg-secondary' },
            ].map(row => ({
                ...row,
                display: this.formatComponent(row.value),
                pct: row.value == null ? 0 : Math.min(100, (Number(row.value) / scale) * 100),
            }));
        },
        refreshButtonLabel() {
            if (this.loading) return this.result ? 'Updating...' : 'Calculating...';

            return this.result ? 'Update' : 'Calculate';
        },
        collapseId() {
            const stamp = this.result && this.result.calculatedAt
                ? String(this.result.calculatedAt).replace(/[^0-9]/g, '')
                : 'current';

            return 'riskBreakdown-' + stamp;
        },
        mainSignals() {
            const contributors = (this.result && this.result.contributors) || [];

            return contributors.slice(0, 5).map((contributor) => {
                const sev = this.parseSev(contributor);
                const rest = sev && contributor.label
                    ? String(contributor.label).replace(/^SEV \d+\/\d+/, '')
                    : '';

                return {
                    ...contributor,
                    sev,
                    rest,
                };
            });
        },
    },
    methods: {
        formatComponent(value) {
            if (value === null || value === undefined) return '—';

            return Number(value).toFixed(2);
        },
        parseSev(contributor) {
            if (contributor.obviousness != null && contributor.severity != null) {
                return {
                    obviousness: contributor.obviousness,
                    severity: contributor.severity,
                };
            }

            const match = contributor.label && String(contributor.label).match(/^SEV (\d+)\/(\d+)/);

            if (!match) return null;

            return {
                obviousness: Number(match[1]),
                severity: Number(match[2]),
            };
        },
        sevColorClass(sev) {
            const total = Number(sev.obviousness) + Number(sev.severity);

            if (total >= 4 || Number(sev.obviousness) == 2 || Number(sev.severity) == 3) return 'text-danger';
            if (total >= 2) return 'text-neutral';

            return 'text-success';
        },
    },
};
</script>

<style scoped>
.risk-value {
    font-variant-numeric: tabular-nums;
}

.risk-level-badge {
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.2em 0.55em;
}

.progress {
    background-color: hsl(170, 15%, 12%);
    border-radius: 99px;
}

.progress-bar {
    border-radius: 99px;
}
</style>
