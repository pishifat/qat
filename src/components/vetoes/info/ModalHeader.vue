<template>
    <div class="modal-header" :style="bgColor">
        <h5 class="modal-title">
            <a :href="`https://osu.ppy.sh/beatmapsets/${selectedVeto.beatmapId}`" target="_blank" class="text-white">
                <b>{{ selectedVeto.beatmapTitle }}</b>
            </a>
            by
            <a :href="`https://osu.ppy.sh/users/${selectedVeto.beatmapMapperId}`" target="_blank" class="text-white">
                <b>{{ selectedVeto.beatmapMapper }}</b>
            </a>

            <mode-display
                :modes="selectedVeto.mode"
                :show-all="true"
            />
        </h5>
        <button type="button" class="close" data-dismiss="modal">
            &times;
        </button>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ModeDisplay from '../../ModeDisplay.vue';

export default {
    name: 'ModalHeader',
    components: {
        ModeDisplay,
    },
    computed: {
        ...mapGetters('vetoes', [
            'selectedVeto',
        ]),
        bgColor () {
            if (!this.selectedVeto) return '';

            let style = 'background-color: ';

            switch (this.selectedVeto.status) {
                case 'available':
                    return style + 'var(--success)';
                case 'upheld':
                    return style + 'var(--warning)';
                case 'wip':
                    return style + 'var(--purple)';
                case 'withdrawn':
                    return style + 'var(--danger)';
                default:
                    return style + 'var(--bright-blue-gray)';
            }
        },
    },
};
</script>
