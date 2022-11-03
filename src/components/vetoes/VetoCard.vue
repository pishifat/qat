<template>
    <div class="col-md-6 col-lg-4 my-2" @click="selectVeto()">
        <div
            class="card card-individual"
            data-toggle="modal"
            data-target="#extendedInfo"
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
                        class="font-weight-bold"
                        :osu-id="veto.beatmapMapperId"
                        :username="veto.beatmapMapper"
                        @click.stop
                    />
                </div>

                <div class="card-status" :class="`status-bar-${veto.status}`" />
                <div class="card-icons">
                    <span v-if="veto.status === 'wip'" class="small float-left">
                        <i
                            class="fas fa-clock mx-1"
                            data-toggle="tooltip"
                            data-placement="top"
                            title="deadline"
                        />
                        <date-display :date="veto.deadline" />
                    </span>

                    <date-display
                        v-else
                        class="small float-left"
                        :date="veto.createdAt"
                    />

                    <mode-display
                        :modes="veto.mode"
                        :show-all="true"
                    />
                </div>
            </div>
        </div>
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
    methods: {
        selectVeto () {
            this.$store.commit('vetoes/setSelectedVetoId', this.veto.id);

            if (this.$route.query.id !== this.veto.id) {
                this.$router.replace(`/vetoes?id=${this.veto.id}`);
            }
        },
    },
};
</script>

<style scoped>

.card-img {
    width: 100%;
    height: 100%;
    position: absolute;
    opacity: 0.2;
    overflow: hidden;
    object-fit: cover;
}

.status-bar-available {
    background: radial-gradient(var(--danger), transparent 70%);
}

.status-bar-wip {
    background: radial-gradient(var(--warning), transparent 70%);
}

.status-bar-archive {
    background: radial-gradient(var(--success), transparent 70%);
}

</style>
