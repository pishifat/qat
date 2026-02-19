<template>
    <div class="card-body px-4 py-4">
        <p class="card-text d-flex align-items-center">
            <user-link
                class="fw-bold"
                :osu-id="osuId"
                :username="username"
            />
            <i v-if="mode == 'osu'" class="osu-icon ms-2" />
            <i v-else-if="mode == 'taiko'" class="taiko-icon ms-2" />
            <i v-else-if="mode == 'catch'" class="catch-icon ms-2" />
            <i v-else-if="mode == 'mania'" class="mania-icon ms-2" />
            <i
                v-if="isActive && hasMockEvaluators"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="mock evaluators enabled"
                class="fas fa-flask ms-2 text-probation"
            />
            <i
                v-if="isResignation"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="resignation"
                class="fas fa-walking ms-2 text-neutral"
            />
            <i
                v-if="isActive && !isReviewed && isDiscussion && !isResignation && !isNatEvaluation"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="needs review"
                class="fa fa-eye ms-2 text-warning"
            />
            <i
                v-if="isActive && isApp && isNatOrTrialNat && !isSecurityChecked"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="needs a security check"
                class="fas fa-shield-alt ms-2"
                :class="isSecurityChecked ? '' : 'text-warning'"
            />
            <i
                v-if="isActive && isPassApp && isNatOrTrialNat && !hasNatBuddy"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="needs a NAT buddy"
                class="fas fa-user ms-2"
                :class="hasNatBuddy ? '' : 'text-warning'"
            />
            <i
                v-if="!isActive && isPublic"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="visible in public archives"
                class="fas fa-globe-americas ms-2 text-success"
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
