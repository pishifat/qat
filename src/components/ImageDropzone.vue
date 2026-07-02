<template>
    <div class="image-dropzone-wrap">
        <input
            ref="fileInput"
            type="file"
            class="image-dropzone-input"
            :accept="accept"
            @change="onInputChange"
        >
        <div
            class="image-dropzone"
            :class="[
                `image-dropzone-${variant}`,
                {
                    'image-dropzone-has-file': !!preview,
                    'image-dropzone-paste-armed': pasteArmed && enablePaste && !preview,
                },
            ]"
            role="button"
            tabindex="0"
            @click="openPicker"
            @keydown.enter.prevent="openPicker"
            @keydown.space.prevent="openPicker"
            @dragover.prevent
            @drop.prevent="onDrop"
            @paste="onPaste"
        >
            <template v-if="preview && variant === 'compact'">
                <img :src="preview" class="image-dropzone-preview image-dropzone-preview-compact" alt="">
                <span class="small text-secondary">{{ activeLabel }}</span>
                <button
                    v-if="clearable"
                    type="button"
                    class="btn btn-sm btn-outline-secondary ms-auto"
                    @click.stop="clear"
                >
                    Clear
                </button>
            </template>
            <img
                v-else-if="preview"
                :src="preview"
                class="image-dropzone-preview"
                alt="Selected image preview"
            >
            <div
                v-else
                class="image-dropzone-empty"
                :class="{ 'image-dropzone-empty-compact': variant === 'compact' }"
            >
                <i
                    class="fas"
                    :class="variant === 'compact' ? 'fa-image' : 'fa-cloud-upload-alt fa-2x mb-2'"
                />
                <div>{{ emptyText }}</div>
            </div>
        </div>
    </div>
</template>

<script>
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default {
    name: 'ImageDropzone',
    props: {
        modelValue: {
            type: File,
            default: null,
        },
        accept: {
            type: String,
            default: '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp',
        },
        maxBytes: {
            type: Number,
            default: 5 * 1024 * 1024,
        },
        emptyText: {
            type: String,
            default: 'Click or drop an image here',
        },
        activeLabel: {
            type: String,
            default: 'Image selected',
        },
        variant: {
            type: String,
            default: 'default',
            validator: (value) => ['default', 'compact'].includes(value),
        },
        clearable: {
            type: Boolean,
            default: false,
        },
        enablePaste: {
            type: Boolean,
            default: false,
        },
        pasteArmed: {
            type: Boolean,
            default: false,
        },
        allowAnyImage: {
            type: Boolean,
            default: false,
        },
        allowedTypes: {
            type: Array,
            default: () => DEFAULT_ALLOWED_TYPES,
        },
        invalidTypeMessage: {
            type: String,
            default: 'Only JPG, PNG, and WEBP images are allowed',
        },
        maxSizeMessage: {
            type: String,
            default: 'Image must be 5MB or smaller',
        },
    },
    emits: ['update:modelValue', 'error'],
    data() {
        return {
            preview: null,
        };
    },
    watch: {
        modelValue(file) {
            if (!file) {
                this.revokePreview();
                this.resetInput();
            } else if (!this.preview) {
                this.preview = URL.createObjectURL(file);
            }
        },
        pasteArmed: {
            immediate: true,
            handler(armed) {
                this.syncWindowPasteListener(armed);
            },
        },
        enablePaste() {
            this.syncWindowPasteListener(this.pasteArmed);
        },
    },
    beforeUnmount() {
        this.revokePreview();
        this.syncWindowPasteListener(false);
    },
    methods: {
        syncWindowPasteListener(armed) {
            window.removeEventListener('paste', this.onWindowPaste);

            if (armed && this.enablePaste) {
                window.addEventListener('paste', this.onWindowPaste);
            }
        },
        handlePaste(event) {
            const items = event.clipboardData?.items || [];

            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        event.preventDefault();
                        this.setFile(file);
                    }
                    break;
                }
            }
        },
        onWindowPaste(event) {
            if (!this.enablePaste || !this.pasteArmed) return;
            this.handlePaste(event);
        },
        revokePreview() {
            if (this.preview) {
                URL.revokeObjectURL(this.preview);
                this.preview = null;
            }
        },
        resetInput() {
            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = '';
            }
        },
        openPicker() {
            this.$refs.fileInput?.click();
        },
        isAllowedType(file) {
            if (this.allowAnyImage) {
                return file.type.startsWith('image/');
            }

            return this.allowedTypes.includes(file.type);
        },
        setFile(file) {
            if (!file) return;

            if (!this.isAllowedType(file)) {
                this.$emit('error', this.invalidTypeMessage);
                return;
            }

            if (this.maxBytes > 0 && file.size > this.maxBytes) {
                this.$emit('error', this.maxSizeMessage);
                return;
            }

            this.revokePreview();
            this.preview = URL.createObjectURL(file);
            this.$emit('update:modelValue', file);
        },
        onInputChange(event) {
            this.setFile(event.target.files?.[0] || null);
        },
        onDrop(event) {
            this.setFile(event.dataTransfer?.files?.[0] || null);
        },
        onPaste(event) {
            if (!this.enablePaste) return;
            this.handlePaste(event);
        },
        clear() {
            this.revokePreview();
            this.resetInput();
            this.$emit('update:modelValue', null);
        },
    },
};
</script>

<style scoped>
.image-dropzone-input {
    display: none;
}

.image-dropzone {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed rgba(255, 255, 255, 0.25);
    border-radius: 0.375rem;
    cursor: pointer;
    overflow: hidden;
    transition: border-color 0.15s ease, background-color 0.15s ease;
}

.image-dropzone:hover,
.image-dropzone:focus-visible {
    border-color: rgba(255, 255, 255, 0.45);
    background-color: rgba(255, 255, 255, 0.03);
    outline: none;
}

.image-dropzone-has-file {
    border-style: solid;
}

.image-dropzone-paste-armed {
    border-color: rgba(255, 255, 255, 0.45);
    background-color: rgba(255, 255, 255, 0.03);
}

.image-dropzone-default {
    min-height: 10rem;
    margin-top: 0.25rem;
    padding: 1rem;
}

.image-dropzone-compact {
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
}

.image-dropzone-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: rgba(255, 255, 255, 0.55);
    text-align: center;
}

.image-dropzone-empty-compact {
    flex-direction: row;
    gap: 0.5rem;
}

.image-dropzone-preview {
    max-width: 100%;
    max-height: 14rem;
    object-fit: contain;
    border-radius: 0.25rem;
}

.image-dropzone-preview-compact {
    width: 48px;
    height: 48px;
    max-height: 48px;
    object-fit: cover;
}
</style>
