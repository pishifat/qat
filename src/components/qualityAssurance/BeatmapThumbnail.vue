<template>
    <div>
        <a
            :href="'https://osu.ppy.sh/beatmapsets/' + beatmapsetId"
            target="_blank"
            class="text-shadow"
        >
            <img
                class="beatmap-thumbnail"
                :src="'https://b.ppy.sh/thumb/' + beatmapsetId + '.jpg'"
            >
        </a>
    </div>
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
        box-shadow: 1px 1px 1px 1px rgb(12, 14, 17);
    }
</style>

