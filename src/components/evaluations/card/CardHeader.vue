<template>
    <div class="card-body">
        <p class="card-text">
            <a :href="'https://osu.ppy.sh/users/' + osuId" target="_blank">
                <b>{{ username }}</b>
            </a>
            <i v-if="mode == 'osu'" class="far fa-circle mx-1" />
            <i v-else-if="mode == 'taiko'" class="fas fa-drum mx-1" />
            <i v-else-if="mode == 'catch'" class="fas fa-apple-alt mx-1" />
            <i v-else-if="mode == 'mania'" class="fas fa-stream mx-1" />
            <i
                v-if="feedback"
                data-toggle="tooltip"
                data-placement="top"
                title="feedback written"
                class="fas fa-comment mx-1"
            />
        </p>
        <div v-if="consensus">
            Consensus:
            <span :class="`text-${consensus}`">{{ consensus }}</span>
        </div>
    </div>
</template>

<script>
export default {
    name: 'CardHeader',
    props: {
        username: {
            type: String,
            required: true,
        },
        mode: {
            type: String,
            required: true,
        },
        osuId: {
            type: Number,
            required: true,
        },
        consensus: {
            type: String,
            default: '',
        },
        feedback: {
            type: String,
            default: '',
        },
    },
};
</script>
