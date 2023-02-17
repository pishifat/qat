<template>
    <div class="card-body">
        <p class="card-text">
            <user-link
                class="font-weight-bold"
                :osu-id="osuId"
                :username="username"
            />
            <i v-if="mode == 'osu'" class="far fa-circle mx-1" />
            <i v-else-if="mode == 'taiko'" class="fas fa-drum mx-1" />
            <i v-else-if="mode == 'catch'" class="fas fa-apple-alt mx-1" />
            <i v-else-if="mode == 'mania'" class="fas fa-stream mx-1" />
            <i
                v-if="feedback"
                data-toggle="tooltip"
                data-placement="top"
                :title="'feedback written' + (isReviewed ? ' (reviewed)' : ' (needs review)')"
                class="fas fa-comment mx-1"
                :class="isReviewed ? '' : 'text-warning'"
            />
        </p>
        <div v-if="consensus">
            Consensus:
            <span :class="consensusColor" class="text-capitalize">{{ consensusText }}</span>
        </div>
        <div v-if="addition && addition != 'none'">
            Addition:
            <span :class="consensusColor" class="text-capitalize">{{ additionText }}</span>
        </div>
    </div>
</template>

<script>
import evaluations from '../../../mixins/evaluations';
import UserLink from '../../../components/UserLink.vue';

export default {
    name: 'CardHeader',
    components: {
        UserLink,
    },
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
        isReviewed: {
            type: Boolean,
            default: false,
        },
    },
};
</script>
