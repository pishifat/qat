<template>
    <section class="card card-body position-relative overflow-hidden">
        <img
            v-if="selectedVeto"
            :src="`https://assets.ppy.sh/beatmaps/${selectedVeto.beatmapId}/covers/slimcover.jpg`"
            class="card-img"
            alt=""
        >
        <div class="d-flex flex-wrap align-items-center gap-2 position-relative">
            <router-link to="/vetoes" class="text-decoration-none">
                <i class="fas fa-arrow-left" />
                Back
            </router-link>
            <span class="text-muted">|</span>
            <a :href="`https://osu.ppy.sh/beatmapsets/${selectedVeto.beatmapId}`" target="_blank" class="text-decoration-none">
                <b>{{ selectedVeto.beatmapTitle }}</b>
            </a>
            <span class="text-muted">by</span>
            <user-link
                class="fw-bold"
                :osu-id="selectedVeto.beatmapMapperId"
                :username="selectedVeto.beatmapMapper"
            />
            <mode-display
                :modes="selectedVeto.mode"
                :show-all="true"
            />
            <span
                class="badge rounded-pill ms-2"
                :class="statusPillClass"
            >
                {{ statusLabel }}
            </span>
        </div>
    </section>
</template>

<script>
import { mapGetters } from 'vuex';
import ModeDisplay from '../../ModeDisplay.vue';
import UserLink from '../../UserLink.vue';

const STATUS_LABELS = {
    pending: 'Pending',
    chatroom: 'Active Chatroom',
    available: 'Requesting Mediation',
    wip: 'Mediation in Progress',
    archive: 'Archived',
};

const STATUS_PILL_CLASSES = {
    pending: 'bg-secondary text-dark',
    chatroom: 'bg-success',
    available: 'bg-danger',
    wip: 'bg-warning text-dark',
    archive: 'bg-primary',
};

export default {
    name: 'VetoDetailHeader',
    components: {
        ModeDisplay,
        UserLink,
    },
    computed: {
        ...mapGetters('vetoes', ['selectedVeto']),
        statusLabel() {
            return this.selectedVeto ? STATUS_LABELS[this.selectedVeto.status] || this.selectedVeto.status : '';
        },
        statusPillClass() {
            return this.selectedVeto ? STATUS_PILL_CLASSES[this.selectedVeto.status] || 'bg-secondary text-dark' : 'bg-secondary text-dark';
        },
    },
};
</script>

<style scoped>
.card-img {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    opacity: 0.3;
    object-fit: cover;
}
</style>
