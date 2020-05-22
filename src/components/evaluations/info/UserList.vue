<template>
    <div>
        <p class="text-shadow min-spacing">
            {{ header }}
        </p>
        <ul>
            <li v-for="user in userList" :key="user.id" class="small text-shadow">
                {{ user.username }}
                <a
                    v-if="nominatorAssessmentMongoId"
                    href="#"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="replace user"
                    @click.prevent="replaceUser(user.id, $event);"
                >
                    <i class="fas fa-redo-alt vote-pass" />
                </a>
            </li>
        </ul>
    </div>
</template>

<script>
import postData from '../../../mixins/postData.js';

export default {
    name: 'UserList',
    mixins: [postData],
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
        isNat: Boolean,
        isApplication: Boolean,
        nominatorAssessmentMongoId: {
            type: String || null,
            default: null,
        },
    },
    methods: {
        async replaceUser (evaluatorId, e) {
            const result = confirm(`Are you sure?`);

            if (result) {
                const r = await this.executePost(`/${this.isApplication ? 'appEval' : 'bnEval'}/replaceUser/${this.nominatorAssessmentMongoId}`, { evaluatorId, isNat: this.isNat }, e);

                if (r && !r.error) {
                    this.$store.dispatch(this.isApplication ? 'updateApplication' : 'updateEvalRound', r);
                    this.$store.dispatch('updateToastMessages', {
                        message: `replaced user`,
                        type: 'info',
                    });
                }
            }
        },
    },
};
</script>