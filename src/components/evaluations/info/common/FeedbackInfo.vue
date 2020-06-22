<template>
    <div>
        <p class="mb-2">
            <b>Application feedback:</b>
            <span v-if="resigned" class="text-secondary">
                resigned
            </span>
        </p>

        <textarea
            v-model="feedback"
            class="form-control mb-2"
            rows="4"
        />

        <input
            v-if="isApplication && selectedEvaluation.consensus == 'pass'"
            v-model="discordLink"
            class="form-control"
            type="text"
            placeholder="discord invite link..."
        >

        <div class="form-inline">
            <button class="btn btn-sm btn-primary mr-2 mt-2" data-toggle="collapse" :data-target="isApplication ? '#applicationForumPmBox' : '#currentBnForumPmBox'">
                See full message <i class="fas fa-angle-down" />
            </button>

            <a
                :href="'https://osu.ppy.sh/forum/ucp.php?i=pm&mode=compose&u=' + selectedEvaluation.user.osuId"
                target="_blank"
                class="btn btn-sm btn-primary mr-2 mt-2"
            >
                Open osu! PM
            </a>

            <button class="btn btn-sm btn-primary mt-2 ml-0 ml-sm-auto" @click="setFeedback($event)">
                Save
            </button>
        </div>

        <feedback-pm
            :discord-link="discordLink"
        />
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import postData from '../../../../mixins/postData.js';
import FeedbackPm from './FeedbackPm.vue';

export default {
    name: 'FeedbackInfo',
    components: {
        FeedbackPm,
    },
    mixins: [ postData ],
    data() {
        return {
            feedback: '',
            discordLink: '',
        };
    },
    computed: {
        resigned() {
            if (this.selectedEvaluation.resignedOnGoodTerms || this.selectedEvaluation.resignedOnStandardTerms) {
                return true;
            } else {
                return false;
            }
        },
        ...mapGetters('evaluations', [
            'selectedEvaluation',
            'isApplication',
        ]),
    },
    watch: {
        selectedEvaluation () {
            this.feedback = this.selectedEvaluation.feedback;
        },
    },
    mounted() {
        this.feedback = this.selectedEvaluation.feedback;
    },
    methods: {
        async setFeedback (e) {
            const result = await this.executePost(
                `/${this.isApplication ? 'appEval' : 'bnEval'}/setFeedback/` + this.selectedEvaluation.id, { feedback: this.feedback }, e);

            if (result && !result.error) {
                this.$store.commit('evaluations/updateEvaluation', result);
                this.$store.dispatch('updateToastMessages', {
                    message: `Saved feedback`,
                    type: 'success',
                });
            }
        },
    },
};
</script>