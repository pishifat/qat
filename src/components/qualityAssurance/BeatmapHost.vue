<template>
    <div class="small">
        <div>Hosted by</div>

        <div class="text-truncate">
            <a
                :href="'https://osu.ppy.sh/users/' + hostId"
                target="_blank"
                @click.stop
            >
                {{ hostName }}
            </a>
        </div>
    </div>
</template>

<script>
export default {
    name: 'BeatmapHost',
    props: {
        hostName: {
            type: String,
            required: true,
        },
        hostId: {
            type: Number,
            required: true,
        },
    },
};
</script>

