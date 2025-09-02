<template>
    <div>
        <div class="ml-2">
            <a :href="events && `#${eventsId}`" data-toggle="collapse"
                >{{ header }} <i class="fas fa-angle-down"
            /></a>
            ({{ isLoading ? '...' : events.length ? isMock ? events.length : getCompletedEvaluations(events).length + '/' + events.length : '0' }})
        </div>

        <div v-if="loggedInUser.isNat">
            <div v-if="events" :id="eventsId" class="collapse">
                <ul v-if="!isMock && events.length" class="small">
                    <li><b>Assigned Evaluations:</b> {{ totalEvaluations }}</li>
                    <ul>
                        <li><b>Completed:</b> {{ totalCompletedEvaluations }} <span class="text-danger">({{ totalOverdueEvaluations }} overdue)</span></li>
                        <li><b>Unfinished:</b> {{ totalUnfinishedEvaluations }}</li>
                    </ul>
                    <li><b>Rerolls:</b> {{ totalRerolls }}</li>
                    <ul>
                        <li><b>Removed from:</b> {{ totalRemovedFromRerolls }}</li>
                        <li><b>Added to (manual):</b> {{ totalAddedToManualRerolls }}</li>
                        <li><b>Added to (automatic):</b> {{ totalAddedToAutomaticRerolls }}</li>
                    </ul>
                </ul>
                <data-table
                    v-if="events.length"
                    :headers="isMock ? ['Deadline', 'Eval submitted', 'Evaluation', 'Vote', 'Consensus'] : ['', 'Deadline', 'Eval submitted', 'Evaluation', 'Vote', 'Consensus']"
                >
                    <tr v-for="event in events" :key="event.id">
                        <td v-if="!isMock">
                            <i
                                v-if="wasRerolled(event.rerolls)"
                                class="fas fa-undo-alt text-warning"
                                data-toggle="tooltip"
                                title="replaced someone else"
                            />
                            <i
                                v-else
                                class="fas fa-clipboard-check text-success"
                                data-toggle="tooltip" 
                                title="assigned"
                            />
                        </td>
                        <td class="text-nowrap">
                            {{ new Date(event.deadline).toString().slice(4, 10) }}
                        </td>
                        <td class="text-nowrap" :class="evaluatedAfterDeadline(event.deadline, isMock ? event.mockReviews :event.reviews) ? 'text-danger' : ''">
                            {{ findReviewDate(isMock ? event.mockReviews : event.reviews) }}
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
                            <span :class="'text-' + findVote(isMock ? event.mockReviews : event.reviews)">
                                {{ capitalizeFirstLetter(findVote(isMock ? event.mockReviews : event.reviews)) }}
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
        isMock: Boolean,
    },
    computed: {
        ...mapState('activity', ['isLoading']), 
        ...mapState(['loggedInUser']),

        totalEvaluations() {
            return this.events.length;
        },
        totalCompletedEvaluations() {
            return this.getCompletedEvaluations(this.events).length;
        },
        totalOverdueEvaluations() {
            return this.getCompletedEvaluations(this.events).filter(e => this.evaluatedAfterDeadline(e.deadline, e.reviews)).length;
        },
        totalUnfinishedEvaluations() {
            return this.events.length - this.getCompletedEvaluations(this.events).length;
        },
        totalRerolls() {
            return this.totalRemovedFromRerolls + this.totalAddedToAutomaticRerolls + this.totalAddedToManualRerolls;
        },
        totalRemovedFromRerolls() {
            let count = 0;

            for (const event of this.events) {
                if (event.rerolls) {
                    for (const reroll of event.rerolls) {
                        if (reroll.oldEvaluator && reroll.oldEvaluator.id == this.mongoId) {
                            count++;
                        }
                    }
                }
            }
            
            return count;
        },
        totalAddedToManualRerolls() {
            let count = 0;

            for (const event of this.events) {
                if (event.rerolls) {
                    for (const reroll of event.rerolls) {
                        if (reroll.newEvaluator.id == this.mongoId && reroll.type == 'manual') {
                            count++;
                        }
                    }
                }
            }
            
            return count;
        },
        totalAddedToAutomaticRerolls() {
            let count = 0;

            for (const event of this.events) {
                if (event.rerolls) {
                    for (const reroll of event.rerolls) {
                        if (reroll.newEvaluator.id == this.mongoId && reroll.type == 'automatic') {
                            count++;
                        }
                    }
                }
            }
            
            return count;
        },
    },
    methods: {
        getCompletedEvaluations(events) {
            return events.filter(e => this.findVote(e.reviews).toUpperCase() !== 'NONE');
        },
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
        wasRerolled (rerolls) {
            if (rerolls.length) {
                for (const reroll of rerolls) {
                    if (reroll.newEvaluator.id == this.mongoId) {
                        return true;
                    }
                }
            }

            return false;
        },
    },
};
</script>
