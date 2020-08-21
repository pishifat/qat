<template>
    <div>
        <chat-message-container
            :osu-id="selectedEvaluation.user.osuId"
        >
            <div v-if="isApplication">
                <!-- application -->
                <div v-if="selectedEvaluation.consensus == 'pass'">
                    <!-- pass -->
                    You are now a Probationary {{ modeString }} Beatmap Nominator! Please read all BN pages on the wiki (https://osu.ppy.sh/help/wiki/People/The_Team/Beatmap_Nominators), join the BN Discord server ({{ discordLink || 'expired link' }}), and review your evaluation (https://bn.mappersguild.com/evaluationResults?id={{ selectedEvaluation.id }}). Have fun!
                </div>

                <!-- fail -->
                <div v-else>
                    Hello! Your {{ modeString }} BN application has been unfortunately denied :( Review reasons for your rejection here: https://bn.mappersguild.com/evaluationResults?id={{ selectedEvaluation.id }} -- You can apply for BN in this game mode again on {{ selectedEvaluation.cooldownDate | toStandardDate }}. Good luck!
                </div>
            </div>
            <div v-else>
                <!-- current BN eval -->

                <!-- pass -->
                <div v-if="selectedEvaluation.consensus == 'fullBn'">
                    Following an evaluation of your recent {{ modeString }} BN work,
                    <!-- probation to full -->
                    <span v-if="isProbation">
                        you have been promoted from Probation to a Full Beatmap Nominator! Review your evaluation here: https://bn.mappersguild.com/evaluationResults?id={{ selectedEvaluation.id }}
                    </span>
                    <!-- low activity warning -->
                    <span v-else-if="selectedEvaluation.addition == 'lowActivity'">
                        the NAT have noticed that your nomination activity is too low to effectively form a conclusion. We will evaluate again 1 month from now! Review your evaluation here: https://bn.mappersguild.com/evaluationResults?id={{ selectedEvaluation.id }}
                    </span>
                    <!-- full to full -->
                    <span v-else>
                        we'd like to remind you that you're doing well! Review your evaluation here: https://bn.mappersguild.com/evaluationResults?id={{ selectedEvaluation.id }}
                    </span>
                </div>
                <!-- probation -->
                <div v-else-if="selectedEvaluation.consensus == 'probationBn'">
                    Following an evaluation of your recent {{ modeString }} BN work,
                    <!-- probation to probation -->
                    <span v-if="isProbation">
                        the NAT have decided to extend your Probation period and
                    </span>
                    <!-- full to probation -->
                    <span v-else>
                        you have been moved to the Probationary Beatmap Nominators :( The NAT
                    </span>
                    will evaluate your BN work again in 1 month. Review reasons for your Probation here: https://bn.mappersguild.com/evaluationResults?id={{ selectedEvaluation.id }}
                </div>

                <!-- remove from BN -->
                <div v-else>
                    <!-- resign -->
                    <span v-if="isResignation">
                        Following your {{ modeString }} BN resignation, the NAT evaluated your recent BN work and concluded that
                        <span v-if="selectedEvaluation.consensus == 'resignedOnGoodTerms'">you are still a capable Beatmap Nominator!</span>
                        <span v-else>your resignation will be on standard terms.</span>
                    </span>
                    <!-- kick -->
                    <span v-else>
                        Following an evaluation of your recent {{ modeString }} BN work, you have been removed from the Beatmap Nominators :(
                    </span>
                    <!-- reapply info -->
                    If you want to apply for BN again, you may do so on {{ selectedEvaluation.cooldownDate | toStandardDate }}, provided you have
                    <span v-if="selectedEvaluation.consensus == 'resignedOnGoodTerms'">one month of modding activity (~4 mods).</span>
                    <span v-else-if="selectedEvaluation.consensus == 'resignedOnStandardTerms'">two months of modding activity (~4 mods each month).</span>
                    <span v-else>shown improvement in the areas mentioned. Review reasons for your removal here: https://bn.mappersguild.com/evaluationResults?id={{ selectedEvaluation.id }}</span>
                    Good luck!
                </div>
            </div>
            —NAT
        </chat-message-container>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ChatMessageContainer from '../../../ChatMessageContainer.vue';

export default {
    name: 'FeedbackPm',
    components: {
        ChatMessageContainer,
    },
    props: {
        discordLink: {
            type: String,
            default: '',
        },
    },
    computed: {
        ...mapGetters('evaluations', [
            'selectedEvaluation',
            'isApplication',
            'isResignation',
        ]),
        natReviews() {
            return this.selectedEvaluation.reviews.filter(r => r.evaluator.isNat);
        },
        modeString () {
            return this.selectedEvaluation.mode == 'osu' ? 'osu!' : 'osu!' + this.selectedEvaluation.mode;
        },
        isProbation () {
            return this.selectedEvaluation.user.probationModes.includes(this.selectedEvaluation.mode);
        },
    },
};
</script>