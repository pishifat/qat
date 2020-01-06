<template>
    <div>
        <p class="text-shadow">
            Applicant comment: <span class="small" v-html="filterLinks(comment)"></span>
        </p>
    </div>
</template>

<script>
import filterLinks from '../../../../mixins/filterLinks.js';

export default {
    name: 'applicant-comment',
    props: {
        comment: String,
    },
    mixins: [ filterLinks ],
};
</script>