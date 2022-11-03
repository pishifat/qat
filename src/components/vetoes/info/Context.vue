<template>
    <div class="mb-2">
        Veto reasons:

        <ul>
            <li v-for="reason in selectedVeto.reasons" :key="reason.summary">
                <a :href="reason.link" target="_blank">{{ reason.summary }}</a>
            </li>
        </ul>
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
