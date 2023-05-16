<template>
    <div>
        <div class="ml-2">
            <a :href="events && `#${eventsId}`" data-toggle="collapse"
                >{{ header }} <i class="fas fa-angle-down"
            /></a>
            ({{ isLoading ? '...' : events ? events.filter(e => findVote(e.reviews).toUpperCase() !== 'NONE').length : '0' }})
        </div>

        <div v-if="loggedInUser.isNat">
            <div v-if="events" :id="eventsId" class="collapse">
                <data-table
                    v-if="events.length"
                    :headers="['Deadline', 'Eval submitted', 'Evaluation', 'Vote', 'Consensus']"
                >
                    <tr v-for="event in events" :key="event.id">
                        <td class="text-nowrap">
                            {{ new Date(event.deadline).toString().slice(4, 10) }}
                        </td>
                        <td class="text-nowrap" :class="evaluatedAfterDeadline(event.deadline, event.reviews) ? 'text-danger' : ''">
                            {{ findReviewDate(event.reviews) }}
                        </td>
                        <td>
                            <a
                                :href="
                                    '/' +
                                    (isApplication ? 'appeval' : 'bneval') +
                                    '?id=' +
                                    event.id
                                "
                                target="_blank"
                            >
                                {{ event.user.username }}
                            </a>
                        </td>
                        <td>
                            <span :class="'text-' + findVote(event.reviews)">
                                {{ capitalizeFirstLetter(findVote(event.reviews)) }}
                            </span>
                        </td>
                        <td>
                            <span :class="findConsensusColor(event.consensus)">
                                {{ capitalizeFirstLetter(makeWordFromField(event.consensus)) }}
                            </span>
                        </td>
                    </tr>
                </data-table>
                <p v-else class="small ml-4">None...</p>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import DataTable from '../../../../DataTable.vue';
import evaluations from '../../../../../mixins/evaluations.js';

export default {
    name: 'EvaluationList',
    mixins: [ evaluations ],
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
    computed: {
        ...mapState('activity', ['isLoading']), 
        ...mapState(['loggedInUser']),
    },
    methods: {
        findVote(reviews) {
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
        findReviewDate(reviews) {
            let date;

            for (let i = 0; i < reviews.length; i++) {
                const review = reviews[i];

                if (review.evaluator.id == this.mongoId) {
                    date = new Date(review.createdAt);
                    break;
                }
            }

            if (!date) {
                return 'N/A';
            }

            return new Date(date).toString().slice(4, 10);
        },
        evaluatedAfterDeadline(deadline, reviews) {
            const dateDeadline = new Date(deadline);
            dateDeadline.setDate(dateDeadline.getDate() + 1);
            let reviewDate;

            for (let i = 0; i < reviews.length; i++) {
                const review = reviews[i];

                if (review.evaluator.id == this.mongoId) {
                    reviewDate = new Date(review.createdAt);
                    break;
                }
            }

            if (!reviewDate) {
                return true;
            }

            return dateDeadline < reviewDate;
        },
        findConsensusColor (consensus) {
            switch (consensus) {
                case 'pass':
                case 'fullBn':
                case 'resignedOnGoodTerms':
                    return 'text-pass';

                case 'fail':
                case 'removeFromBn':
                    return 'text-fail';

                case 'probationBn':
                    return 'text-probation';

                case 'resignedOnStandardTerms':
                    return 'text-neutral';

                default:
                    return '';
            }
        },
    },
};
</script>