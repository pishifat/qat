<template>
    <div class="row">
        <div class="col-md-12">
            <section class="card card-body mb-3">
                <h5 class="mb-2">
                    Markdown Editor
                </h5>
                <textarea
                    v-model="content"
                    class="form-control"
                    placeholder="Enter markdown here..."
                    :rows="10"
                />
            </section>

            <section class="card card-body v-html-content">
                <h5 class="mb-2">
                    Preview
                </h5>
                <hr class="mt-1 mb-3">
                <div
                    v-if="content"
                    v-html="$md.render(content)"
                />
                <span
                    v-else
                    class="text-secondary"
                >
                    Preview will appear here...
                </span>
            </section>
        </div>
    </div>
</template>

<script>
export default {
    name: 'MarkdownPage',
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

<style scoped>
:deep(h1) {
    border-bottom: 1px solid rgba(211, 211, 211, 0.25);
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    font-weight: 600;
    font-size: 30px;
}
:deep(h2) {
    margin: 2rem 0 1rem;
    border-bottom: 1px solid rgba(211, 211, 211, 0.25);
    padding-bottom: 0.5rem;
    font-weight: 600;
    font-size: 24px;
}
:deep(h3) {
    margin: 2rem 0 1rem;
    font-size: 20px;
}
:deep(h4) {
    margin: 2rem 0 1rem;
    font-size: 16px;
}

:deep(table) {
    border-collapse: collapse;
    margin: 2rem 0;
}
:deep(thead tr) {
    border-bottom: 2px solid rgba(124, 151, 165, 0.2);
}
:deep(thead tr th) {
    background-color: var(--bs-bright-blue-gray);
    border-color: rgba(124, 151, 165, 0.2);
    padding: 5px 10px;
}
:deep(tbody tr) {
    border-bottom: 1px solid rgba(211, 211, 211, 0.15);
}
:deep(tbody tr:last-child) {
    border-bottom: none;
}
:deep(tbody tr td) {
    padding: 5px;
}

:deep(p > img:only-child) {
    display: block;
    margin: 0 auto;
}

:deep(img) {
    display: inline-block;
    margin: 0;
    padding: 5px;
}

:deep(li) {
    padding: 2px 0;
}
</style>
