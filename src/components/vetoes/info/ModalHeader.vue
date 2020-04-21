<template>
    <div class="modal-header text-dark" :class="`bg-${status}`">
        <h5 class="modal-title">
            <a class="text-dark" :href="`https://osu.ppy.sh/beatmapsets/${beatmapId}`" target="_blank">{{ beatmapTitle }}</a> by
            <a class="text-dark" :href="`https://osu.ppy.sh/users/${beatmapMapperId}`" target="_blank">{{ beatmapMapper }}</a>
            <i v-if="mode.indexOf('osu') >= 0" class="far fa-circle" />
            <i v-else-if="mode.indexOf('taiko') >= 0" class="fas fa-drum" />
            <i v-else-if="mode.indexOf('catch') >= 0" class="fas fa-apple-alt" />
            <i v-else-if="mode.indexOf('mania') >= 0" class="fas fa-stream" />
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
    name: 'ModalHeader',
    props: {
        mode: {
            type: String,
            required: true,
        },
        beatmapId: {
            type: Number,
            required: true,
        },
        beatmapMapper: {
            type: String,
            required: true,
        },
        beatmapMapperId: {
            type: Number,
            required: true,
        },
        beatmapTitle: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            required: true,
        },
    },
};
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
