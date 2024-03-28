<template>
    <div class="mb-2">
        <b>Comment:</b>
        <span class="text-secondary">{{ comment }}</span>
    </div>
</template>

<script>
export default {
    name: 'ApplicantComment',
    props: {
        comment: {
            type: String,
            default: '',
        },
    },
};
</script>
