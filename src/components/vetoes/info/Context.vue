<template>
    <div class="mb-2">
        Veto reasons:

        <ul>
            <li v-for="reason in selectedVeto.reasons" :key="reason.summary">
                <a :href="reason.link" target="_blank">{{ reason.summary }}</a>
            </li>
        </ul>

        <div v-if="selectedVeto.status == 'upheld' || selectedVeto.status == 'withdrawn'" class="mt-2">
            Consensus:
            <p class="small px-4">
                Veto {{ selectedVeto.status }}
            </p>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'Context',
    computed: {
        ...mapGetters('vetoes', [
            'selectedVeto',
        ]),
    },
};
</script>
