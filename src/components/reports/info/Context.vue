<template>
    <div>
        <p>
            <b>Category:</b> <span class="text-secondary">{{ category }}</span>
        </p>
        <p>
            <b>Reported:</b> <span class="text-secondary">{{ toStandardDate(selectedReport.createdAt) }}</span>
        </p>
        <template v-if="selectedReport.link">
            <p>
                <b>Relevant link:</b>
                <span class="text-secondary text-truncate">
                    <a v-if="safeLink" :href="safeLink" target="_blank" rel="noopener noreferrer">
                        {{ selectedReport.link }}
                    </a>
                    <span v-else>{{ selectedReport.link }}</span>
                </span>
            </p>
        </template>
        <p>
            <b>Reason:</b>
        </p>

        <div class="small ms-4 mb-3 text-secondary" v-html="$md.render(selectedReport.reason)" />





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
        safeLink() {
            return this.sanitizeUrl(this.selectedReport.link);
        },
        category() {
            switch (this.selectedReport.category) {
                case 'stolenBeatmap':
                    return 'Stolen beatmap';
                case 'beatmap':
                    return 'Beatmap';
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