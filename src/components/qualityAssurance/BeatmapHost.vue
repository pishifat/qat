<template>
    <div class="small">
        <div class="text-secondary">
            Hosted by
        </div>

        <div class="text-truncate">
            <user-link
                :osu-id="creatorId"
                :username="creatorName"
                @click.stop
            />
        </div>
    </div>
</template>

<script>
import UserLink from '../UserLink.vue';

export default {
    name: 'BeatmapHost',
    components: {
        UserLink,
    },
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

