<template>
    <modal-dialog id="reportInfo">
        <template v-if="selectedReport" #header>
            <modal-header />
        </template>

        <div v-if="selectedReport" class="container">
            <context />

            <hr>

            <feedback class="mb-3" />

            <feedback-pm />
        </div>
    </modal-dialog>
</template>

<script>
import { mapGetters } from 'vuex';
import ModalHeader from './info/ModalHeader.vue';
import Context from './info/Context.vue';
import Feedback from './info/Feedback.vue';
import FeedbackPm from './info/FeedbackPm.vue';
import ModalDialog from '../ModalDialog.vue';

export default {
    name: 'ReportInfo',
    components: {
        ModalHeader,
        Context,
        Feedback,
        FeedbackPm,
        ModalDialog,
    },
    computed: mapGetters('manageReports', [
        'selectedReport',
    ]),
};
</script>