<template>
    <div>
        <h2>{{ title }}</h2>
        <data-table :headers="['Date', 'Mapset', 'Reason']">
            <tr
                v-for="event in events"
                :key="event.id"
            >
                <!-- date -->
                <td class="text-nowrap">
                    {{ new Date(event.timestamp).toString().slice(4,15) }}
                </td>
                <!-- metadata -->
                <td>
                    <a
                        :href="event.postId ?
                            'https://osu.ppy.sh/beatmapsets/' + event.beatmapsetId + '/discussion/-/generalAll#/' + event.postId :
                            'https://osu.ppy.sh/beatmapsets/' + event.beatmapsetId + '/discussion/-/events'"
                        target="_blank"
                    >
                        {{ event.metadata }}
                    </a>
                </td>
                <!-- reason -->
                <reason-row
                    :event="event"
                />
            </tr>
        </data-table>
    </div>
</template>

<script>
import filterLinks from '../../mixins/filterLinks.js';
import ReasonRow from './ReasonRow.vue';
import DataTable from '../DataTable.vue';

export default {
    name: 'EventsTable',
    components: {
        ReasonRow,
        DataTable,
    },
    mixins: [filterLinks],
    props: {
        events: {
            type: Array,
            default() {
                return [];
            },
        },
        title: {
            type: String,
            required: true,
        },
    },
};
</script>
