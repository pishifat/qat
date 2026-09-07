<template>
    <div>
        <p>
            <a :href="'#' + collapseId" data-bs-toggle="collapse">
                Penalties <i class="fas fa-angle-down" />
            </a>
        </p>

        <div :id="collapseId" class="collapse container mb-4">
            <div
                v-if="canCreate"
                class="d-flex flex-wrap align-items-center gap-2 mb-2"
            >
                <button
                    class="btn btn-sm btn-primary"
                    type="button"
                    @click="showForm = !showForm; editingId = null"
                >
                    {{ showForm && !editingId ? 'Close' : '+ Add' }}
                </button>
            </div>

            <div v-if="showForm && !editingId">
                <penalty-form
                    :user-id="userId"
                    :modes="modes"
                    :lock-mode="lockMode"
                    :initial-mode="initialMode || (modes[0] || '')"
                    @saved="onCreated"
                    @cancel="showForm = false"
                />
            </div>

            <p v-if="isLoading" class="small text-secondary">
                Loading penalties...
            </p>
            <p v-else-if="!penalties.length" class="small text-secondary">
                No penalties recorded.
            </p>
            <ul v-else class="list-unstyled mb-0">
                <li
                    v-for="penalty in penalties"
                    :key="penalty.id"
                    class="py-2"
                >
                    <div class="d-flex flex-wrap align-items-center gap-2 small">
                        <span class="text-secondary">{{ toStandardDate(penalty.createdAt) }}</span>
                        <span :class="severityClass(penalty.severity)">
                            {{ severityLabel(penalty.severity) }}
                        </span>
                        <span>· {{ typeLabel(penalty.type) }}</span>
                        <span v-if="!lockMode" class="text-secondary">· {{ formatMode(penalty.mode) }}</span>
                    </div>
                    <div>{{ penalty.reason }}</div>
                    <div class="small text-secondary">
                        Added by: {{ penalty.createdBy && penalty.createdBy.username }}
                        <a
                            v-if="penalty.canEdit"
                            href="#"
                            class="ms-2"
                            @click.prevent="startEdit(penalty)"
                        >
                            edit
                        </a>
                        <a
                            v-if="penalty.canDelete"
                            href="#"
                            class="ms-2 text-danger"
                            @click.prevent="remove(penalty)"
                        >
                            delete
                        </a>
                    </div>
                    <penalty-form
                        v-if="editingId === penalty.id"
                        class="mt-2"
                        :user-id="userId"
                        :modes="modes"
                        :lock-mode="lockMode"
                        :penalty="penalty"
                        @saved="onUpdated"
                        @cancel="editingId = null"
                    />
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import PenaltyForm from './PenaltyForm.vue';

export default {
    name: 'PenaltyHistory',
    components: {
        PenaltyForm,
    },
    props: {
        userId: {
            type: String,
            required: true,
        },
        modes: {
            type: Array,
            default() {
                return [];
            },
        },
        lockMode: {
            type: Boolean,
            default: false,
        },
        initialMode: {
            type: String,
            default: '',
        },
        canCreate: {
            type: Boolean,
            default: false,
        },
        startOpen: {
            type: Boolean,
            default: false,
        },
        refreshNonce: {
            type: Number,
            default: 0,
        },
    },
    emits: ['changed'],
    data() {
        return {
            penalties: [],
            isLoading: false,
            showForm: false,
            editingId: null,
        };
    },
    computed: {
        collapseId() {
            return 'penaltyHistory-' + this.userId;
        },
    },
    watch: {
        userId() {
            this.penalties = [];
            this.load();
        },
        initialMode() {
            this.penalties = [];
            this.load();
        },
        startOpen(value) {
            if (value) this.showForm = true;
        },
        refreshNonce() {
            this.load();
        },
    },
    mounted() {
        this.showForm = this.startOpen;
        this.load();
    },
    methods: {
        formatMode(mode) {
            if (mode === 'osu') return 'osu!';

            return 'osu!' + mode;
        },
        typeLabel(type) {
            switch (type) {
                case 'mappingQuality': return 'Mapping Quality';
                case 'moddingQuality': return 'Modding Quality';
                case 'behavior': return 'Behaviour';
                default: return 'Other';
            }
        },
        severityLabel(severity) {
            return severity ? severity.charAt(0).toUpperCase() + severity.slice(1) : '';
        },
        severityClass(severity) {
            if (severity === 'severe' || severity === 'major') return 'text-danger';
            if (severity === 'moderate') return 'text-warning';

            return 'text-success';
        },
        async load() {
            if (!this.penalties.length) this.isLoading = true;

            let url = '/penalties/user/' + this.userId;

            if (this.lockMode && this.initialMode) {
                url += '?mode=' + this.initialMode;
            }

            const data = await this.$http.executeGet(url);

            if (this.$http.isValid(data)) {
                this.penalties = data.penalties || [];
            }

            this.isLoading = false;
        },
        onCreated(penalty) {
            this.penalties.unshift(penalty);
            this.showForm = false;
            this.$emit('changed');
        },
        onUpdated(penalty) {
            const index = this.penalties.findIndex(item => item.id === penalty.id);

            if (index !== -1) this.penalties.splice(index, 1, penalty);

            this.editingId = null;
            this.$emit('changed');
        },
        startEdit(penalty) {
            this.showForm = false;
            this.editingId = penalty.id;
        },
        async remove(penalty) {
            if (!confirm('Delete this penalty? This cannot be undone.')) return;

            const data = await this.$http.executeDelete('/penalties/' + penalty.id);

            if (this.$http.isValid(data)) {
                this.penalties = this.penalties.filter(item => item.id !== penalty.id);
                this.$emit('changed');
            }
        },
    },
};
</script>
