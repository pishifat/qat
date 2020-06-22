<template>
    <div>
        <!-- application -->
        <div v-if="isApplication" id="applicationForumPmBox" class="collapse">
            <div class="card card-body my-2">
                <span>BN Application Results ({{ modeString }})</span>
            </div>

            <!-- pass -->
            <div v-if="selectedEvaluation.consensus == 'pass'" class="card card-body small">
                <span>Hello!</span><br><br>
                <span>Following a positive evaluation of your BN application for the [i]{{ modeString }}[/i] game mode, you've been invited to join the Beatmap Nominators. Congratulations!</span><br><br>
                <span>[notice][b]Important information:[/b]</span><br>
                <span>[list][*]You will be on probation for your first month as a BN. This means you can only nominate beatmaps that have been nominated by non-probation BNs, and you cannot disqualify beatmaps.</span><br><br>
                <span>[*]At the end of your probation period, your activity/attitude/nomination quality will be evaluated by members of the NAT. If each of these areas are satisfactory, your probation period will be complete. If not, your probation will be extended for another month. or you'll be dismissed from the BN. In that second case, you will not be able to re-apply for another 90 days.</span><br><br>
                <span>[*]Read the following pages: [url=https://osu.ppy.sh/help/wiki/People/Beatmap_Nominators/Rules][b]BN rules[/b][/url],  [url=https://osu.ppy.sh/help/wiki/People/Beatmap_Nominators/General_Information][b]General Information for BNs[/b][/url], and [url=https://osu.ppy.sh/help/wiki/People/The_Team/Beatmap_Nominators/Beatmap_Veto][b]Veto Information[/b][/url].</span><br><br>
                <span>[*]Follow the golden rule: [i]don't fuck up[/i].[/list][/notice]</span><br><br>
                <span>Your test results can be found here: http://bn.mappersguild.com/testresults</span><br><br>
                <span>Additional feedback from the NAT:</span><br><br>
                <span class="pre-line">[notice] {{ selectedEvaluation.feedback }} [/notice]</span>
                <span>[url={{ discordLink || 'expired link' }}]Link to the BN Discord Server[/url]</span><br><br>
                <span>Regards, the Nomination Assessment Team</span>
            </div>

            <!-- fail -->
            <div v-else class="card card-body">
                <span>Hello!</span><br><br>
                <span>Following an evaluation of your BN application for the [i]{{ modeString }}[/i] game mode, we've decided not to admit you into the Beatmap Nominators.</span><br><br>
                <span>Your test results can be found here: http://bn.mappersguild.com/testresults</span><br><br>
                <span>Additional feedback regarding why you were rejected and what you could potentially improve in your next application:</span><br><br>
                <span class="pre-line">[notice] {{ selectedEvaluation.feedback }} [/notice]</span>
                <span>If you have questions or wish for more in-depth feedback, contact any of these users:
                    <span v-for="(review, i) in natReviews" :key="i">[url=https://osu.ppy.sh/users/{{ review.evaluator.osuId }}]{{ review.evaluator.username }}[/url]{{ i+1 != natReviews.length ? ", " : "" }}</span>
                </span><br><br>
                <span>If you disagree with the decision, you may also contact the above users to appeal.</span><br><br>
                <span>You may apply for BN in this game mode again on {{ selectedEvaluation.cooldownDate | toStandardDate }}. Good luck!</span><br><br>
                <span>Regards, the Nomination Assessment Team</span>
            </div>
        </div>

        <!-- current BN eval -->
        <div v-else id="currentBnForumPmBox" class="collapse">
            <div class="card card-body my-2">
                <span>Current BN Evaluation Results ({{ modeString }})</span>
            </div>

            <!-- pass -->
            <div v-if="selectedEvaluation.consensus == 'pass'" class="card card-body">
                <span>Hello!</span><br><br>
                <span v-if="isProbation">
                    <span>Following a positive evaluation of your work as a BN for the [i]{{ modeString }}[/i] game mode, we've decided to conclude your probation period and promote you to a full Beatmap Nominator. Congratulations!</span><br><br>
                    <span>You may now nominate maps that are nominated by other probation BNs, and you may disqualify maps when applicable.</span><br><br>
                </span>

                <!-- low activity warning -->
                <span v-else-if="selectedEvaluation.isLowActivity">
                    <span>We've noticed that your nomination activity for the [i]{{ modeString }}[/i] game mode is too low to effectively evaluate your work as a Beatmap Nominator. That said, we won't place you on probation, however we will follow up on your nomination activity one month from now in hopes that it improves. If it does not, you will likely be removed from the Beatmap Nominators for this game mode.</span><br><br>
                </span>
                <span v-else>
                    <span>After evaluating your work as a BN, we'd just like to let you know that you're doing well. Thanks!</span><br><br>
                </span>
                <span>Additional feedback from the NAT:</span><br><br>
                <span class="pre-line">[notice] {{ selectedEvaluation.feedback }} [/notice]</span>
                <span>Regards, the Nomination Assessment Team</span>
            </div>

            <!-- probation -->
            <div v-else-if="selectedEvaluation.consensus == 'probation'" class="card card-body">
                <span>Hello!</span><br><br>
                <span v-if="isProbation">
                    <span>After reviewing your work as a BN for the [i]{{ modeString }}[/i] game mode, we have decided to [b]extend your probation period[/b].</span><br><br>
                    <span>We will evaluate you again in [b]one month[/b] to determine if the mentioned issues have been overcome. Assuming this is the case, you will be promoted to full Nominator status. Should these issues persist without substantial improvement however, you will be removed from the Beatmap Nominators.</span><br><br>
                </span>
                <span v-else>
                    <span>After reviewing your work as a BN for the [i]{{ modeString }}[/i] game mode, we have decided to [b]place you on probation[/b]. After one month, we will re-evaluate your work as a BN to determine if your probation should be lifted or if you should be removed from the Beatmap Nominators.</span><br><br>
                </span>
                <span>Additional feedback from the NAT:</span><br><br>
                <span class="pre-line">[notice] {{ selectedEvaluation.feedback }} [/notice]</span>
                <span>For further feedback or to appeal this decision, contact any of these users:
                    <span v-for="(review, i) in natReviews" :key="i">[url=https://osu.ppy.sh/users/{{ review.evaluator.osuId }}]{{ review.evaluator.username }}[/url]{{ i+1 != natReviews.length ? ", " : "" }}</span>
                </span><br><br>
                <span>We hope to see you off of probation soon!</span><br><br>
                <span>Regards, the Nomination Assessment Team</span>
            </div>

            <!-- remove from BN -->
            <div v-else class="card card-body">
                <span>Hello!</span><br><br>

                <!-- resign -->
                <span v-if="resigned" class="small">Following your BN resignation from the [i]{{ modeString }}[/i] game mode, we conducted an evaluation and determined that
                    <span v-if="selectedEvaluation.resignedOnGoodTerms">you are still a capable Beatmap Nominator!</span>
                    <span v-else>your resignation will be on standard terms.</span>
                </span>

                <!-- fail -->
                <span v-else class="small">After reviewing your work as a BN for the [i]{{ modeString }}[/i] game mode, we have decided to [b]remove you from the Beatmap Nominators[/b].</span><br><br>
                <span>We would like to thank you for your service to the mapping and modding communities and wish you the best of luck in your future endeavours. Should you wish to apply for the Beatmap Nominators again, you may do so on {{ selectedEvaluation.cooldownDate | toStandardDate }}, provided you have
                    <span v-if="selectedEvaluation.resignedOnGoodTerms">one month of modding activity (3-4 mods).</span>
                    <span v-else-if="selectedEvaluation.resignedOnStandardTerms">two months of modding activity (3-4 mods each month).</span>
                    <span v-else>two months of modding activity (3-4 mods each month) and have shown improvement in the areas mentioned.</span>
                </span><br><br>
                <span v-if="!resigned">
                    <span>Additional feedback from the NAT:</span><br><br>
                    <span class="pre-line">[notice] {{ selectedEvaluation.feedback }} [/notice]</span>
                    <span>For further feedback or to appeal this decision, contact any of these users:
                        <span v-for="(review, i) in natReviews" :key="i">[url=https://osu.ppy.sh/users/{{ review.evaluator.osuId }}]{{ review.evaluator.username }}[/url]{{ i+1 != natReviews.length ? ", " : "" }}</span>
                    </span><br><br>
                </span>
                <span>Good luck!</span><br><br>
                <span>Regards, the Nomination Assessment Team</span>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'FeedbackPm',
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
        ]),
        natReviews() {
            return this.selectedEvaluation.reviews.filter(r => r.evaluator.isNat);
        },
        resigned() {
            if (this.selectedEvaluation.resignedOnGoodTerms || this.selectedEvaluation.resignedOnStandardTerms) {
                return true;
            } else {
                return false;
            }
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