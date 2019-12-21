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
    name: 'user-list',
    mixins: [postData],
    props: {
        header: String,
        userList: Array,
        isNat: Boolean,
        isApplication: Boolean,
        nominatorAssessmentMongoId: String,
    },
    methods: {
        async replaceUser (evaluatorId, e) {
            const result = confirm(`Are you sure?`);
            if(result){
                const r = await this.executePost(`/${this.isApplication ? 'appEval' : 'bnEval'}/replaceUser/${this.nominatorAssessmentMongoId}`, { evaluatorId, isNat: this.isNat }, e);
                if (r) {
                    if (r.error) {
                        this.info = r.error;
                    } else {
                        this.$emit('update-nominator-assessment', r);
                    }
                }
            }
        },
    },
};
</script>