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
                    <a
                        class="font-weight-bold"
                        :href="`https://osu.ppy.sh/users/${veto.beatmapMapperId}`"
                        target="_blank"
                        @click.stop
                    >
                        {{ veto.beatmapMapper }}
                    </a>
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
                        {{ veto.deadline.slice(0, 10) }}
                    </span>
                    <span v-else class="small float-left">{{ veto.createdAt.slice(0, 10) }}</span>
                    <i v-if="veto.mode.indexOf('osu') >= 0" class="far fa-circle" />
                    <i v-else-if="veto.mode.indexOf('taiko') >= 0" class="fas fa-drum" />
                    <i v-else-if="veto.mode.indexOf('catch') >= 0" class="fas fa-apple-alt" />
                    <i v-else-if="veto.mode.indexOf('mania') >= 0" class="fas fa-stream" />
                    <span v-else>
                        <i class="far fa-circle" />
                        <i class="fas fa-drum" />
                        <i class="fas fa-apple-alt" />
                        <i class="fas fa-stream" />
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'VetoCard',
    props: {
        veto: {
            type: Object,
            required: true,
            beatmapId: Number,
            beatmapMapper: String,
            beatmapMapperId: Number,
            beatmapTitle: String,
            createdAt: Date,
            deadline: Date,
            id: String,
            mode: String,
            status: String,
        },
    },
    methods: {
        selectVeto () {
            this.$store.commit('setSelectedVetoId', this.veto.id);
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
    background: radial-gradient(var(--success), transparent 70%);
}

.status-bar-upheld {
    background: radial-gradient(var(--warning), transparent 70%);
}

.status-bar-wip {
    background: radial-gradient(var(--purple), transparent 70%);
}

.status-bar-withdrawn {
    background: radial-gradient(var(--danger), transparent 70%);
}

</style>
