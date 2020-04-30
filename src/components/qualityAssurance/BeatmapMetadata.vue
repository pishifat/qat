<template>
    <div class="mt-2 ml-1">
        <div class="col-sm-12">
            <div class="medium-small truncate text-light">
                {{ splitMetadata[0] }}
            </div>
        </div>
        <div class="col-sm-12">
            <div class="truncate">
                <a
                    :href="'https://osu.ppy.sh/beatmapsets/' + beatmapsetId"
                    target="_blank"
                    class="text-shadow"
                >
                    {{ splitMetadata[1] }}
                </a>
            </div>
        </div>
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

