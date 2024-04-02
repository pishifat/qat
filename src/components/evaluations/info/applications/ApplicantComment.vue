<template>
    <div class="mb-2">
        <b>Comment:</b>
        <span class="text-secondary">{{ comment || 'None...' }}</span>
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
