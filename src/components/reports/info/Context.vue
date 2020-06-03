<template>
    <div>
        <p>
            <b>Reason:</b>
        </p>

        <div class="small ml-4 mb-3 text-secondary" v-html="$md.render(selectedReport.reason)" />

        <p v-if="selectedReport.link">
            <b>Relevant link:</b>
            <span class="text-secondary" v-html="$md.render(selectedReport.link)" />
        </p>
        <p>
            <b>Reported:</b>
            <span class="text-secondary">{{ selectedReport.createdAt.slice(0,10) }}</span>
        </p>
        <p v-if="!selectedReport.isActive">
            <b>Reported by:</b>

            <a :href="'https://osu.ppy.sh/users/' + selectedReport.reporter.osuId" target="_blank">
                {{ selectedReport.reporter.username }}
            </a>
        </p>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'Context',
    computed: {
        ...mapGetters([
            'selectedReport',
        ]),
    },
};
</script>