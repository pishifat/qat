<template>
    <div
        class="modal-header text-dark"
        :class="probation.length && group != 'nat' ? 'bg-probation' : 'bg-' + group"
    >
        <h5 class="modal-title">
            <a class="text-dark" :href="'https://osu.ppy.sh/users/' + osuId">{{ username }}</a>
            <i v-if="modes.indexOf('osu') >= 0" class="far fa-circle" />
            <i v-if="modes.indexOf('taiko') >= 0" class="fas fa-drum" />
            <i v-if="modes.indexOf('catch') >= 0" class="fas fa-apple-alt" />
            <i v-if="modes.indexOf('mania') >= 0" class="fas fa-stream" />
        </h5>
        <button type="button" class="close" data-dismiss="modal">
            <span>&times;</span>
        </button>
    </div>
</template>

<script>

export default {
    name: 'modal-header',
    props: {
        osuId: Number,
        username: String,
        modes: Array,
        group: String,
        probation: Array,
    },
};
</script>