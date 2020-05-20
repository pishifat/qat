<template>
    <div>
        <p class="text-shadow">
            Reason: <pre class="small pre-font ml-4" v-html="filterLinks(selectedReport.reason)" />
        </p>
        <p v-if="selectedReport.link" class="text-shadow">
            Relevant link: <span v-html="filterLinks(selectedReport.link)" />
        </p>
        <p class="text-shadow">
            Reported: {{ selectedReport.createdAt.slice(0,10) }}
        </p>
        <p v-if="!selectedReport.isActive" class="text-shadow">
            Reported by: <a :href="'https://osu.ppy.sh/users/' + selectedReport.reporter.osuId" target="_blank">{{ selectedReport.reporter.username }}</a>
        </p>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import filterLinks from '../../../mixins/filterLinks.js';

export default {
    name: 'Context',
    mixins: [filterLinks],
    computed: {
        ...mapGetters([
            'selectedReport',
        ]),
    },
};
</script>