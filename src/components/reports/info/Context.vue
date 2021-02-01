<template>
    <div>
        <p>
            <b>Category:</b>
        </p>

        <div class="ml-4 mb-3 small text-secondary">
            {{ category }}
        </div>

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

            <user-link
                :osu-id="selectedReport.reporter.osuId"
                :username="selectedReport.reporter.username"
            />
        </p>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import UserLink from '../../UserLink.vue';

export default {
    name: 'Context',
    components: {
        UserLink,
    },
    computed: {
        ...mapGetters('manageReports', [
            'selectedReport',
        ]),
        category() {
            switch (this.selectedReport.category) {
                case 'stolenBeatmap':
                    return 'Stolen beatmap';
                case 'contentCaseSong':
                    return 'Inappropriate song';
                case 'contentCaseVisual':
                    return 'Inappropriate visual content';
                case 'behavior':
                    return 'User behavior';
                case 'other':
                    return 'Other';
                default:
                    return 'No category';
            }
        },
    },
};
</script>