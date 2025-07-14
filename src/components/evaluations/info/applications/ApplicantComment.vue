<template>
    <div class="mb-2">
        <b>Comment:</b>
        <span v-if="!comment.length" class="text-secondary">
            None...
        </span>
        <div v-else class="small card card-body v-html-content" v-html="$md.render(comment)" />
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
