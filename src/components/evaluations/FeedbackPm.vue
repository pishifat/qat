<template>
    <div>
        <div v-if="discussApp">
            <div v-if="discussApp.consensus == 'pass'" id="forumPmBox" class="copy-paste collapse">
                <samp class="small">Hello!</samp><br><br>
                <samp class="small">Following a positive evaluation of your BN application for the [i]{{ discussApp.mode == 'osu' ? 'osu!' : 'osu!' + discussApp.mode }}[/i] game mode, you've been invited to join the Beatmap Nominators. Congratulations!</samp><br><br>
                <samp class="small">[notice][b]Important information:[/b]</samp><br>
                <samp class="small">[list][*]You will be on probation for your first month as a BN. This means you can only nominate beatmaps that have been nominated by non-probation BNs, and you cannot disqualify beatmaps.</samp><br><br>
                <samp class="small">[*]At the end of your probation period, your activity/attitude/nomination quality will be evaluated by members of the NAT. If each of these areas are satisfactory, your probation period will be complete. If not, your probation will be extended for another month. or you'll be dismissed from the BN. In that second case, you will not be able to re-apply for another 90 days.</samp><br><br>
                <samp class="small">[*]Read [url=https://osu.ppy.sh/help/wiki/People/Beatmap_Nominators/Rules]this page[/url] and follow the golden rule: [i]don't fuck up[/i].[/list][/notice]</samp><br><br>
                <samp class="small">Your test results can be found here: http://bn.mappersguild.com/testresults</samp><br><br>
                <samp class="small">Additional feedback from the NAT:</samp><br><br>
                <samp><pre class="small">[notice]{{ feedback }}[/notice]</pre></samp>
                <samp class="small">We hope you have fun as a Beatmap Nominator! Link to the BN Discord Server: {{ discordLink || 'expired link' }}</samp><br><br>
                <samp class="small">Regards, the Nomination Assessment Team</samp>
            </div>
            <div v-else id="forumPmBox" class="copy-paste collapse">
                <samp class="small">Hello!</samp><br><br>
                <samp class="small">Following an evaluation of your BN application for the [i]{{ discussApp.mode == 'osu' ? 'osu!' : 'osu!' + discussApp.mode }}[/i] game mode, we've decided not to admit you into the Beatmap Nominators.</samp><br><br>
                <samp class="small">Your test results can be found here: http://bn.mappersguild.com/testresults</samp><br><br>
                <samp class="small">Additional feedback regarding why you were rejected and what you could potentially improve in your next application:</samp><br><br>
                <samp><pre class="small">[notice]{{ feedback }}[/notice]</pre></samp>
                <samp class="small">For further feedback or to appeal this decision, contact any of these users:
                    <span v-for="(evaluation, i) in discussApp.evaluations" :key="i">[url=https://osu.ppy.sh/users/{{ evaluation.evaluator.osuId }}]{{ evaluation.evaluator.username }}[/url]{{ i+1 != discussApp.evaluations.length ? ", " : "" }}</span>
                </samp><br><br>
                <samp class="small">You may apply for BN in this game mode again on {{ defineDate(discussApp.createdAt) }}. Good luck!</samp><br><br>
                <samp class="small">Regards, the Nomination Assessment Team</samp>
            </div>
        </div>
        <div v-else-if="discussRound">
            <div v-if="discussRound.consensus == 'pass'" id="currentBnForumPmBox" class="copy-paste collapse">
                <samp class="small">Hello!</samp><br><br>
                <span v-if="discussRound.bn.probation.indexOf(discussRound.mode) >= 0">
                    <samp class="small">Following a positive evaluation of your work as a BN for the [i]{{ discussRound.mode == 'osu' ? 'osu!' : 'osu!' + discussRound.mode }}[/i] game mode, we've decided to conclude your probation period and promote you to a full Beatmap Nominator. Congratulations!</samp><br><br>
                    <samp class="small">You may now nominate maps that are nominated by other probation BNs, and you may disqualify maps when applicable.</samp><br><br>
                </span>
                <span v-else-if="discussRound.isLowActivity">
                    <samp class="small">We've noticed that your nomination activity for the [i]{{ discussRound.mode == 'osu' ? 'osu!' : 'osu!' + discussRound.mode }}[/i] game mode is too low to effectively evaluate your work as a Beatmap Nominator. That said, we won't place you on probation, however we will follow up on your nomination activity one month from now in hopes that it improves. If it does not, you will likely be removed from the Beatmap Nominators for this game mode.</samp><br><br>
                </span>
                <span v-else>
                    <samp class="small">After evaluating your work as a BN, we'd just like to let you know that you're doing well. Thanks!</samp><br><br>
                </span>
                <samp class="small">Additional feedback from the NAT:</samp><br><br>
                <samp><pre class="small">[notice]{{ feedback }}[/notice]</pre></samp>
                <samp class="small">We hope you have fun as a Beatmap Nominator!</samp>
            </div>
            <div v-else-if="discussRound.consensus == 'extend'" id="currentBnForumPmBox" class="copy-paste collapse">
                <samp class="small">Hello!</samp><br><br>
                <span v-if="discussRound.bn.probation.indexOf(discussRound.mode) >= 0">
                    <samp class="small">After reviewing your work as a BN for the [i]{{ discussRound.mode == 'osu' ? 'osu!' : 'osu!' + discussRound.mode }}[/i] game mode, we have decided to [b]extend your probation period[/b].</samp><br><br>
                    <samp class="small">We will evaluate you again in [b]one month[/b] to determine if the mentioned issues have been overcome. Assuming this is the case, you will be promoted to full Nominator status. Should these issues persist without substantial improvement however, you will be removed from the Beatmap Nominators.</samp><br><br>
                </span>
                <span v-else>
                    <samp class="small">After reviewing your work as a BN for the [i]{{ discussRound.mode == 'osu' ? 'osu!' : 'osu!' + discussRound.mode }}[/i] game mode, we have decided to [b]place you on probation[/b]. After one month, we will re-evaluate your work as a BN to determine if your probation should be lifted or if you should be removed from the Beatmap Nominators.</samp><br><br>
                </span>
                <samp class="small">Additional feedback from the NAT:</samp><br><br>
                <samp><pre class="small">[notice]{{ feedback }}[/notice]</pre></samp>
                <samp class="small">For further feedback or to appeal this decision, contact any of these users:
                    <span v-for="(evaluation, i) in discussRound.evaluations" :key="i">[url=https://osu.ppy.sh/users/{{ evaluation.evaluator.osuId }}]{{ evaluation.evaluator.username }}[/url]{{ i+1 != discussRound.evaluations.length ? ", " : "" }}</span>
                </samp><br><br>
                <samp class="small">We hope to see you off of probation soon!</samp><br><br>
                <samp class="small">Regards, the Nomination Assessment Team</samp>
            </div>
            <div v-else id="currentBnForumPmBox" class="copy-paste collapse">
                <samp class="small">Hello!</samp><br><br>
                <samp class="small">After reviewing your work as a BN for the [i]{{ discussRound.mode == 'osu' ? 'osu!' : 'osu!' + discussRound.mode }}[/i] game mode, we have decided to [b]remove you from the Beatmap Nominators[/b].</samp><br><br>
                <samp class="small">Despite this decision, we would like to thank you for your service to the mapping and modding communities and wish you the best of luck in your future endeavours. Should you wish to apply for the Beatmap Nominators in the future, you may do so on {{ defineDate(discussRound.updatedAt) }}, provided you meet the normal required activity requirements and have shown improvement in the areas mentioned.</samp><br><br>
                <samp class="small">Additional feedback from the NAT:</samp><br><br>
                <samp><pre class="small">[notice]{{ feedback }}[/notice]</pre></samp>
                <samp class="small">For further feedback or to appeal this decision, contact any of these users:
                    <span v-for="(evaluation, i) in discussRound.evaluations" :key="i">[url=https://osu.ppy.sh/users/{{ evaluation.evaluator.osuId }}]{{ evaluation.evaluator.username }}[/url]{{ i+1 != discussRound.evaluations.length ? ", " : "" }}</span>
                </samp><br><br>
                <samp class="small">Good luck!</samp><br><br>
                <samp class="small">Regards, the Nomination Assessment Team</samp>
            </div>
        </div>
    </div>
</template>

<script>

export default {
    name: 'FeedbackPm',
    props: [ 'discussApp', 'discussRound', 'discordLink', 'feedback' ],
    methods: {
        defineDate(date){
            date = new Date(date);
            let reapply = new Date(date.setDate(date.getDate() + 90)).toString().slice(4, 15);
            return reapply;
        },
    },
};
</script>