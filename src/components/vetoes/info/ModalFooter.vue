<template>
    <div class="modal-footer">
        <button v-if="mediationId && veto.status === 'wip'" class="btn btn-sm btn-nat" @click="submitMediation($event)">
            Submit Mediation
        </button>
        <p v-else class="text-shadow min-spacing">
            {{ veto.createdAt.slice(0, 10) }}
        </p>
    </div>
</template>

<script>
import postData from '../../../mixins/postData';

export default {
    name: 'modal-footer',
    mixins: [ postData ],
    props: {
        mediationId: String,
        veto: {
            createdAt: Date,
            status: String
        }
    },
    methods: {
        async submitMediation (e) {
            this.info = '';
            this.confirm = '';
            const vote = $('input[name=vote]:checked').val();

            if (!vote || !this.comment.length) {
                this.info = 'Cannot leave fields blank!';
            } else {
                const v = await this.executePost(
                    `vetoes/submitMediation/${this.veto.id}`,
                    {
                        mediationId: this.mediationId,
                        vote,
                        comment: this.comment,
                    },
                    e
                );

                if (v.error) {
                    this.info = v.error;
                } else {
                    this.$parent.$emit('update-veto', v);
                    this.confirm = 'Mediation submitted!';
                    this.vote = vote;
                }
            }
        }
    }
};
</script>
