<template>
    <div class="markdown-editor">
        <div class="markdown-toolbar" role="toolbar">
            <div
                v-for="(group, groupIndex) in groups"
                :key="groupIndex"
                class="markdown-toolbar-group"
            >
                <button
                    v-for="action in group"
                    :key="action.label"
                    type="button"
                    class="markdown-toolbar-btn"
                    :title="action.label"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    :disabled="disabled"
                    @mousedown.prevent
                    @click="action.run"
                >
                    <i v-if="action.icon" :class="action.icon" />
                    <span v-else>{{ action.text }}</span>
                </button>
            </div>
            <button
                type="button"
                class="markdown-toolbar-btn markdown-toolbar-preview"
                :class="showPreview ? 'is-active' : ''"
                title="Toggle preview"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                :disabled="disabled"
                @mousedown.prevent
                @click="showPreview = !showPreview"
            >
                <i class="fa-solid fa-eye" />
            </button>
        </div>

        <div class="markdown-editor-body" :class="{ 'is-split': showPreview }">
            <textarea
                ref="input"
                class="form-control"
                :class="[inputClass, { 'is-growing': hasMaxHeight }]"
                :style="growingStyle"
                :rows="rows"
                :maxlength="maxlength || undefined"
                :placeholder="placeholder"
                :disabled="disabled"
                @input="onInput"
                @keydown="onKeydown"
                @paste="onPaste"
            />
            <div
                v-if="showPreview"
                class="markdown-preview small v-html-content"
                v-html="previewHtml"
            />
        </div>
    </div>
</template>

