<template>
    <div class="modal-header" :style="bgColor">
        <h5 class="modal-title">
            <a :href="`https://osu.ppy.sh/beatmapsets/${selectedVeto.beatmapId}`" target="_blank" class="text-white">
                <b>{{ selectedVeto.beatmapTitle }}</b>
            </a>
            by
            <user-link
                class="text-white"
                :osu-id="selectedVeto.beatmapMapperId"
                :username="selectedVeto.beatmapMapper"
            />

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
import UserLink from '../../UserLink.vue';

export default {
    name: 'ModalHeader',
    components: {
        ModeDisplay,
        UserLink,
    },
    computed: {
        ...mapGetters('vetoes', [
            'selectedVeto',
        ]),
        bgColor () {
            if (!this.selectedVeto) return '';

            let style = 'background-color: ';

            switch (this.selectedVeto.status) {
                case 'pending':
                    return style + 'var(--neutral)';
                case 'available':
                    return style + 'var(--danger)';
                case 'wip':
                    return style + 'var(--warning)';
                case 'archive':
                    return style + 'var(--success)';
                default:
                    return style + 'var(--bright-blue-gray)';
            }
        },
    },
};
</script>
