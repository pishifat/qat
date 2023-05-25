<template>
    <div>
        <bot-chat-message
            :message="message"
            :message-type="'eval'"
            :mongo-id="selectedEvaluation.id"
            :users="[{ username: selectedEvaluation.user.username, osuId: selectedEvaluation.user.osuId }]"
            :eval-type="selectedEvaluation.kind"
            :custom-text="'Send message & archive'"
            :is-reviewed="selectedEvaluation.isReviewed"
        />
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import BotChatMessage from '../../../BotChatMessage.vue';
import evaluations from '../../../../mixins/evaluations.js';

export default {
    name: 'FeedbackPm',
    components: {
        BotChatMessage,
    },
    mixins: [ evaluations ],
    props: {
        discordLink: {
            type: String,
            default: '',
        },
    },
    computed: {
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
        /** @returns {Array} */
        natReviews() {
            return this.selectedEvaluation.reviews.filter(r => r.evaluator.isNat);
        },
        /** @returns {string} */
        modeString () {
            return this.selectedEvaluation.mode == 'osu' ? 'osu!' : 'osu!' + this.selectedEvaluation.mode;
        },
        /** @returns {Boolean} */
        isProbation () {
            return this.selectedEvaluation.user.probationModes.includes(this.selectedEvaluation.mode);
        },
        /** @returns {string} */
        consensus () {
            return this.selectedEvaluation.consensus;
        },
        /** @returns {string} */
        addition () {
            return this.selectedEvaluation.addition;
        },
        /** @returns {string} */
        message () {
            let message = '';

            // application
            if (this.selectedEvaluation.isApplication) {

                // pass
                if (this.positiveConsensus) {
                    message += `hello! you are now an ${this.modeString} Beatmap Nominator! here's a few things to get you started:`;
                    message += `\n\n`;
                    message += `- read all BN pages on the wiki: https://osu.ppy.sh/help/wiki/People/The_Team/Beatmap_Nominators\n`;
                    message += `- join the BN Discord server: ${this.discordLink ? this.discordLink : 'LINK DOES NOT EXIST'}\n`;
                    message += `- review your evaluation here: https://bn.mappersguild.com/message?eval=${this.selectedEvaluation.id}`;
                    message += `\n\n`;
                    message += `have fun!`;
                    message += `\n\n`;

                // fail
                } else {
                    message += `hello! your ${this.modeString} BN application has been unfortunately denied :(`;
                    message += `\n\n`;
                    message += `review reasons for your rejection here: https://bn.mappersguild.com/message?eval=${this.selectedEvaluation.id}`;
                    message += `\n\n`;
                    message += `you can apply for BN in this game mode again on **${this.toStandardDate(this.selectedEvaluation.cooldownDate)}**`;
                    message += `\n\n`;
                    message += `good luck!`;
                    message += `\n\n`;
                }

            // current BN evaluation
            } else {
                message += `hello! following an evaluation of your recent ${this.modeString} BN work, `;

                // pass
                if (!this.selectedEvaluation.isResignation && this.positiveConsensus) {

                    // probation to full
                    if (this.isProbation) {
                        message += `you have been promoted from Probation to a Full Beatmap Nominator!`;
                        message += `\n\n`;
                        message += `review your evaluation here: https://bn.mappersguild.com/message?eval=${this.selectedEvaluation.id}`;

                    // modding quality warning
                    } else if (this.moddingQualityWarning) {
                        message += `the NAT believes that the quality of your modding is concerning.`;
                        message += `\n\n`;
                        message += `review your evaluation here: https://bn.mappersguild.com/message?eval=${this.selectedEvaluation.id}`;

                    // map quality warning
                    } else if (this.mapQualityWarning) {
                        message += `the NAT believes that the quality of your nominations is concerning.`;
                        message += `\n\n`;
                        message += `review your evaluation here: https://bn.mappersguild.com/message?eval=${this.selectedEvaluation.id}`;

                    // low activity warning
                    } else if (this.lowActivityWarning) {
                        message += `the NAT has noticed that your nomination activity is currently too low.`;
                        message += `\n\n`;
                        message += `your BN activity will be evaluated again 1 month from now!`;
                        message += `\n\n`;
                        message += `review your evaluation here: https://bn.mappersguild.com/message?eval=${this.selectedEvaluation.id}`;

                    // behavior warning
                    } else if (this.behaviorWarning) {
                        message += `the NAT believes that your behavior is concerning.`;
                        message += `\n\n`;
                        message += `you are still a Full BN, but we will evaluate again 1 month from now!`;
                        message += `\n\n`;
                        message += `review your evaluation here: https://bn.mappersguild.com/message?eval=${this.selectedEvaluation.id}`;

                    // full to full
                    } else {
                        message += `we'd like to remind you that you're doing well!`;
                        message += `\n\n`;
                        message += `review your evaluation here: https://bn.mappersguild.com/message?eval=${this.selectedEvaluation.id}`;
                    }

                // probation
                } else if (!this.selectedEvaluation.isResignation && this.neutralConsensus) {

                    // probation to probation
                    if (this.isProbation) {
                        message += `the NAT have decided to extend your Probation period`;

                        // low activity warning
                        if (this.lowActivityWarning) {
                            message += ` because your nomination activity is too low to reach a conclusion`;
                        }

                        message += `\n\n`;

                    // full to probation
                    } else {
                        message +=  `you have been moved to the Probationary Beatmap Nominators :(`;

                        message += `\n\n`;
                    }

                    message += `the NAT will evaluate your BN work again in 1 month!`;
                    message += `\n\n`;
                    message += `review reasons for your Probation here: https://bn.mappersguild.com/message?eval=${this.selectedEvaluation.id}`;

                // remove from BN
                } else {

                    // resign
                    if (this.selectedEvaluation.isResignation) {
                        message +=  `following your ${this.modeString} BN resignation, the NAT evaluated your recent BN work and concluded that `;

                        // resigned on good terms
                        if (this.positiveConsensus) {
                            message +=  `you are still a capable Beatmap Nominator!`;

                        // resigned on standard terms
                        } else {
                            message +=  `your resignation will be on standard terms`;
                        }

                    // kick
                    } else {
                        message +=  `you have been removed from the Beatmap Nominators :(`;
                    }

                    message += `\n\n`;

                    // reasons
                    if (!this.selectedEvaluation.isResignation) {
                        message += `review reasons for your removal here: https://bn.mappersguild.com/message?eval=${this.selectedEvaluation.id}`;
                        message += `\n\n`;
                    }
                    
                    // reapply date
                    message += `If you want to apply for BN again, you may do so on **${this.toStandardDate(this.selectedEvaluation.cooldownDate)}**`;
                    message += `\n\n`;

                    if (this.selectedEvaluation.isResignation && this.positiveConsensus) {
                        message += `You may also instantly re-join the BN any time within the next 6 months (no test or application required!) :)`;
                        message += `\n\n`;
                    }

                    // cheeky sign-off
                    message += `good luck!`;
                }
            }

            // professional sign-off
            let signature = `—NAT`;
            message += `\n\n`;
            message += signature;

            return message;
        },
    },
    methods: {
        /** @returns {string} */
        toStandardDate (date) {
            if (!date) return '';

            return this.$moment(date).format('YYYY-MM-DD');
        },
    },
};
</script>
