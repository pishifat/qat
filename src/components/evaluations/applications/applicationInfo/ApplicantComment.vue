<template>
    <div>
        <p>
            <b>Applicant comment:</b>
        </p>

        <p class="small ml-4 text-secondary" v-html="$md.render(comment)" />
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
