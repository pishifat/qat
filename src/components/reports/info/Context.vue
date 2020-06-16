<template>
    <div>
        <p>
            <b>Reason:</b>
        </p>

        <div class="small ml-4 mb-3 text-secondary" v-html="$md.render(selectedReport.reason)" />

        <template v-if="selectedReport.link">
            <p>
                <b>Relevant link:</b>
            </p>

            <div class="small ml-4 mb-3 text-secondary text-truncate">
                <a :href="selectedReport.link" target="_blank">
                    {{ selectedReport.link }}
                </a>
            </div>
        </template>

        <p>
            <b>Reported:</b>
            <span class="text-secondary">{{ selectedReport.createdAt | toStandardDate }}</span>
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
    computed: mapGetters('manageReports', [
        'selectedReport',
    ]),
};
</script>