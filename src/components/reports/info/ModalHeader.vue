<template>
    <div class="modal-header bg-primary">
        <h5 class="modal-title overflow-auto text-break py-1 d-inline-flex">
            Report:
            <user-link
                class="mx-1"
                v-if="selectedReport.culprit"
                :osu-id="selectedReport.culprit.osuId"
                :username="selectedReport.culprit.username"
            />

            <a v-else :href="selectedReport.link" target="_blank" class="mx-1">
                {{ selectedReport.link }}
            </a>
        </h5>
        <button type="button" class="close" data-dismiss="modal">
            <span>&times;</span>
        </button>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import UserLink from '../../UserLink.vue';

export default {
    name: 'ModalHeader',
    components: {
        UserLink,
    },
    computed: mapGetters('manageReports', [
        'selectedReport',
    ]),
};
</script>