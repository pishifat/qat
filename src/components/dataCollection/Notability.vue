<template>

<span>
    <a href="#" @click.prevent="updateNotability(selectedEntry._id, 1);"
        data-toggle="tooltip" data-placement="top" title="notable"
    ><i class="fas fa-square vote-pass"></i></a>
    <a href="#" @click.prevent="updateNotability(selectedEntry._id, 2);"
        data-toggle="tooltip" data-placement="top" title="semi-notable"
    ><i class="fas fa-square vote-extend"></i></a>
    <a href="#" @click.prevent="updateNotability(selectedEntry._id, 3);"
        data-toggle="tooltip" data-placement="top" title="not notable"
    ><i class="fas fa-square vote-fail"></i></a>
    <a href="#" @click.prevent="updateNotability(selectedEntry._id, null);"
        data-toggle="tooltip" data-placement="top" title="unmarked"
    ><i class="fas fa-square"></i></a>
</span>

</template>

<script>
import postData from '../../mixins/postData.js';

export default {
    name: 'notability',
    mixins: [postData],
    props: [ 'selected-entry', 'is-spectator' ],
    methods: {
        updateNotability: async function(entryId, notability) {
            if(!this.isSpectator){
                const result = await this.executePost('/dataCollection/updateNotability/' + entryId, { notability: notability });
                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.$parent.updateEntry(result);
                    }
                }
            }
        }
    },

}
</script>