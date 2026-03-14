<template>
    <div class="col-md-6 col-lg-4 my-2">
        <router-link
            :to="'/vetoes/' + veto.id"
            class="card card-individual text-decoration-none text-body"
            :data-veto="veto.id"
        >
            <img :src="`https://assets.ppy.sh/beatmaps/${veto.beatmapId}/covers/card.jpg`" class="card-img">
            <div class="card-body">
                <div class="text-truncate">
                    <a
                        :href="`https://osu.ppy.sh/beatmapsets/${veto.beatmapId}`"
                        target="_blank"
                        @click.stop
                    >
                        <b>{{ veto.beatmapTitle || '...' }}</b>
                    </a>
                </div>
                <div class="small">
                    Hosted by
                    <user-link
                        class="fw-bold"
                        :osu-id="veto.beatmapMapperId"
                        :username="veto.beatmapMapper"
                        @click.stop
                    />
                </div>

                <div class="card-status" :class="`status-bar-${veto.status}`" />
                <div class="card-icons">
                    <span v-if="veto.status === 'wip'" class="small float-start">
                        <i
                            class="fas fa-clock mx-1"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="deadline"
                        />
                        <date-display :date="veto.deadline" />
                    </span>

                    <date-display
                        v-else
                        class="small float-start"
                        :date="veto.createdAt"
                    />

                    <mode-display
                        :modes="veto.mode"
                        :show-all="true"
                    />
                </div>
            </div>
        </router-link>
    </div>
</template>

<script>
import ModeDisplay from '../ModeDisplay.vue';
import DateDisplay from '../DateDisplay.vue';
import UserLink from '../UserLink.vue';

export default {
    name: 'VetoCard',
    components: {
        ModeDisplay,
        DateDisplay,
        UserLink,
    },
    props: {
        veto: {
            type: Object,
            required: true,
        },
    },
};
</script>

<style scoped>

.card-img {
    width: 100%;
    height: 100%;
    position: absolute;
    opacity: 0.3;
    overflow: hidden;
    object-fit: cover;
}

.status-bar-pending {
    background: radial-gradient(var(--bs-neutral), transparent 70%);
}

.status-bar-chatroom {
    background: radial-gradient(var(--bs-gmt), transparent 70%);
}

.status-bar-available {
    background: radial-gradient(var(--bs-danger), transparent 70%);
}

.status-bar-wip {
    background: radial-gradient(var(--bs-warning), transparent 70%);
}

.status-bar-archive {
    background: radial-gradient(var(--bs-success), transparent 70%);
}

</style>
