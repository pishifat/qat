<template>
    <div>
        <chat-message-container
            :osu-id="selectedEvaluation.user.osuId"
        >
            {{ message }}
        </chat-message-container>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ChatMessageContainer from '../../../ChatMessageContainer.vue';
import evaluations from '../../../../mixins/evaluations.js';

export default {
    name: 'FeedbackPm',
    components: {
        ChatMessageContainer,
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
                    message = `You are now a Probationary ${this.modeString} Beatmap Nominator! Please read all BN pages on the wiki (https://osu.ppy.sh/help/wiki/People/The_Team/Beatmap_Nominators), join the BN Discord server (${this.discordLink ? this.discordLink : 'expired link'}), and review your evaluation (https://bn.mappersguild.com/evaluationresults?id=${this.selectedEvaluation.id}). Have fun! `;

                // fail
                } else {
                    message = `Hello! Your ${this.modeString} BN application has been unfortunately denied :( Review reasons for your rejection here: https://bn.mappersguild.com/evaluationresults?id=${this.selectedEvaluation.id} -- You can apply for BN in this game mode again on ${this.toStandardDate(this.selectedEvaluation.cooldownDate)}. Good luck! `;
                }

            // current BN evaluation
            } else {
                message = `Following an evaluation of your recent ${this.modeString} BN work, `;

                // pass
                if (!this.selectedEvaluation.isResignation && this.positiveConsensus) {

                    // probation to full
                    if (this.isProbation) {
                        message += `you have been promoted from Probation to a Full Beatmap Nominator! Review your evaluation here: https://bn.mappersguild.com/evaluationresults?id=${this.selectedEvaluation.id} `;

                    // low activity warning
                    } else if (this.lowActivityWarning) {
                        message += `the NAT have noticed that your nomination activity is too low to effectively form a conclusion. We will evaluate again 1 month from now! Review your evaluation here: https://bn.mappersguild.com/evaluationresults?id=${this.selectedEvaluation.id} `;

                    // full to full
                    } else {
                        message += `we'd like to remind you that you're doing well! Review your evaluation here: https://bn.mappersguild.com/evaluationresults?id=${this.selectedEvaluation.id} `;
                    }

                // probation
                } else if (!this.selectedEvaluation.isResignation && this.neutralConsensus) {

                    // probation to probation
                    if (this.isProbation) {
                        message += `the NAT have decided to extend your Probation period and `;

                    // full to probation
                    } else {
                        message += `you have been moved to the Probationary Beatmap Nominators :( The NAT `;
                    }

                    message += `will evaluate your BN work again in 1 month. Review reasons for your Probation here: https://bn.mappersguild.com/evaluationresults?id=${this.selectedEvaluation.id} `;

                // remove from BN
                } else {

                    // resign
                    if (this.selectedEvaluation.isResignation) {
                        message = `Following your ${this.modeString} BN resignation, the NAT evaluated your recent BN work and concluded that `;

                        // resigned on good terms
                        if (this.positiveConsensus) {
                            message += `you are still a capable Beatmap Nominator! `;

                        // resigned on standard terms
                        } else {
                            message += `your resignation will be on standard terms. `;
                        }

                    // kick
                    } else {
                        message += `you have been removed from the Beatmap Nominators :( `;
                    }

                    message += `If you want to apply for BN again, you may do so on ${this.toStandardDate(this.selectedEvaluation.cooldownDate)}, provided you have `;

                    // resigned on good terms
                    if (this.positiveConsensus) {
                        message += `one month of modding activity (~4 mods). `;

                    // resigned on standard terms
                    } else if (this.neutralConsensus) {
                        message += `two months of modding activity (~4 mods each month). `;

                    // kick
                    } else {
                        message += `shown improvement in the areas mentioned. Review reasons for your removal here: https://bn.mappersguild.com/evaluationresults?id=${this.selectedEvaluation.id} `;
                    }

                    // cheeky sign-off
                    message += `Good Luck! `;
                }
            }

            // professional sign-off
            message += `—NAT`;

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