<template>
    <div id="forumMessage" class="copy-paste collapse">
        <samp class="small">Hello!</samp><br><br>
        <samp class="small">You have been selected as a veto mediator for [url=https://osu.ppy.sh/beatmapsets/{{ beatmapId }}]{{ beatmapTitle }}[/url].</samp><br><br>
        <samp class="small">The map is currently vetoed for the following reason:</samp><br><br>
        <samp class="small">[notice]{{ shortReason }}[/notice]</samp><br><br>
        <samp class="small">Veto discussion can be found [url={{ discussionLink }}]here[/url].</samp><br><br>
        <samp class="small">Please post your opinion regarding the veto on the [url=http://bn.mappersguild.com/vetoes]BN/NAT website[/url] in [b]one week[/b]. Your decision will be anonymous to everyone but members of the NAT.</samp><br><br>
        <samp class="small">If you have a good reason not to participate in veto mediations, reply to this message.</samp><br><br>
        <samp class="small">Thank you for your hard work!</samp><br><br>
    </div>
</template>

<script>
export default {
    name: 'ForumPm',
    props: {
        beatmapId: {
            type: Number,
            required: true,
        },
        beatmapTitle: {
            type: String,
            required: true,
        },
        discussionLink: {
            type: String,
            required: true,
        },
        shortReason: {
            type: String,
            required: true,
        },
    },
};
</script>
