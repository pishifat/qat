<template>
    <div class="modal-header bg-primary">
        <h5 class="modal-title">
            Report:
            <user-link
                v-if="selectedReport.culprit"
                :osu-id="selectedReport.culprit.osuId"
                :username="selectedReport.culprit.username"
            />

            <span v-else v-html="$md.render(selectedReport.link)" />
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