<script>
function isHttpUrl(text) {
    try {
        const url = new URL(text);

        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function hexDigits(text) {
    const match = text.match(/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/);

    return match ? match[1] : null;
}

function selectionInWrappedSyntax(value, start, end) {
    const spans = [];
    const linkRe = /!?\[[^\]\n]*\]\([^)\n]*\)/g;
    let match;

    while ((match = linkRe.exec(value))) {
        spans.push([match.index, match.index + match[0].length]);
    }

    const hexRe = /\{#[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?\}\(/g;

    while ((match = hexRe.exec(value))) {
        let depth = 1;
        let index = match.index + match[0].length;

        while (index < value.length && depth > 0) {
            if (value[index] === '(') depth++;
            else if (value[index] === ')') depth--;
            index++;
        }

        if (depth === 0) spans.push([match.index, index]);
    }

    return spans.some(([from, to]) => start < to && end > from);
}

export default {
    name: 'MarkdownEditor',
    props: {
        modelValue: {
            default: '',
        },
        storageKey: {
            type: String,
            default: '',
        },
        rows: {
            type: [Number, String],
            default: 5,
        },
        maxHeight: {
            type: [Number, String],
            default: 240,
        },
        maxlength: {
            type: [Number, String],
            default: null,
        },
        placeholder: {
            type: String,
            default: '',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        inputClass: {
            type: [String, Object, Array],
            default: '',
        },
        renderEnv: {
            type: Object,
            default: null,
        },
    },
    emits: ['update:modelValue'],
    data() {
        return {
            showPreview: false,
            restoring: false,
        };
    },
    computed: {
        groups() {
            return [
                [
                    { label: 'Bold', icon: 'fa-solid fa-bold', run: () => this.wrap('**') },
                    { label: 'Italic', icon: 'fa-solid fa-italic', run: () => this.wrap('*') },
                    { label: 'Strikethrough', icon: 'fa-solid fa-strikethrough', run: () => this.wrap('~~') },
                ],
                [
                    { label: 'Inline code', icon: 'fa-solid fa-code', run: () => this.wrap('`') },
                    { label: 'Code block', icon: 'fa-solid fa-file-code', run: () => this.wrap('```\n', '\n```') },
                ],
                [
                    { label: 'Heading 1', text: 'H1', run: () => this.prefixLines('# ') },
                    { label: 'Heading 2', text: 'H2', run: () => this.prefixLines('## ') },
                    { label: 'Heading 3', text: 'H3', run: () => this.prefixLines('### ') },
                ],
                [
                    { label: 'Quote', icon: 'fa-solid fa-quote-left', run: () => this.prefixLines('> ') },
                    { label: 'Bullet list', icon: 'fa-solid fa-list-ul', run: () => this.prefixLines('- ') },
                    { label: 'Numbered list', icon: 'fa-solid fa-list-ol', run: () => this.prefixLines('1. ') },
                ],
                [
                    { label: 'Link', icon: 'fa-solid fa-link', run: () => this.insertPlaceholder('[', 'TEXT', '](LINK)', 'LINK') },
                    { label: 'Image', icon: 'fa-solid fa-image', run: () => this.insertPlaceholder('![](', 'LINK', ')', null, true) },
                    { label: 'Horizontal rule', icon: 'fa-solid fa-minus', run: () => this.insert('\n---\n') },
                    { label: 'Table', icon: 'fa-solid fa-table', run: () => this.insert('\n| Column | Column |\n| --- | --- |\n|  |  |\n') },
                ],
                [
                    { label: 'Hex color', icon: 'fa-solid fa-palette', run: () => this.insertPlaceholder('{#HEX}(', 'TEXT', ')', 'HEX') },
                    { label: 'YouTube', icon: 'fa-brands fa-youtube', run: () => this.insertPlaceholder('@[youtube](', 'ID', ')', null) },
                ],
            ];
        },
        previewHtml() {
            return this.$md.render(this.modelValue || '', this.renderEnv || undefined);
        },
        hasMaxHeight() {
            return this.maxHeight != null && this.maxHeight !== '';
        },
        growingStyle() {
            if (!this.hasMaxHeight) return null;

            const maxHeight = typeof this.maxHeight === 'number' ? `${this.maxHeight}px` : this.maxHeight;

            return {
                '--editor-rows': this.rows,
                '--editor-max-height': maxHeight,
            };
        },
    },
    watch: {
        storageKey() {
            this.restoreDraft();
        },
        modelValue(value) {
            const el = this.$refs.input;
            const next = value || '';

            if (!el || el.value === next) return;

            el.value = next;
        },
    },
    mounted() {
        const el = this.$refs.input;

        if (el) el.value = this.modelValue || '';

        this.restoreDraft();
    },
    methods: {
        onInput(event) {
            const value = event.target.value;

            this.$emit('update:modelValue', value);
            this.persist(value);
        },
        onKeydown(event) {
            if (!(event.ctrlKey || event.metaKey) || event.altKey) return;

            const key = event.key.toLowerCase();

            if (key === 'b') {
                event.preventDefault();
                this.wrap('**');
            } else if (key === 'i') {
                event.preventDefault();
                this.wrap('*');
            }
        },
        onPaste(event) {
            const el = this.$refs.input;
            if (!el || el.selectionStart === el.selectionEnd) return;

            const pasted = (event.clipboardData && event.clipboardData.getData('text') || '').trim();
            if (!pasted) return;
            if (selectionInWrappedSyntax(el.value, el.selectionStart, el.selectionEnd)) return;

            const hex = hexDigits(pasted);
            if (hex) {
                event.preventDefault();
                this.wrap(`{#${hex}}(`, ')');
                return;
            }

            if (isHttpUrl(pasted)) {
                event.preventDefault();
                this.wrap('[', `](${pasted})`);
            }
        },
        selectionRange() {
            const el = this.$refs.input;
            const value = el ? el.value : (this.modelValue || '');
            const start = el ? el.selectionStart : value.length;
            const end = el ? el.selectionEnd : value.length;

            return { value, start, end };
        },
        replaceRange(start, end, text, selStart, selEnd) {
            const el = this.$refs.input;
            const value = el ? el.value : (this.modelValue || '');
            const next = value.slice(0, start) + text + value.slice(end);

            if (this.maxlength && next.length > Number(this.maxlength)) return;

            if (el) {
                el.focus();
                el.setSelectionRange(start, end);

                if (document.execCommand('insertText', false, text)) {
                    if (selStart != null) el.setSelectionRange(selStart, selEnd);

                    return;
                }
            }

            this.commit(next, selStart, selEnd);
        },
        wrap(before, after = before) {
            const { value, start, end } = this.selectionRange();
            const selected = value.slice(start, end);
            const inserted = before + selected + after;
            const cursor = start + before.length;

            this.replaceRange(start, end, inserted, cursor, selected ? cursor + selected.length : cursor);
        },
        prefixLines(prefix) {
            const { value, start, end } = this.selectionRange();
            const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
            const lineEndIdx = value.indexOf('\n', end);
            const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
            const block = value.slice(lineStart, lineEnd);
            const nextBlock = block.split('\n').map((line) => prefix + line).join('\n');

            this.replaceRange(lineStart, lineEnd, nextBlock, lineStart, lineStart + nextBlock.length);
        },
        insert(text) {
            const { start, end } = this.selectionRange();
            const cursor = start + text.length;

            this.replaceRange(start, end, text, cursor, cursor);
        },
        insertPlaceholder(before, token, after, filledToken, alwaysToken) {
            const { value, start, end } = this.selectionRange();
            const selected = alwaysToken ? '' : value.slice(start, end);
            const inserted = selected ? before + selected + after : before + token + after;
            let selStart;
            let selEnd;

            if (!selected) {
                selStart = start + before.length;
                selEnd = selStart + token.length;
            } else if (filledToken && after.includes(filledToken)) {
                selStart = start + before.length + selected.length + after.indexOf(filledToken);
                selEnd = selStart + filledToken.length;
            } else if (filledToken && before.includes(filledToken)) {
                selStart = start + before.indexOf(filledToken);
                selEnd = selStart + filledToken.length;
            } else {
                selStart = start + inserted.length;
                selEnd = selStart;
            }

            this.replaceRange(start, end, inserted, selStart, selEnd);
        },
        commit(next, selectionStart, selectionEnd) {
            if (this.maxlength && next.length > Number(this.maxlength)) return;

            this.$emit('update:modelValue', next);
            this.persist(next);

            const el = this.$refs.input;

            if (el && el.value !== next) el.value = next;
            if (!el || selectionStart == null) return;

            el.focus();
            el.setSelectionRange(selectionStart, selectionEnd);
        },
        persist(value) {
            if (!this.storageKey || this.restoring) return;

            window.localStorage.setItem(this.storageKey, value);
        },
        clearDraft() {
            if (this.storageKey) window.localStorage.removeItem(this.storageKey);
        },
        restoreDraft() {
            const key = this.storageKey;
            if (!key) return;

            this.$nextTick(() => {
                if (this.storageKey !== key || this.modelValue) return;

                const draft = window.localStorage.getItem(key);
                if (!draft) return;

                this.restoring = true;
                this.$emit('update:modelValue', draft);
                this.$nextTick(() => {
                    this.restoring = false;
                });
            });
        },
    },
};
</script>

<style scoped>
.markdown-editor {
    border: 1px solid rgba(124, 151, 165, 0.35);
    border-radius: 0.25rem;
    overflow: hidden;
}

.markdown-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0;
    margin: 0;
    padding: 0.2rem 0.35rem;
    background: var(--bs-bright-blue-gray);
    border-bottom: 1px solid rgba(124, 151, 165, 0.35);
}

.markdown-toolbar-group {
    display: inline-flex;
    align-items: center;
    gap: 1px;
    padding: 0 0.35rem;
}

.markdown-toolbar-group:first-child {
    padding-left: 0;
}

.markdown-toolbar-group + .markdown-toolbar-group {
    border-left: 1px solid rgba(124, 151, 165, 0.45);
}

.markdown-toolbar-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.7rem;
    height: 1.7rem;
    padding: 0;
    border: 0;
    border-radius: 0.2rem;
    background: transparent;
    color: var(--bs-secondary);
    font-size: 0.8rem;
    line-height: 1;
}

.markdown-toolbar-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    color: var(--bs-body-color);
}

.markdown-toolbar-btn:disabled {
    opacity: 0.45;
}

.markdown-toolbar-preview {
    margin-left: auto;
}

.markdown-toolbar-preview.is-active {
    color: var(--bs-success);
}

.markdown-editor-body {
    display: flex;
    align-items: stretch;
}

.markdown-editor-body textarea {
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
}

.markdown-editor-body textarea.is-growing {
    field-sizing: content;
    overflow-y: auto;
    resize: none;
    min-height: calc(var(--editor-rows) * 1lh + 0.75rem);
    max-height: var(--editor-max-height);
}

.markdown-editor-body.is-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
}

.markdown-preview {
    min-width: 0;
    height: 0;
    min-height: 100%;
    margin: 0;
    padding: 0.375rem 0.75rem;
    border-left: 1px solid rgba(124, 151, 165, 0.35);
    overflow: auto;
}
</style>
