<template>
    <div>
        <p class="text-shadow min-spacing mb-2">
            Application feedback:
        </p>
        <div class="form-group">
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
        consensus: String,
        isApplication: Boolean,
        osuId: Number,
        cooldownDate: String,
        mode: String,
        evaluations: Array,
        probation: Array,
        isLowActivity: Boolean,
        savedFeedback: String,
        nominatorAssessmentMongoId: String,
    },
    data() {
        return {
            feedback: '',
            discordLink: '',
        };
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

            if (result) {
                if (result.error) {
                    this.info = result.error;
                } else {
                    this.$emit('update-nominator-assessment', result);
                }
            }
        },
    },
};
</script>