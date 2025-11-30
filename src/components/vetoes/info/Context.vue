<template>
    <div class="mb-2">
        <b>Veto reasons:</b>

        <ol>
            <li v-for="reason in selectedVeto.reasons" :key="reason.summary">
                <a v-if="selectedVeto.version <= 6" :href="reason.link" target="_blank">{{ reason.summary }}</a>
                <span v-else v-html="$md.render(reason.summary)" />
            </li>
        </ol>
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
