<template>
    <div class="col-md-6 col-lg-4 my-2" @click="selectVeto()">
        <div
            class="card"
            :class="'border-' + veto.status"
            style="height: 100%"
            data-toggle="modal"
            data-target="#extendedInfo"
            :data-veto="veto.id"
        >
            <img :src="'https://assets.ppy.sh/beatmaps/' + veto.beatmapId + '/covers/card.jpg'" class="card-img" style="opacity: 0.25; overflow: hidden;">
            <div class="card-body veto-card-spacing">
                <p class="text-shadow">
                    <a :href="'https://osu.ppy.sh/beatmapsets/' + veto.beatmapId">{{ veto.beatmapTitle }}</a>
                    <i v-if="veto.mode.indexOf('osu') >= 0" class="far fa-circle"></i>
                    <i v-if="veto.mode.indexOf('taiko') >= 0" class="fas fa-drum"></i>
                    <i v-if="veto.mode.indexOf('catch') >= 0" class="fas fa-apple-alt"></i>
                    <i v-if="veto.mode.indexOf('mania') >= 0" class="fas fa-stream"></i>
                </p>
                <p class="small text-shadow">Hosted by <a :href="'https://osu.ppy.sh/users/' + veto.beatmapMapperId">{{ veto.beatmapMapper }}</a></p>
                <p class="small text-shadow">{{ veto.createdAt.slice(0, 10) }}</p>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'veto-card',
    props: ['veto', 'user-id'],
    methods: {
        selectVeto: function() {
            this.$emit('update:selectedVeto', this.veto);
        },
    },
    computed: {
        fullTitle: function() {
            if (this.veto.beatmapTitle) {
                return this.veto.beatmapTitle + ' by ' + this.veto.beatmapMapper;
            } else {
                return 'something';
            }
        },
    },
};
</script>

<style>
.border-available {
    border-top: 5px solid var(--available);
}
.border-wip {
    border-top: 5px solid var(--wip);
}
.border-upheld {
    border-top: 5px solid var(--upheld);
}
.border-withdrawn {
    border-top: 5px solid var(--withdrawn);
}

.veto-card-spacing{
    margin: 0;
    padding: 0.5rem 0.75rem 0.75rem 0.75rem;
    position: absolute; 
}

.card-img{
    min-width: 100%;
    position: relative;
    opacity: 0.5;
    object-fit: cover;
}

</style>
