<template>
    <div class="modal fade" tabindex="-1">
        <div class="modal-dialog" :class="`modal-${modalSize}`">
            <div class="modal-content">
                <div v-if="title" class="modal-header bg-primary">
                    <h5 class="modal-title">
                        {{ title }}
                    </h5>

                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <slot name="header" />

                <div class="modal-body">
                    <slot />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ModalDialog',
    props: {
        title: {
            type: String,
            default: '',
        },
        modalSize: {
            type: String,
            default: 'lg',
        },
        documentTitle: {
            type: String,
            default: '',
        },
    },
    watch: {
        documentTitle() {
            this.applyDocumentTitle();
        },
    },
    mounted() {
        this.$el.addEventListener('shown.bs.modal', this.applyDocumentTitle);
        this.$el.addEventListener('hidden.bs.modal', this.restoreDocumentTitle);
    },
    beforeUnmount() {
        this.$el.removeEventListener('shown.bs.modal', this.applyDocumentTitle);
        this.$el.removeEventListener('hidden.bs.modal', this.restoreDocumentTitle);
    },
    methods: {
        applyDocumentTitle() {
            if (this.documentTitle && this.$el.classList.contains('show')) {
                document.title = `${this.documentTitle} · BN Management`;
            }
        },
        restoreDocumentTitle() {
            if (!this.documentTitle) return;

            document.title = this.$route.meta.title
                ? `${this.$route.meta.title} · BN Management`
                : 'BN Management';
        },
    },
};
</script>
