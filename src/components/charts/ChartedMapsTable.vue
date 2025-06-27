<template>
    <div class="charted-maps-table">
        <div class="ml-2">
            <h5>{{ monthTitle }}</h5>
        </div>
        <data-table
            v-if="events.length"
            :headers="['', 'Ranked', 'Mapset', 'Charter']"
        >
            <tr v-for="event in sortedEvents" :key="event._id" :class="getRowClass(event)">
                <td>
                    <div class="d-flex align-items-center">
                        <span
                            data-toggle="tooltip" 
                            :title="canVote ? '' : 'Only BNs can vote'"
                            class="vote-button-wrapper"
                        >
                            <i
                                :class="getUpvoteClass(event)"
                                @click="vote(event, 'up')"
                            />
                        </span>
                        <span class="ml-1 mr-2 small text-success">{{ getUpvoteCount(event) }}</span>
                        
                        <span
                            data-toggle="tooltip" 
                            :title="canVote ? '' : 'Only BNs can vote'"
                            class="vote-button-wrapper"
                        >
                            <i
                                :class="getDownvoteClass(event)"
                                @click="vote(event, 'down')"
                            />
                        </span>
                        <span class="ml-1 small text-danger">{{ getDownvoteCount(event) }}</span>
                    </div>
                </td>
                <td class="text-nowrap">
                    {{ event.timestamp | toMonthDayYear }}
                </td>
                <td>
                    <a
                        :href="'https://osu.ppy.sh/beatmapsets/' + event.beatmapsetId"
                        target="_blank"
                    >
                        <mode-display :modes="event.modes" />
                        {{ event.artistTitle }}
                        
                    </a>
                    by
                    <user-link
                            :username="event.creatorName"
                            :osu-id="event.creatorId"
                        />
                </td>
                <td>
                    <span v-if="event.charted && event.charted.length">
                        <span v-for="(charter, i) in event.charted" :key="charter._id">
                            <user-link
                                :username="charter.username"
                                :osu-id="charter.osuId"
                            />{{ i < event.charted.length - 1 ? ', ' : '' }}
                        </span>
                    </span>
                    <span v-else class="text-muted">None</span>
                </td>
            </tr>
        </data-table>
        <p v-else class="ml-4">No charted maps for this month...</p>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import DataTable from '../DataTable.vue';
import ModeDisplay from '../ModeDisplay.vue';
import UserLink from '../UserLink.vue';

export default {
    name: 'ChartedMapsTable',
    components: {
        DataTable,
        ModeDisplay,
        UserLink,
    },
    props: {
        events: {
            type: Array,
            required: true,
        },
        monthTitle: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            isLoading: false,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        sortedEvents() {
            return [...this.events].sort((a, b) => {
                const aScore = this.getNetVoteScore(a);
                const bScore = this.getNetVoteScore(b);
                return bScore - aScore; // Sort in descending order (highest score first)
            });
        },
        canVote() {
            return this.loggedInUser && (this.loggedInUser.isBn || this.loggedInUser.isNat);
        },
    },
    methods: {
        getUpvoteCount(event) {
            return event.chartUpvoted ? event.chartUpvoted.length : 0;
        },
        getDownvoteCount(event) {
            return event.chartDownvoted ? event.chartDownvoted.length : 0;
        },
        isUserUpvoted(event) {
            return event.chartUpvoted && event.chartUpvoted.includes(this.loggedInUser?.id);
        },
        isUserDownvoted(event) {
            return event.chartDownvoted && event.chartDownvoted.includes(this.loggedInUser?.id);
        },
        getRowClass(event) {
            if (this.isUserUpvoted(event)) {
                return 'chart-upvoted';
            } else if (this.isUserDownvoted(event)) {
                return 'chart-downvoted';
            } else {
                return 'chart-neutral';
            }
        },
        getUpvoteClass(event) {
            const classes = ['fas', 'fa-circle-arrow-up', 'text-success'];
            
            if (this.canVote) {
                classes.push('fake-checkbox');
            } else {
                classes.push('chart-disabled');
            }
            
            if (this.isLoading) {
                classes.push('chart-loading');
            }
            
            return classes.join(' ');
        },
        getDownvoteClass(event) {
            const classes = ['fas', 'fa-circle-arrow-down', 'text-danger'];
            
            if (this.canVote) {
                classes.push('fake-checkbox');
            } else {
                classes.push('chart-disabled');
            }
            
            if (this.isLoading) {
                classes.push('chart-loading');
            }
            
            return classes.join(' ');
        },
        getNetVoteScore(event) {
            const upvotes = this.getUpvoteCount(event);
            const downvotes = this.getDownvoteCount(event);
            return upvotes - downvotes;
        },
        async vote(event, voteType) {
            if (this.isLoading || !this.canVote) {
                return;
            }
            
            this.isLoading = true;
            
            try {
                const response = await this.$http.executePost(`/charts/${event._id}/vote`, { voteType });
                
                if (response.error) {
                    console.error('Error voting on chart:', response.error);
                    return;
                }
                
                // Update local data
                if (!event.chartUpvoted) event.chartUpvoted = [];
                if (!event.chartDownvoted) event.chartDownvoted = [];
                
                // Update vote arrays based on response
                const userIndex = event.chartUpvoted.indexOf(this.loggedInUser.id);
                const downUserIndex = event.chartDownvoted.indexOf(this.loggedInUser.id);
                
                if (response.userUpvoted) {
                    if (userIndex === -1) event.chartUpvoted.push(this.loggedInUser.id);
                    if (downUserIndex !== -1) event.chartDownvoted.splice(downUserIndex, 1);
                } else {
                    if (userIndex !== -1) event.chartUpvoted.splice(userIndex, 1);
                }
                
                if (response.userDownvoted) {
                    if (downUserIndex === -1) event.chartDownvoted.push(this.loggedInUser.id);
                    if (userIndex !== -1) event.chartUpvoted.splice(userIndex, 1);
                } else {
                    if (downUserIndex !== -1) event.chartDownvoted.splice(downUserIndex, 1);
                }
                
            } catch (error) {
                console.error('Failed to vote on chart:', error);
            } finally {
                this.isLoading = false;
            }
        },
    },
};
</script>

<style scoped>
.chart-upvoted {
    background-color: rgba(40, 167, 69, 0.1);
}

.chart-downvoted {
    background-color: rgba(220, 53, 69, 0.1);
}

.chart-neutral {
    background-color: transparent;
}

.fake-checkbox:hover {
    cursor: pointer;
    opacity: 0.7;
}

.chart-loading {
    pointer-events: none;
    opacity: 0.6;
}

.chart-disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
}

.vote-button-wrapper {
    display: inline-block;
}
</style>

<style>
.charted-maps-table th {
    text-align: left !important;
    margin-left: 0.5rem !important;
    padding-left: 0.5rem !important;
}
</style>