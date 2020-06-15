<template>
    <div class="modal-header bg-primary">
        <h5 class="modal-title">
            <a
                v-if="selectedReport.culprit"
                :href="'https://osu.ppy.sh/users/' + selectedReport.culprit.osuId"
                target="_blank"
            >
                {{ selectedReport.culprit.username }}
            </a>

            <span v-else>Report details</span>
        </h5>
        <button type="button" class="close" data-dismiss="modal">
            <span>&times;</span>
        </button>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'ModalHeader',
    computed: mapGetters('manageReports', [
        'selectedReport',
    ]),
};
</script>