<template>
    <div>
        <p>
            <b>{{ header }}</b>
        </p>
        <ul>
            <li v-for="user in userList" :key="user.id" class="small" :class="{ 'text-muted': user.isMockEvaluator }">
                {{ user.username }}
                <a
                    v-if="nominatorAssessmentMongoId && loggedInUser && loggedInUser.isNat && !isEditing && !disableReplace"
                    href="#"
                    @click="isEditing = true; editedEvaluatorId = user.id"
                >
                    <i class="fas fa-edit" />
                </a>

                <span v-if="nominatorAssessmentMongoId && loggedInUser && loggedInUser.isNat && isEditing && user.id == editedEvaluatorId && !disableReplace">
                    <a
                        v-if="nominatorAssessmentMongoId && loggedInUser && loggedInUser.isNat && isEditing && user.id == editedEvaluatorId"
                        href="#"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="close"
                        @click="isEditing = false; editedEvaluatorId = ''"
                    >
                        <i class="fas fa-times-circle text-danger" />
                    </a>
                    <a
                        v-if="nominatorAssessmentMongoId && loggedInUser && loggedInUser.isNat"
                        href="#"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="replace with random user"
                        class="mr-1"
                        @click.prevent="replaceUser(user.id, $event);"
                    >
                        <i class="fas fa-dice text-success" />
                    </a>
                </span>

                <span v-if="nominatorAssessmentMongoId && loggedInUser && loggedInUser.isNat && isEditing && user.id == editedEvaluatorId && !disableReplace" class="form-inline">
                    <select
                        id="user"
                        v-model="selectedUserId"
                        class="form-control ml-2"
                    >
                        <option
                            v-for="user in replaceNat ? nat : trialNat"
                            :key="user.id"
                            :value="user.id"
                        >
                            {{ user.username }}
                        </option>
                        <option v-if="!nat.length && !trialNat.length" disabled>
                            ...
                        </option>
                    </select>
                    <a
                        v-if="nominatorAssessmentMongoId && loggedInUser && loggedInUser.isNat"
                        href="#"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="replace with selected user"
                        class="ml-1"
                        @click.prevent="replaceUserSpecific(user.id, $event);"
                    >
                        <i class="fas fa-undo-alt text-success" />
                    </a>
                </span>
            </li>
        </ul>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

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
        replaceTrialNat: Boolean,
        mode: {
            type: String,
            default: '',
        },
        disableReplace: {
            type: Boolean,
            default: false,
        },
    },
    data () {
        return {
            isEditing: false,
            editedEvaluatorId: '',
            selectedUserId: '',
            nat: [],
            trialNat: [],
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
    },
    watch: {
        async isEditing () {
            if (this.replaceNat) {
                await this.loadNat();
            }

            if (this.replaceTrialNat) {
                await this.loadTrialNat();
            }
        },
        userList () {
            this.isEditing = false;
            this.editedEvaluatorId = '';
            this.selectedUserId = '';
        },
    },
    methods: {
        async replaceUser (evaluatorId, e) {
            const result = confirm(`Are you sure? This will replace with a random user in the 'bag'`);

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
        async replaceUserSpecific (evaluatorId, e) {
            const result = confirm(`Are you sure? This will replace with the selected user`);

            if (result) {
                const r = await this.$http.executePost(`/${this.isApplication ? 'appEval' : 'bnEval'}/replaceUser/${this.nominatorAssessmentMongoId}`, {
                    evaluatorId,
                    replaceNat: this.replaceNat,
                    selectedUserId: this.selectedUserId,
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
        async loadNat() {
            const nat = await this.$http.executeGet(
                `/users/loadNatInMode/${this.selectedEvaluation.mode}`
            );

            if (this.$http.isValid(nat)) {
                this.nat = nat;
            }
        },
        async loadTrialNat() {
            const trialNat = await this.$http.executeGet(
                `/users/loadTrialNatInMode/${this.selectedEvaluation.mode}`
            );

            if (this.$http.isValid(trialNat)) {
                this.trialNat = trialNat;
            }
        },
    },
};
</script>