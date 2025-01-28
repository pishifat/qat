<template>
    <modal-dialog id="addEvaluations" title="Add BNs to evaluate">
        <div class="container">
            <div class="row mb-3">
                <div class="col-sm-12">
                    <b class="mr-4">Game mode:</b>

                    <mode-select
                        v-model="selectedModes"
                        :max-selection="4"
                        class="ml-2"
                    />

                    <p class="small text-secondary ml-2 mt-1">
                        Specify mode(s) for evaluations. Multi-mode BNs can generate multiple evaluations.
                    </p>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-sm-6">
                    <b>User(s):</b>
                    <input v-model="includeUsers" class="ml-2 form-control" type="text"
                        placeholder="username1, username2, username3...">
                </div>
            </div>

            <div class="row mb-3">
                <div class="col-sm-12">
                    <b>Resignation:</b>

                    <div class="form-check ml-2">
                        <input id="isResignation" v-model="isResignation" class="form-check-input" type="checkbox">
                        <label class="form-check-label text-secondary small" for="isResignation">
                            Checking this will replace vote/consensus options with "resigned on good/standard terms" and set
                            deadline to today.
                        </label>
                    </div>
                </div>
                <div v-if="!isResignation" class="col-sm-12 mt-3">
                    <div class="form-inline">
                        <b>Deadline:</b>
                        <input v-model="deadline" class="ml-1 form-control" type="date">
                    </div>

                    <small class="text-secondary ml-2 mt-1">
                        Only deadlines within the next week will be displayed.
                    </small>
                </div>
            </div>
            <div v-if="loggedInUser.isNatLeader" class="row">
                <div class="col-sm-12">
                    <p>
                        <a href="#advancedSettings" data-toggle="collapse">
                            Advanced settings <i class="fas fa-angle-down" />
                        </a>
                    </p>
                    <div id="advancedSettings" class="collapse container col-sm-12">
                        <b class="mr-4">User group:</b>
                        <label class="mx-2" data-toggle="tooltip" data-placement="top" title="probation BN">
                            <input v-model="groups" type="checkbox" class="probation-bn-radio hide-default" value="probationBn">
                            <i class="fab fa-accessible-icon" />
                        </label>
                        <label class="mx-2" data-toggle="tooltip" data-placement="top" title="full BN">
                            <input v-model="groups" type="checkbox" class="full-bn-radio hide-default" value="fullBn">
                            <i class="fas fa-walking" />
                        </label>
                        <label class="mx-2" data-toggle="tooltip" data-placement="top" title="NAT">
                            <input v-model="groups" type="checkbox" class="nat-radio hide-default" value="nat">
                            <i class="fas fa-running" />
                        </label>

                        <p class="small text-secondary ml-2">
                            Generate evaluations for all members of a user group. Only use this if you know what you're doing.
                        </p>
                        <div class="row">
                            <div class="col-sm-6">
                                <b>Exclude specific user(s):</b>
                                <input v-model="excludeUsers" class="ml-2 form-control" type="text"
                                    placeholder="username1, username2, username3...">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <hr>

            <button class="btn btn-primary mb-2 mt-4 btn-block" @click="addEvaluations($event)">
                Generate evaluations
            </button>
        </div>
    </modal-dialog>
</template>

<script>
import { mapState } from 'vuex';
import ModalDialog from '../ModalDialog.vue';
import ModeSelect from '../ModeSelect.vue';

export default {
    name: 'AddEvaluations',
    components: {
        ModalDialog,
        ModeSelect,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
    data() {
        return {
            includeUsers: null,
            excludeUsers: null,
            deadline: this.$moment().add(7, 'days').format('YYYY-MM-DD'),
            selectedModes: [],
            isResignation: false,
            groups: [],
        };
    },
    methods: {
        async addEvaluations(e) {
            const confirmInput = confirm(`Are you sure?`);

            if (confirmInput) {
                let confirmGroupsInput = true;
                if (this.groups.length) {
                    confirmGroupsInput = confirm(`Are you *really* sure? You should only select Probation/Full/NAT if you know what you're doing.`);
                }

                if (confirmGroupsInput) {
                    if (!this.selectedModes.length) {
                        this.$store.dispatch('updateToastMessages', {
                            message: `Must select game mode!`,
                            type: 'danger',
                        });

                        return;
                    }

                    if (!this.groups.length && !this.includeUsers) {
                        this.$store.dispatch('updateToastMessages', {
                            message: `Must select user group or include specific users!`,
                            type: 'danger',
                        });

                        return;
                    }

                    const data = await this.$http.executePost(
                        '/bnEval/addEvaluations/',
                        {
                            modes: this.selectedModes,
                            groups: this.groups,
                            includeUsers: this.includeUsers,
                            excludeUsers: this.excludeUsers,
                            deadline: this.deadline,
                            isResignation: this.isResignation,
                        },
                        e
                    );

                    if (this.$http.isValid(data)) {
                        this.$store.commit('evaluations/setEvaluations', data.evaluations);

                        if (data.evaluations.length) {

                            if (data.failed.length) {
                                const usernames = data.failed.join(', ');
                                let errorMessage = `The following usernames could not be processed: ${usernames}`;

                                this.$store.dispatch('updateToastMessages', {
                                    message: errorMessage,
                                    type: 'danger',
                                });
                            } else {
                                $('#addEvaluations').modal('hide');
                            }
                        } else {
                            this.$store.dispatch('updateToastMessages', {
                                message: `No eval rounds added. Maybe re-check spelling?`,
                                type: 'danger',
                            });
                        }
                    }
                }
            }
        },
    },
};
</script>
