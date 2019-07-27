<template>
    <div class="col-md-6 col-lg-4 my-2" @click="selectVeto()">
        <div
            class="card"
            data-toggle="modal"
            data-target="#extendedInfo"
            :data-veto="veto.id"
        >
            <img :src="'https://assets.ppy.sh/beatmaps/' + veto.beatmapId + '/covers/card.jpg'" class="card-img">
            <div class="card-body">
                <p class="text-shadow wrap-text">
                    <a :href="'https://osu.ppy.sh/beatmapsets/' + veto.beatmapId" target="_blank" @click.stop>{{ veto.beatmapTitle || '...' }}</a>
                    
                </p>
                <p class="small text-shadow">Hosted by <a :href="'https://osu.ppy.sh/users/' + veto.beatmapMapperId" target="_blank" @click.stop>{{ veto.beatmapMapper }}</a></p>
                
                <div class="veto-status my-auto" :class="`status-bar-${veto.status}`"></div>
                <div class="card-icons">
                    <span v-if="veto.status == 'wip'" class="small text-shadow float-left">
                        <i class="fas fa-clock mx-1"
                            data-toggle="tooltip"
                            data-placement="top"
                            title="deadline">
                        </i>
                        <span class="errors">{{ veto.deadline.slice(0, 10) }}</span>
                    </span>
                    <span v-else class="small text-shadow float-left">{{ veto.createdAt.slice(0, 10) }}</span>
                    <i v-if="veto.mode.indexOf('osu') >= 0" class="far fa-circle"></i>
                    <i v-else-if="veto.mode.indexOf('taiko') >= 0" class="fas fa-drum"></i>
                    <i v-else-if="veto.mode.indexOf('catch') >= 0" class="fas fa-apple-alt"></i>
                    <i v-else-if="veto.mode.indexOf('mania') >= 0" class="fas fa-stream"></i>
                    <span v-else>
                        <i class="far fa-circle"></i>
                        <i class="fas fa-drum"></i>
                        <i class="fas fa-apple-alt"></i>
                        <i  class="fas fa-stream"></i>
                    </span>
                </div>
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
};
</script>

<style>
.status-bar-available {
    background: radial-gradient(var(--available), transparent 70%);
}
.status-bar-wip {
    background: radial-gradient(var(--wip), transparent 70%);
}
.status-bar-upheld {
    background: radial-gradient(var(--upheld), transparent 70%);
}
.status-bar-withdrawn {
    background: radial-gradient(var(--withdrawn), transparent 70%);
}

.veto-status {
    height: 5px;
    margin: 5px 0;
}

.card-icons {
    text-align: right;
}

.card {
    overflow: hidden;
}

</style>
