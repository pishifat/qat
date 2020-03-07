<template>
    <div>
        <p class="text-shadow">
            Applicant comment: <span class="small" v-html="filterLinks(comment)" />
        </p>
    </div>
</template>

<script>
import filterLinks from '../../../../mixins/filterLinks.js';

export default {
    name: 'ApplicantComment',
    mixins: [ filterLinks ],
    props: {
        comment: String,
    },
};
</script>