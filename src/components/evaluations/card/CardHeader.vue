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
            <span :class="consensusColor">{{ consensusText }}</span>
        </div>
        <div v-if="addition && addition != 'none'">
            Addition:
            <span :class="consensusColor">{{ additionText }}</span>
        </div>
    </div>
</template>

<script>
import evaluations from '../../../mixins/evaluations';

export default {
    name: 'CardHeader',
    mixins: [ evaluations ],
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
        addition: {
            type: String,
            default: 'none',
        },
        feedback: {
            type: String,
            default: '',
        },
    },
};
</script>
