<template>
    <div>
        <p class="ml-4">
            <a :href="events && `#${eventsId}`" data-toggle="collapse">{{ header }} <i class="fas fa-angle-down" /></a>
            ({{ isLoading ? '...' : events ? events.length : '0' }})
        </p>

        <div v-if="events" :id="eventsId" class="collapse">
            <data-table
                v-if="events.length"
                :headers="['Date', 'Evaluation', 'Vote', 'Consensus']"
            >
                <tr v-for="event in events" :key="event.id">
                    <td class="text-nowrap">
                        {{ findDate(event) }}
                    </td>
                    <td>
                        <a :href="'/' + (isApplication ? 'appeval' : 'bneval') + '?id=' + event.id" target="_blank">
                            {{ findUsername(event) }}
                        </a>
                    </td>
                    <td>
                        <span :class="'text-' + findVote(event.reviews)">
                            {{ findVote(event.reviews).toUpperCase() }}
                        </span>
                    </td>
                    <td>
                        <span :class="'text-' + event.consensus">
                            {{ event.consensus ? event.consensus.toUpperCase() : 'NONE' }}
                        </span>
                    </td>
                </tr>
            </data-table>
            <p v-else class="small ml-4">
                None...
            </p>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import DataTable from '../../../../DataTable.vue';

export default {
    name: 'EvaluationList',
    components: {
        DataTable,
    },
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
        mongoId: {
            type: String,
            required: true,
        },
        isApplication: Boolean,
    },
    computed: mapState('activity', [
        'isLoading',
    ]),
    methods: {
        findDate (event) {
            let date;
            if (this.isApplication) date = event.createdAt;
            else date = event.deadline;

            return new Date(date).toString().slice(4,10);
        },
        findUsername (event) {
            return event.user.username;
        },
        findVote (reviews) {
            let vote;

            for (let i = 0; i < reviews.length; i++) {
                const review = reviews[i];

                if (review.evaluator.id == this.mongoId) {
                    vote = review.vote;
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
    },
};
</script>