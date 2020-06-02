<template>
    <div class="modal fade" tabindex="-1">
        <div class="modal-dialog" :class="`modal-${modalSize}`">
            <div class="modal-content">
                <div v-if="title" class="modal-header bg-primary">
                    <h5 class="modal-title">
                        {{ title }}
                    </h5>

                    <button type="button" class="close" data-dismiss="modal">
                        &times;
                    </button>
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
    },
};
</script>
