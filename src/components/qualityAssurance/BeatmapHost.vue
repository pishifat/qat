<template>
    <div class="small">
        <div>Hosted by</div>

        <div class="text-truncate">
            <a
                :href="'https://osu.ppy.sh/users/' + creatorId"
                target="_blank"
                @click.stop
            >
                {{ creatorName }}
            </a>
        </div>
    </div>
</template>

<script>
export default {
    name: 'BeatmapHost',
    props: {
        creatorName: {
            type: String,
            required: true,
        },
        creatorId: {
            type: Number,
            required: true,
        },
    },
};
</script>

