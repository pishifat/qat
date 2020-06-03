<template>
    <div class="text-truncate">
        <div class="text-truncate text-secondary">
            {{ splitMetadata[0] }}
        </div>
        <a
            :href="'https://osu.ppy.sh/beatmapsets/' + beatmapsetId"
            target="_blank"
        >
            {{ splitMetadata[1] }}
        </a>
    </div>
</template>

<script>
export default {
    name: 'BeatmapMetadata',
    props: {
        metadata: {
            type: String,
            required: true,
        },
        beatmapsetId: {
            type: Number,
            required: true,
        },
    },
    computed: {
        splitMetadata() {
            return this.metadata.split(' - ');
        },
    },
};
</script>

<style scoped>

    .medium-small {
        font-size: 90%
    }

</style>

