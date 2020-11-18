<template>
    <div class="text-truncate">
        <div class="text-truncate text-secondary small">
            {{ splitArtistTitle[0] }}
        </div>
        <a
            :href="'https://osu.ppy.sh/beatmapsets/' + beatmapsetId"
            target="_blank"
        >
            {{ splitArtistTitle[1] }}
        </a>
    </div>
</template>

<script>
export default {
    name: 'BeatmapMetadata',
    props: {
        artistTitle: {
            type: String,
            required: true,
        },
        beatmapsetId: {
            type: Number,
            required: true,
        },
    },
    computed: {
        /** @returns {Array} */
        splitArtistTitle() {
            return this.artistTitle.split(' - ');
        },
    },
};
</script>

<style scoped>

    .medium-small {
        font-size: 90%
    }

</style>

