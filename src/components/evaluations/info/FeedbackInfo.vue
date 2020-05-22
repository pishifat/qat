<template>
    <div>
        <p class="text-shadow min-spacing mb-2">
            Application feedback:
            <span v-if="resigned" class="text-white-50">
                resigned
            </span>
        </p>
        <div v-if="!resigned" class="form-group">
            <textarea v-model="feedback" class="form-control dark-textarea" style="white-space: pre-line;" />
        </div>
        <div v-if="isApplication && consensus == 'pass'" class="input-group mb-3">
            <input
                v-model="discordLink"
                class="form-control"
                type="text"
                placeholder="discord invite link..."
            >
        </div>
        <div>
            <button class="btn btn-sm btn-nat" data-toggle="collapse" :data-target="isApplication ? '#applicationForumPmBox' : '#currentBnForumPmBox'">
                See full message <i class="fas fa-angle-down" />
            </button>
            <a :href="'https://osu.ppy.sh/forum/ucp.php?i=pm&mode=compose&u=' + osuId" target="_blank">
                <button class="btn btn-sm btn-nat">
                    Open osu! PM
                </button>
            </a>
            <button class="btn btn-sm btn-nat float-right" @click="setFeedback($event)">
                Save
            </button>
        </div>
        <feedback-pm
            :is-application="isApplication"
            :consensus="consensus"
            :cooldown-date="cooldownDate"
            :mode="mode"
            :probation="probation"
            :feedback="savedFeedback"
            :discord-link="discordLink"
            :evaluations="evaluations"
            :is-low-activity="isLowActivity"
            :resigned-on-good-terms="resignedOnGoodTerms"
            :resigned-on-standard-terms="resignedOnStandardTerms"
        />
    </div>
</template>

<script>
import postData from '../../../mixins/postData.js';
import FeedbackPm from './FeedbackPm.vue';

export default {
    name: 'FeedbackInfo',
    components: {
        FeedbackPm,
    },
    mixins: [ postData ],
    props: {
        isApplication: Boolean,
        isLowActivity: Boolean,
        resignedOnGoodTerms: Boolean,
        resignedOnStandardTerms: Boolean,
        consensus: {
            type: String,
            required: true,
        },
        osuId: {
            type: Number,
            required: true,
        },
        cooldownDate: {
            type: String,
            default: new Date().toString(),
        },
        mode: {
            type: String,
            required: true,
        },
        evaluations: {
            type: Array,
            default() {
                return [];
            },
        },
        probation: {
            type: Array,
            default() {
                return [];
            },
        },
        savedFeedback: {
            type: String || null,
            default: null,
        },
        nominatorAssessmentMongoId: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            feedback: '',
            discordLink: '',
        };
    },
    computed: {
        resigned() {
            if (this.resignedOnGoodTerms || this.resignedOnStandardTerms) {
                return true;
            } else {
                return false;
            }
        },
    },
    watch: {
        nominatorAssessmentMongoId() {
            this.feedback = this.savedFeedback;
        },
    },
    mounted() {
        this.feedback = this.savedFeedback;
    },
    methods: {
        async setFeedback(e) {
            const result = await this.executePost(
                `/${this.isApplication ? 'appEval' : 'bnEval'}/setFeedback/` + this.nominatorAssessmentMongoId, { feedback: this.feedback, hasFeedback: this.savedFeedback }, e);

            if (result && !result.error) {
                this.$store.dispatch(this.isApplication ? 'updateApplication' : 'updateEvalRound', result);
                this.$store.dispatch('updateToastMessages', {
                    message: `saved feedback`,
                    type: 'info',
                });
            }
        },
    },
};
</script>