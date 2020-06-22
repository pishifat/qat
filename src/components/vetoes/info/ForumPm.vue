<template>
    <div id="forumMessage" class="collapse card card-body small">
        <span>Hello!</span><br><br>
        <span>You have been selected as a veto mediator for [url=https://osu.ppy.sh/beatmapsets/{{ selectedVeto.beatmapId }}]{{ selectedVeto.beatmapTitle }}[/url].</span><br>
        <span>The map is currently vetoed for the following reason:</span><br>
        <span>[notice] {{ selectedVeto.shortReason }} [/notice]</span><br>
        <span>Veto discussion can be found [url={{ selectedVeto.discussionLink }}]here[/url].</span><br>
        <span>Please post your opinion regarding the veto on the [url=http://bn.mappersguild.com/vetoes]BN/NAT website[/url] in [b]one week[/b]. Your decision will be anonymous to everyone but members of the NAT.</span><br>
        <span>If you have a good reason not to participate in veto mediations, reply to this message.</span><br>
        <span>Thank you for your hard work!</span>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'ForumPm',
    computed: {
        ...mapGetters('vetoes', [
            'selectedVeto',
        ]),
    },
};
</script>
