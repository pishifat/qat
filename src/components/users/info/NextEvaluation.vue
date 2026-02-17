<template>
    <div>
        <p class="form-inline">
            <b class="mr-1">
                {{ displayMode ? `Next ${formatMode(mode)} evaluation:` : 'Next evaluation:' }}
                <span v-if="isEditing">(deadline)</span>
            </b>

            <input
                v-if="isEditing && loggedInUser && loggedInUser.isNat"
                v-model="newDeadlineInput"
                class="form-control form-control-sm w-50 mb-2"
                type="text"
                placeholder="new date (yyyy-mm-dd)"
                @keyup.enter="adjustEvaluationDeadline($event)"
            >

            <span
                v-else
                data-toggle="tooltip"
                data-placement="top"
                title="evaluation can happen at any time in this interval"
            >{{ nextEvaluationText }}</span>

            <a
                v-if="isEditable && loggedInUser && loggedInUser.isNat"
                href="#"
                data-toggle="tooltip"
                data-placement="top"
                title="edit next evaluation date"
                class="ml-1"
                @click.prevent="isEditing = !isEditing"
            >
                <i class="fas fa-edit" />
            </a>

            <button
                v-if="loggedInUser && loggedInUser.isNat"
                data-toggle="tooltip"
                data-placement="top"
                title="reset next evaluation date to default based on previous evaluations"
                class="btn btn-sm btn-primary ml-2"
                type="submit"
                @click="reset($event)"
            >
                Reset
            </button>

            <button
                v-if="loggedInUser && loggedInUser.isNat"
                data-toggle="tooltip"
                data-placement="top"
                title="create an evaluation with a deadline of 7 days from now"
                class="btn btn-sm btn-nat ml-2"
                type="submit"
                @click="createEvaluation($event)"
            >
                Create evaluation
            </button>
        </p>
        <progress-bar v-if="displayProgressBar" :evaluation="nextEvaluation" />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import ProgressBar from '../../evaluations/info/common/ProgressBar.vue';
import evaluations from '../../../mixins/evaluations';

export default {
    name: 'NextEvaluation',
    components: {
        ProgressBar,
    },
    mixins: [ evaluations ],
    props: {
        mode: {
            type: String,
            required: true,
        },
        mongoId: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            nextEvaluation: null,
            nextEvaluationText: '...',
            newDeadlineInput: '',
            isEditable: false,
            isEditing: false,
            displayProgressBar: false,
        };
    },
    computed: {
        ...mapState([
            'initialized',
            'loggedInUser',
        ]),
        ...mapGetters('users', [
            'selectedUser',
        ]),
        /** @returns {boolean} */
        displayMode() {
            return this.selectedUser.modes.length > 1;
        },
    },
    watch: {
        selectedUser() {
            this.nextEvaluationText = '...';
            this.newDeadlineInput = ''; // figure this out
            this.loadNextEvaluation();
        },
    },
    mounted() {
        this.loadNextEvaluation();
    },
    methods: {
        processDeadline (deadline) {
            const deadlineDate = new Date(deadline);

            if (!isNaN(deadlineDate)) {

                this.newDeadlineInput = deadlineDate.toISOString().slice(0,10);

                const firstDate = new Date(deadline);
                const secondDate = new Date(deadline);
                const today = new Date();
                firstDate.setDate(firstDate.getDate() - 7);
                secondDate.setDate(secondDate.getDate() + 7);

                if (deadlineDate > today) {
                    this.isEditable = true;
                } else {
                    this.isEditable = false;
                }

                const nextEvaluationText = `Between ${firstDate.toISOString().slice(0,10)} and ${secondDate.toISOString().slice(0,10)}`;
                this.nextEvaluationText = nextEvaluationText;

                this.displayProgressBar = today >= firstDate;

            } else {
                this.nextEvaluationText = deadline;
            }
        },
        async loadNextEvaluation() {
            const evaluation = await this.$http.executeGet(`/users/loadNextEvaluation/${this.selectedUser.id}/${this.mode}`);

            if (evaluation) {
                this.processDeadline(evaluation.deadline);
                this.nextEvaluation = evaluation;
            }
        },
        async adjustEvaluationDeadline() {
            const res = await this.$http.executePost(`/users/adjustEvaluationDeadline/${this.selectedUser.id}/${this.mode}`, { newDeadline: this.newDeadlineInput });

            if (res.deadline) {
                this.processDeadline(res.deadline);
                this.isEditing = false;
            }
        },
        async reset(e) {
            const res = await this.$http.executePost(`/users/resetEvaluationDeadline/${this.selectedUser.id}/${this.mode}`, {}, e);

            if (res.deadline) {
                this.processDeadline(res.deadline);
                this.isEditing = false;
            }
        },
        async createEvaluation(e) {
            const confirmInput = confirm(`Are you sure?`);

            if (confirmInput) {
                const res = await this.$http.executePost(
                    '/bnEval/addEvaluations/',
                    {
                        modes: [this.mode],
                        groups: [],
                        includeUsers: this.selectedUser.username,
                        excludeUsers: null,
                        isResignation: false,
                        deadline: this.$moment().add(7, 'days').format('YYYY-MM-DD'),
                    },
                    e
                );

                if (this.$http.isValid(res)) {
                    $('#extendedInfo').modal('hide');
                    const evaluation = res.evaluations.find(e => e.user.id == this.selectedUser.id);
                    if (evaluation)
                        this.$router.replace(`/bneval?id=${evaluation.id}`);
                    else
                        this.$store.dispatch('updateToastMessages', {
                            message: 'Error redirecting to evaluation, try navigating manually', type: 'danger',
                        });
                }
            }
        },
    },
};
</script>