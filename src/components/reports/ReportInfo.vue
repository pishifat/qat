<template>
    <div id="reportInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="selectedReport" class="modal-content">
                <modal-header />
                <div class="modal-body" style="overflow: hidden">
                    <div class="container">
                        <context />

                        <hr>

                        <feedback />

                        <feedback-pm />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ModalHeader from './info/ModalHeader.vue';
import Context from './info/Context.vue';
import Feedback from './info/Feedback.vue';
import FeedbackPm from './info/FeedbackPm.vue';

export default {
    name: 'ReportInfo',
    components: {
        ModalHeader,
        Context,
        Feedback,
        FeedbackPm,
    },
    computed: {
        ...mapGetters([
            'selectedReport',
        ]),
    },
    watch: {
        selectedReport() {
            history.pushState(null, 'Manage Reports', `/managereports?report=${this.selectedReport.id}`);
        },
    },
};
</script>