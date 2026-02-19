<template>
    <div>
        <div class="ms-2">
            <h5>{{ monthTitle }}</h5>
        </div>
        <data-table
            v-if="events.length"
            :headers="['', 'Ranked', 'Host', 'Mapset']"
        >
            <tr
                v-for="event in events"
                :key="event.id"
                class="small"
                :class="getRowClass(event)"
            >
                <td>
                    <i
                        :class="getCheckmarkClass(event)"
                        @click="toggleFavorite(event)"
                    />
                </td>
                <td class="text-nowrap">
                    {{ toMonthDayYear(event.timestamp) }}
                </td>
                <td>
                    <user-link
                        :username="event.creatorName"
                        :osu-id="event.creatorId"
                    />
                </td>
                <td>
                    <a
                        :href="'https://osu.ppy.sh/beatmapsets/' + event.beatmapsetId"
                        target="_blank"
                    >
                        <mode-display :modes="event.modes" />
                        {{ event.artistTitle }}
                    </a>
                </td>
            </tr>
        </data-table>
        <p v-else class="small ms-4">
            None...
        </p>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import DataTable from '../DataTable.vue';
import ModeDisplay from '../ModeDisplay.vue';
import UserLink from '../UserLink.vue';

export default {
    name: 'RankedMapsTable',
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
        selectedEventInThisMonth() {
            return this.events.find(event =>
                event.charted && event.charted.includes(this.loggedInUser?.id)
            );
        },
    },
    methods: {
        isEventSelected(event) {
            return event.charted && event.charted.includes(this.loggedInUser?.id);
        },
        isEventDisabled(event) {
            const selected = this.selectedEventInThisMonth;

            return (selected && selected._id !== event._id) || this.isLoading;
        },
        getRowClass(event) {
            const classes = [];

            if (this.isEventSelected(event)) {
                classes.push('chart-selected');
            }

            if (this.isEventDisabled(event)) {
                classes.push('chart-disabled');
            }

            return classes.join(' ');
        },
        getCheckmarkClass(event) {
            const classes = ['fa-check-circle', 'fake-checkbox', 'ms-2'];

            if (this.isEventSelected(event)) {
                classes.push('fas', 'text-success');
            } else {
                classes.push('far');
            }

            if (this.isEventDisabled(event)) {
                classes.push('chart-disabled-icon');
            }

            if (this.isLoading) {
                classes.push('chart-loading');
            }

            return classes.join(' ');
        },
        async toggleFavorite(event) {
            if (this.isEventDisabled(event) || this.isLoading) {
                return;
            }

            this.isLoading = true;

            try {
                const response = await this.$http.executePost(`/charts/${event._id}/toggleSelection`);

                if (response.error) {
                    console.error('Error toggling selection:', response.error);

                    return;
                }

                this.$emit('selection-changed', {
                    eventId: event._id,
                    isSelected: response.isSelected,
                });
            } catch (error) {
                console.error('Failed to toggle selection:', error);
            } finally {
                this.isLoading = false;
            }
        },
    },
};
</script>

<style scoped>
.fake-checkbox:hover {
    cursor: pointer;
    color: lightblue;
    opacity: 0.7;
}

.chart-selected {
    background-color: rgba(40, 167, 69, 0.1);
}

.chart-disabled {
    opacity: 0.5;
}

.chart-disabled-icon {
    pointer-events: none;
    opacity: 0.3;
}

.chart-loading {
    pointer-events: none;
    opacity: 0.6;
}
</style>