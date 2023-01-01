<template>
    <p class="form-inline">
        <b class="mr-1">
            {{ displayMode ? `Next ${mode == 'osu' ? 'osu!' : 'osu!' + mode} evaluation:` : 'Next evaluation:' }}
            <span v-if="isEditing">(deadline)</span>
        </b>

        <input
            v-if="isEditing && loggedInUser.isNat"
            v-model="newDeadlineInput"
            class="form-control form-control-sm w-50 mb-2"
            type="text"
            placeholder="new date (yyyy-mm-dd)"
            @keyup.enter="adjustEvaluationDeadline($event)"
        >

        <span v-else>{{ nextEvaluationText }}</span>

        <a
            v-if="isEditable && loggedInUser.isNat"
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
            v-if="loggedInUser.isNat" 
            data-toggle="tooltip"
            data-placement="top"
            title="reset next evaluation date to default based on previous evaluations"
            class="btn btn-sm btn-primary ml-2" type="submit" @click="reset($event)">
            Reset
        </button>
    </p>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
    name: 'NextEvaluation',
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
            nextEvaluationText: '...',
            newDeadlineInput: '',
            isEditable: false,
            isEditing: false,
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
            } else {
                this.nextEvaluationText = deadline;
            }
        },
        async loadNextEvaluation() {
            const deadline = await this.$http.executeGet(`/users/loadNextEvaluation/${this.selectedUser.id}/${this.mode}`);

            if (deadline) {
                this.processDeadline(deadline);
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
    },
};
</script>