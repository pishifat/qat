<template>
    <div>
        <section class="card card-body">
            <h3 class="mb-0">
                <a
                    data-toggle="collapse"
                    :href="`#${target}`"
                >
                    {{ title }}
                    <i class="fas fa-angle-down" />
                </a>
            </h3>
        </section>

        <section :id="target" class="card card-body collapse">
            <data-table :headers="['Date', 'Mapset', 'Reason']">
                <tr
                    v-for="event in events"
                    :key="event.id"
                >
                    <!-- date -->
                    <td class="text-nowrap">
                        {{ event.timestamp | toMonthDay }}
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
        </section>
    </div>
</template>

<script>
import ReasonRow from './ReasonRow.vue';
import DataTable from '../DataTable.vue';

export default {
    name: 'EventsTable',
    components: {
        ReasonRow,
        DataTable,
    },
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
        target: {
            type: String,
            required: true,
        },
    },
};
</script>
