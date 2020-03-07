<template>
    <div class="modal-footer">
        <div :class="info.length ? 'errors' : 'confirm'" class="text-shadow ml-2" style="min-height: 24px;">
            {{ info }} {{ confirm }}
        </div>
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
    name: 'ModalFooter',
    mixins: [ postData ],
    props: {
        mediationId: String,
        veto: {
            createdAt: Date,
            status: String,
        },
    },
    data() {
        return {
            confirm: '',
            info: '',
            vote: null,
        };
    },
    watch: {
        mediationId() {
            this.confirm = null;
        },
    },
    methods: {
        async submitMediation (e) {
            this.confirm = '';
            this.info = '';

            const comment = $('#comment').val();
            const vote = $('input[name=vote]:checked').val();

            if (!vote || !comment.length) {
                this.info = 'Cannot leave fields blank!';
            } else {
                const v = await this.executePost(
                    `vetoes/submitMediation/${this.veto.id}`,
                    {
                        mediationId: this.mediationId,
                        vote,
                        comment,
                    },
                    e
                );

                if (v) {
                    if (v.error) {
                        this.info = v.error;
                    } else {
                        this.$emit('update-veto', v);
                        this.confirm = 'Mediation submitted!';
                        this.vote = vote;
                    }
                }
            }
        },
    },
};
</script>
