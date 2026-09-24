<template>
    <div class="row">
        <div class="col-md-12">
            <section class="card card-body mb-3">
                <h5 class="mb-2">
                    Markdown Editor
                </h5>
                <markdown-editor
                    v-model="content"
                    storage-key="md:markdown-playground"
                    placeholder="Enter markdown here..."
                    :rows="10"
                />
            </section>
        </div>
    </div>
</template>

<script>
import MarkdownEditor from '../components/MarkdownEditor.vue';

export default {
    name: 'MarkdownPage',
    components: {
        MarkdownEditor,
    },
    data() {
        return {
            content: '',
        };
    },
    created() {
        document.title = 'Markdown Editor';
    },
};
</script>
