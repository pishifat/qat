<template>
    <a
        :href="'https://osu.ppy.sh/beatmapsets/' + beatmapsetId"
        target="_blank"
        class="beatmap-thumbnail shadow"
        :style="`background-image: url(https://b.ppy.sh/thumb/${beatmapsetId}.jpg)`"
    />
</template>

<script>
export default {
    name: 'BeatmapThumbnail',
    props: {
        beatmapsetId: {
            type: Number,
            required: true,
        },
    },
};
</script>

<style>

.beatmap-thumbnail {
    width: 80px;
    height: 60px;
    border-top-left-radius: 5px;
    background-repeat: no-repeat;
    background-size: cover;
}

</style>
