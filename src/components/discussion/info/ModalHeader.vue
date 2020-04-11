<template>
    <div class="modal-header text-dark bg-nat-logo">
        <h5 class="modal-title">
            <a
                v-if="discussionLink.length"
                class="text-dark"
                :href="discussionLink"
                target="_blank"
            >{{ title }}</a>
            <span v-else class="text-dark">{{ title }}</span>
            <i v-if="mode.indexOf('osu') >= 0" class="far fa-circle" />
            <i v-if="mode.indexOf('taiko') >= 0" class="fas fa-drum" />
            <i v-if="mode.indexOf('catch') >= 0" class="fas fa-apple-alt" />
            <i v-if="mode.indexOf('mania') >= 0" class="fas fa-stream" />
            <span v-if="mode.indexOf('all') >= 0">
                <i class="far fa-circle" />
                <i class="fas fa-drum" />
                <i class="fas fa-apple-alt" />
                <i class="fas fa-stream" />
            </span>
        </h5>
        <button type="button" class="close" data-dismiss="modal">
            <span>&times;</span>
        </button>
    </div>
</template>

<script>
export default {
    name: 'ModalHeader',
    props: {
        discussionLink: String,
        title: String,
        mode: String,
    },
};
</script>