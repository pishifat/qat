<template>
    <div>
        <p>
            <b>Applicant comment:</b>
        </p>

        <p class="small ml-4 text-secondary" v-html="filterLinks(comment)" />
    </div>
</template>

<script>
import filterLinks from '../../../../mixins/filterLinks.js';

export default {
    name: 'ApplicantComment',
    mixins: [ filterLinks ],
    props: {
        comment: {
            type: String,
            default: '',
        },
    },
};
</script>
