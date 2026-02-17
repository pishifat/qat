<template>
    <div class="card-body">
        <p class="card-text d-flex align-items-center">
            <user-link
                class="font-weight-bold"
                :osu-id="osuId"
                :username="username"
            />
            <i v-if="mode == 'osu'" class="osu-icon ml-2" />
            <i v-else-if="mode == 'taiko'" class="taiko-icon ml-2" />
            <i v-else-if="mode == 'catch'" class="catch-icon ml-2" />
            <i v-else-if="mode == 'mania'" class="mania-icon ml-2" />
            <i
                v-if="isActive && hasMockEvaluators"
                data-toggle="tooltip"
                data-placement="top"
                title="mock evaluators enabled"
                class="fas fa-flask ml-2 text-probation"
            />
            <i
                v-if="isResignation"
                data-toggle="tooltip"
                data-placement="top"
                title="resignation"
                class="fas fa-walking ml-2 text-neutral"
            />
            <i
                v-if="isActive && !isReviewed && isDiscussion && !isResignation && !isNatEvaluation"
                data-toggle="tooltip"
                data-placement="top"
                title="needs review"
                class="fa fa-eye ml-2 text-warning"
            />
            <i
                v-if="isActive && isApp && isNatOrTrialNat && !isSecurityChecked"
                data-toggle="tooltip"
                data-placement="top"
                title="needs a security check"
                class="fas fa-shield-alt ml-2"
                :class="isSecurityChecked ? '' : 'text-warning'"
            />
            <i
                v-if="isActive && isPassApp && isNatOrTrialNat && !hasNatBuddy"
                data-toggle="tooltip"
                data-placement="top"
                title="needs a NAT buddy"
                class="fas fa-user ml-2"
                :class="hasNatBuddy ? '' : 'text-warning'"
            />
            <i
                v-if="!isActive && isPublic"
                data-toggle="tooltip"
                data-placement="top"
                title="visible in public archives"
                class="fas fa-globe-americas ml-2 text-success"
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
        isPublic: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isApp: {
            type: Boolean,
            default: false,
        },
        hasMockEvaluators: {
            type: Boolean,
            default: false,
        },
    },
};
</script>
