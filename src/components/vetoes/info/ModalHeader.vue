<template>
    <div class="modal-header" :class="bgColor">
        <h5 class="modal-title">
            <a :href="`https://osu.ppy.sh/beatmapsets/${selectedVeto.beatmapId}`" target="_blank">{{ selectedVeto.beatmapTitle }}</a> by
            <a :href="`https://osu.ppy.sh/users/${selectedVeto.beatmapMapperId}`" target="_blank">{{ selectedVeto.beatmapMapper }}</a>
            <i v-if="selectedVeto.mode.indexOf('osu') >= 0" class="far fa-circle" />
            <i v-else-if="selectedVeto.mode.indexOf('taiko') >= 0" class="fas fa-drum" />
            <i v-else-if="selectedVeto.mode.indexOf('catch') >= 0" class="fas fa-apple-alt" />
            <i v-else-if="selectedVeto.mode.indexOf('mania') >= 0" class="fas fa-stream" />
            <span v-else>
                <i class="far fa-circle" />
                <i class="fas fa-drum" />
                <i class="fas fa-apple-alt" />
                <i class="fas fa-stream" />
            </span>
        </h5>
        <button type="button" class="close" data-dismiss="modal">
            &times;
        </button>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'ModalHeader',
    computed: {
        ...mapGetters([
            'selectedVeto',
        ]),
        bgColor () {
            if (!this.selectedVeto) return '';

            switch (this.selectedVeto.status) {
                case 'available':
                    return 'bg-success';
                case 'upheld':
                    return 'bg-warning';
                case 'wip':
                    return 'bg-purple';
                case 'withdrawn':
                    return 'bg-danger';
                default:
                    return 'bg-bright-blue-gray';
            }
        },
    },
};
</script>
