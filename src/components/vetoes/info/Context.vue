<template>
    <div class="text-shadow mb-2">
        <p class="min-spacing">
            Veto reason:
        </p>
        <p class="small px-4">
            <span v-html="filterLinks(veto.shortReason)" />
            --
            <a :href="veto.discussionLink" target="_blank">Read the full veto discussion here!</a>
        </p>
        <div v-if="veto.status == 'upheld' || veto.status == 'withdrawn'" class="mt-2">
            <p class="min-spacing">
                Consensus:
            </p>
            <p class="small px-4">
                Veto {{ veto.status }}
            </p>
        </div>
    </div>
</template>

<script>
import filterLinks from '../../../mixins/filterLinks.js';

export default {
    name: 'Context',
    mixins: [ filterLinks ],
    props: {
        veto: {
            type: Object,
            required: true,
            discussionLink: String,
            status: String,
        },
    },
};
</script>
