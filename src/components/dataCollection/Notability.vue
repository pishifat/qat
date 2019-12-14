<template>
    <span>
        <a
            href="#"
            data-toggle="tooltip"
            data-placement="top"
            title="notable"
            @click.prevent="updateNotability(selectedEntry._id, 1);"
        ><i class="fas fa-square vote-pass" /></a>
        <a
            href="#"
            data-toggle="tooltip"
            data-placement="top"
            title="semi-notable"
            @click.prevent="updateNotability(selectedEntry._id, 2);"
        ><i class="fas fa-square vote-extend" /></a>
        <a
            href="#"
            data-toggle="tooltip"
            data-placement="top"
            title="not notable"
            @click.prevent="updateNotability(selectedEntry._id, 3);"
        ><i class="fas fa-square vote-fail" /></a>
        <a
            href="#"
            data-toggle="tooltip"
            data-placement="top"
            title="unmarked"
            @click.prevent="updateNotability(selectedEntry._id, null);"
        ><i class="fas fa-square" /></a>
    </span>
</template>

<script>
import postData from '../../mixins/postData.js';

export default {
    name: 'Notability',
    mixins: [postData],
    props: [ 'selectedEntry' ],
    methods: {
        async updateNotability(entryId, notability) {
            const result = await this.executePost('/dataCollection/updateNotability/' + entryId, { notability });

            if (result.error) {
                this.info = result.error;
            } else {
                this.$parent.updateEntry(result);
            }
        },
    },

};
</script>
