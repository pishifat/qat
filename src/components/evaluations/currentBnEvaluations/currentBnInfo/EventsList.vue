<template>
    <div>
        <p class="text-shadow min-spacing">
            <a :href="events && `#${eventsId}`" data-toggle="collapse">{{ header }} <i class="fas fa-angle-down" /></a>
            ({{ isLoading ? '...' : events ? events.length : '0' }})
        </p>
        <div v-if="events" :id="eventsId" class="collapse">
            <table v-if="events.length" class="table table-sm table-dark table-hover col-md-12 mt-2">
                <thead>
                    <td scope="col">
                        Date
                    </td>
                    <td scope="col">
                        Mapset
                    </td>
                </thead>
                <tbody class="small">
                    <tr v-for="event in events" :key="event.id">
                        <td scope="row">
                            {{ new Date(event.timestamp).toString().slice(4,10) }}
                        </td>
                        <td scope="row truncate">
                            <a :href="'https://osu.ppy.sh/beatmapsets/' + event.beatmapsetId + '/discussion/-/events'" target="_blank">
                                <i v-if="event.modes.includes('osu')" class="far fa-circle" />
                                <i v-if="event.modes.includes('taiko')" class="fas fa-drum" />
                                <i v-if="event.modes.includes('catch')" class="fas fa-apple-alt" />
                                <i v-if="event.modes.includes('mania')" class="fas fa-stream" />
                                {{ event.metadata }}
                            </a>
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
import { mapState } from 'vuex';

export default {
    name: 'EventsList',
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
    },
    computed: {
        ...mapState({
            isLoading: (state) => state.userActivity.isLoading,
        }),
    },
};
</script>