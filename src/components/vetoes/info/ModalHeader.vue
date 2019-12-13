<template>
    <div class='modal-header text-dark' :class="`bg-${veto.status}`">
        <h5 class="modal-title">
            <a class="text-dark" :href="`https://osu.ppy.sh/beatmapsets/${veto.beatmapId}`" target="_blank">{{ veto.beatmapTitle }}</a> by
            <a class="text-dark" :href="`https://osu.ppy.sh/users/${veto.beatmapMapperId}`" target="_blank">{{ veto.beatmapMapper }}</a>
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
        </h5>
        <button type="button" class="close" data-dismiss="modal">
            <span>&times;</span>
        </button>
    </div>
</template>

<script>
export default {
    name: 'modal-header',
    props: {
        veto: {
            mode: String,
            beatmapId: Number,
            beatmapMapper: String,
            beatmapMapperId: Number,
            beatmapTitle: String,
            status: String
        }
    }
}
</script>

<style>
.bg-available {
    background-color: var(--available);
}

.bg-upheld {
    background-color: var(--upheld);
}

.bg-wip {
    background-color: var(--wip);
}

.bg-withdrawn {
    background-color: var(--withdrawn);
}
</style>
