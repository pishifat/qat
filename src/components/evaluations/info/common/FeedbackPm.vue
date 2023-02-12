<template>
    <div>
        <bot-chat-message
            :messages="messages"
            :message-type="'eval'"
            :mongo-id="selectedEvaluation.id"
            :users="[{ username: selectedEvaluation.user.username, osuId: selectedEvaluation.user.osuId }]"
            :eval-type="selectedEvaluation.kind"
            :custom-text="'Send messages & archive'"
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
        /** @returns {Array} */
        messages () {
            let messages = [];

            // application
            if (this.selectedEvaluation.isApplication) {

                // pass
                if (this.positiveConsensus) {
                    messages.push(`hello! you are now an ${this.modeString} Beatmap Nominator! here's a few things to get you started:`);
                    messages.push(`1. read all BN pages on the wiki: https://osu.ppy.sh/help/wiki/People/The_Team/Beatmap_Nominators`);
                    messages.push(`2. join the BN Discord server: ${this.discordLink ? this.discordLink : 'LINK DOES NOT EXIST'}`);
                    messages.push(`3. review your evaluation here: https://bn.mappersguild.com/message?eval=${this.selectedEvaluation.id}`);
                    messages.push(`have fun!`);

                // fail
                } else {
                    messages.push(`hello! your ${this.modeString} BN application has been unfortunately denied :(`);
                    messages.push(`review reasons for your rejection here: https://bn.mappersguild.com/message?eval=${this.selectedEvaluation.id}`);
                    messages.push(`you can apply for BN in this game mode again on ${this.toStandardDate(this.selectedEvaluation.cooldownDate)}`);
                    messages.push(`good luck!`);
                }

            // current BN evaluation
            } else {
                let line = `hello! following an evaluation of your recent ${this.modeString} BN work, `;

                // pass
                if (!this.selectedEvaluation.isResignation && this.positiveConsensus) {

                    // probation to full
                    if (this.isProbation) {
                        line += `you have been promoted from Probation to a Full Beatmap Nominator!`;

                        messages.push(line);
                        messages.push(`review your evaluation here: https://bn.mappersguild.com/message?eval=${this.selectedEvaluation.id}`);

                    // low activity warning
                    } else if (this.lowActivityWarning) {
                        line += `the NAT have noticed that your nomination activity is currently too low`;

                        messages.push(line);
                        messages.push(`your BN activity will be evaluated again 1 month from now!`);
                        messages.push(`review your evaluation here: https://bn.mappersguild.com/message?eval=${this.selectedEvaluation.id}`);

                    // behavior warning
                    } else if (this.behaviorWarning) {
                        line += `the NAT believe that your behavior is concerning`;

                        messages.push(line);
                        messages.push(`you are still a Full BN, but we will evaluate again 1 month from now!`);
                        messages.push(`review your evaluation here: https://bn.mappersguild.com/message?eval=${this.selectedEvaluation.id}`);

                    // full to full
                    } else {
                        line += `we'd like to remind you that you're doing well!`;

                        messages.push(line);
                        messages.push(`review your evaluation here: https://bn.mappersguild.com/message?eval=${this.selectedEvaluation.id}`);
                    }

                // probation
                } else if (!this.selectedEvaluation.isResignation && this.neutralConsensus) {

                    // probation to probation
                    if (this.isProbation) {
                        line += `the NAT have decided to extend your Probation period`;

                        // low activity warning
                        if (this.lowActivityWarning) {
                            line += ` because your nomination activity is too low to reach a conclusion`;
                        }

                        messages.push(line);

                    // full to probation
                    } else {
                        line += `you have been moved to the Probationary Beatmap Nominators :(`;

                        messages.push(line);
                    }

                    messages.push(`the NAT will evaluate your BN work again in 1 month!`);
                    messages.push(`review reasons for your Probation here: https://bn.mappersguild.com/message?eval=${this.selectedEvaluation.id}`);

                // remove from BN
                } else {

                    // resign
                    if (this.selectedEvaluation.isResignation) {
                        line = `following your ${this.modeString} BN resignation, the NAT evaluated your recent BN work and concluded that `;

                        // resigned on good terms
                        if (this.positiveConsensus) {
                            line += `you are still a capable Beatmap Nominator!`;

                        // resigned on standard terms
                        } else {
                            line += `your resignation will be on standard terms`;
                        }

                    // kick
                    } else {
                        line += `you have been removed from the Beatmap Nominators :(`;
                    }

                    messages.push(line);

                    // reasons
                    if (!this.selectedEvaluation.isResignation) {
                        messages.push(`review reasons for your removal here: https://bn.mappersguild.com/message?eval=${this.selectedEvaluation.id}`);
                    }
                    
                    // reapply date
                    messages.push(`If you want to apply for BN again, you may do so on ${this.toStandardDate(this.selectedEvaluation.cooldownDate)}`);

                    if (this.selectedEvaluation.isResignation && this.positiveConsensus) {
                        messages.push(`You may also instantly re-join the BN any time within the next 6 months (no test or application required!) :)`);
                    }

                    // cheeky sign-off
                    messages.push(`good luck!`);
                }
            }

            // professional sign-off
            let signature = `—NAT`;
            messages.push(signature);

            return messages;
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
