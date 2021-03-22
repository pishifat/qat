<template>
    <div>
        <p>
            <b>{{ header }}</b>
        </p>
        <ul>
            <li v-for="user in userList" :key="user.id" class="small">
                <a
                    v-if="nominatorAssessmentMongoId"
                    href="#"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="replace user"
                    class="mr-1"
                    @click.prevent="replaceUser(user.id, $event);"
                >
                    <i class="fas fa-redo-alt text-success" />
                </a>

                {{ user.username }}
            </li>
        </ul>
    </div>
</template>

<script>

export default {
    name: 'UserList',
    props: {
        header: {
            type: String,
            required: true,
        },
        userList: {
            type: Array,
            default() {
                return [];
            },
        },
        isApplication: Boolean,
        nominatorAssessmentMongoId: {
            type: String || null,
            default: null,
        },
        replaceNat: Boolean,
    },
    methods: {
        async replaceUser (evaluatorId, e) {
            const result = confirm(`Are you sure?`);

            if (result) {
                const r = await this.$http.executePost(`/${this.isApplication ? 'appEval' : 'bnEval'}/replaceUser/${this.nominatorAssessmentMongoId}`, {
                    evaluatorId,
                    replaceNat: this.replaceNat,
                }, e);

                if (r && !r.error) {
                    this.$store.commit('evaluations/updateEvaluation', r);
                    this.$store.dispatch('updateToastMessages', {
                        message: `Replaced user`,
                        type: 'success',
                    });
                }
            }
        },
    },
};
</script>