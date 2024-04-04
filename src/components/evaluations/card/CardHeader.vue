<template>
    <div class="card-body">
        <p class="card-text">
            <user-link
                class="font-weight-bold"
                :osu-id="osuId"
                :username="username"
            />
            <i v-if="mode == 'osu'" class="osu-icon mx-1" />
            <i v-else-if="mode == 'taiko'" class="taiko-icon mx-1" />
            <i v-else-if="mode == 'catch'" class="catch-icon mx-1" />
            <i v-else-if="mode == 'mania'" class="mania-icon mx-1" />
            <i v-if="isResignation" class="fas fa-walking mr-1" />
            <i
                v-if="isActive && !isReviewed && isDiscussion && !isResignation && !isNatEvaluation"
                data-toggle="tooltip"
                data-placement="top"
                title="needs review"
                class="fa fa-eye mr-1 text-warning"
            />
            <i
                v-if="isActive && isPassApp && isNatOrTrialNat && !isSecurityChecked"
                data-toggle="tooltip"
                data-placement="top"
                title="needs a security check"
                class="fas fa-shield-alt mr-1"
                :class="isSecurityChecked ? '' : 'text-warning'"
            />
            <i
                v-if="isActive && isPassApp && isNatOrTrialNat && !hasNatBuddy"
                data-toggle="tooltip"
                data-placement="top"
                title="needs a NAT buddy"
                class="fas fa-user mr-1"
                :class="hasNatBuddy ? '' : 'text-warning'"
            />
            <i
                v-if="!isActive && isApplication && isPublic"
                data-toggle="tooltip"
                data-placement="top"
                title="visible in public archives"
                class="fas fa-globe-americas mr-1 text-success"
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
        isPassApp: {
            type: Boolean,
            default: false,
        },
        isSecurityChecked: {
            type: Boolean,
            default: false,
        },
        isNatOrTrialNat: {
            type: Boolean,
            default: false,
        },
        isDiscussion: {
            type: Boolean,
            default: false,
        },
        isResignation: {
            type: Boolean,
            default: false,
        },
        isNatEvaluation: {
            type: Boolean,
            default: false,
        },
        hasNatBuddy: {
            type: Boolean,
            default: false,
        },
        isApplication: {
            type: Boolean,
            default: false,
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
};
</script>
