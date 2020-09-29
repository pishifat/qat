<template>
    <div id="forumMessage" class="collapse card card-body small">
        <div>Hello!</div><br>
        <div>You have been selected as a veto mediator for [url=https://osu.ppy.sh/beatmapsets/{{ selectedVeto.beatmapId }}]{{ selectedVeto.beatmapTitle }}[/url].</div>
        <div>The map is currently vetoed for the following reason{{ selectedVeto.reasons.length > 1 ? 's' : '' }}:</div>
        <div>
            [notice][list]
            <div v-for="reason in selectedVeto.reasons" :key="reason">
                [*][url={{ reason.link }}]{{ reason.summary }}[/url]
            </div>
            [/list][/notice]
        </div>
        <div>Please post your opinion regarding the veto on the [url=http://bn.mappersguild.com/vetoes]BN/NAT website[/url] in [b]one week[/b]. Your decision will be anonymous to everyone but members of the NAT.</div>
        <div>If you have a good reason not to participate in veto mediations, reply to this message.</div><br>
        <div>Thank you for your hard work!</div>
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
