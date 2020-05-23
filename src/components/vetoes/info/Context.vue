<template>
    <div class="text-shadow mb-2">
        <p class="min-spacing">
            Veto reason:
        </p>
        <p class="small px-4">
            <span v-html="filterLinks(selectedVeto.shortReason)" />
            --
            <a :href="selectedVeto.discussionLink" target="_blank">Read the full veto discussion here!</a>
        </p>
        <div v-if="selectedVeto.status == 'upheld' || selectedVeto.status == 'withdrawn'" class="mt-2">
            <p class="min-spacing">
                Consensus:
            </p>
            <p class="small px-4">
                Veto {{ selectedVeto.status }}
            </p>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import filterLinks from '../../../mixins/filterLinks.js';

export default {
    name: 'Context',
    mixins: [ filterLinks ],
    computed: {
        ...mapGetters([
            'selectedVeto',
        ]),
    },
};
</script>
