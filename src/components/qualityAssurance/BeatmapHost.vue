<template>
    <div class="small mt-2 d-flex align-items-center">
        <div class="col-sm-12">
            Hosted by
        </div>
        <div class="col-sm-12 truncate">
            <a
                :href="'https://osu.ppy.sh/users/' + hostId"
                target="_blank"
                @click.stop
            >{{ hostName }}</a>
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

