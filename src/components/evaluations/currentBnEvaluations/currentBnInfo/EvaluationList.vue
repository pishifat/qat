<template>
    <div>
        <p class="text-shadow min-spacing">
            <a :href="events && `#${eventsId}`" data-toggle="collapse">{{ header }} <i class="fas fa-angle-down" /></a>
            ({{ isLoading ? '...' : events ? events.length : '0' }})
        </p>
        <div v-if="events" :id="eventsId" class="collapse">
            <table v-if="events.length" class="table table-sm table-dark table-hover col-md-12 mt-2">
                <thead>
                    <td scope="col" class="w-10">
                        Date
                    </td>
                    <td scope="col" class="w-30">
                        Evaluation
                    </td>
                    <td scope="col" class="w-30">
                        Vote
                    </td>
                    <td scope="col" class="w-30">
                        Consensus
                    </td>
                </thead>
                <tbody class="small">
                    <tr v-for="event in events" :key="event.id">
                        <td scope="row">
                            {{ findDate(event) }}
                        </td>
                        <td scope="row">
                            <a :href="'/' + (isApplication ? 'appeval' : 'bneval') + '?eval=' + event.id" target="_blank">
                                {{ findUsername(event) }}
                            </a>
                        </td>
                        <td scope="row">
                            <span :class="'vote-' + findVote(event.evaluations)">
                                {{ findVote(event.evaluations).toUpperCase() }}
                            </span>
                        </td>
                        <td scope="row">
                            <span :class="'vote-' + event.consensus">
                                {{ event.consensus ? event.consensus.toUpperCase() : 'NONE' }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
            <p v-else class="small text-shadow ml-4">
                None...
            </p>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import filterLinks from '../../../../mixins/filterLinks.js';

export default {
    name: 'EvaluationList',
    mixins: [ filterLinks ],
    props: {
        events: {
            type: Array,
            default() {
                return [];
            },
        },
        header: {
            type: String,
            required: true,
        },
        eventsId: {
            type: String,
            required: true,
        },
        isApplication: Boolean,
    },
    computed: {
        ...mapState({
            isLoading: (state) => state.userActivity.isLoading,
        }),
        ...mapGetters([
            'selectedUser',
        ]),
    },
    methods: {
        findDate (event) {
            let date;
            if (this.isApplication) date = event.createdAt;
            else date = event.deadline;

            return new Date(date).toString().slice(4,10);
        },
        findUsername (event) {
            let username;
            if (this.isApplication) username = event.applicant.username;
            else username = event.bn.username;

            return username;
        },
        findOsuId (event) {
            let osuId;
            if (this.isApplication) osuId = event.applicant.osuId;
            else osuId = event.bn.osuId;

            return osuId;
        },
        findVote (evaluations) {
            let vote;

            for (let i = 0; i < evaluations.length; i++) {
                const evaluation = evaluations[i];

                if (evaluation.evaluator.id == this.selectedUser.id) {
                    vote = evaluation.vote;
                    break;
                }
            }

            if (!vote) vote = 'none';
            else if (vote == 1) vote = 'pass';
            else if (vote == 2 && this.isApplication) vote = 'neutral';
            else if (vote == 2) vote = 'probation';
            else if (vote == 3) vote = 'fail';

            return vote;
        },
        findModdingComment (evaluations) {
            let comment;

            for (let i = 0; i < evaluations.length; i++) {
                const evaluation = evaluations[i];

                if (evaluation.evaluator.id == this.selectedUser.id) {
                    comment = evaluation.moddingComment;
                    break;
                }
            }

            if (!comment) return 'NONE';

            return comment;
        },
    },
};
</script>