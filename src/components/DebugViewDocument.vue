<template>
    <div class="mb-2">
        <hr>
        <b>Debug</b>
        <div class="ms-3">
            <a href="#debugDocument" data-bs-toggle="collapse">
                view document <i class="fas fa-angle-down" />
            </a>
            <pre id="debugDocument" class="collapse container">{{ JSON.stringify(document, null, 4) }}</pre>
        </div>
    </div>
</template>

<script>
export default {
    name: 'DebugViewDocument',
    props: {
        document: Object,
    },
};
</script>
