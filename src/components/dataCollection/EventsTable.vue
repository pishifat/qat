<template>
    <section class="segment segment-image mx-0">
        <h2>{{ title }}</h2>
        <table class="table table-sm table-dark table-hover col-md-12 mt-2">
            <thead>
                <td scope="col" class="w-10">
                    Date
                </td>
                <td scope="col" class="w-30">
                    Mapset
                </td>
                <td scope="col" class="w-60">
                    Reason
                </td>
            </thead>
            <tbody>
                <tr
                    v-for="event in events"
                    :key="event.id"
                >
                    <!-- date -->
                    <td scope="row">
                        {{ new Date(event.timestamp).toString().slice(4,15) }}
                    </td>
                    <!-- metadata -->
                    <td scope="row">
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
            </tbody>
        </table>
    </section>
</template>

<script>
import filterLinks from '../../mixins/filterLinks.js';
import ReasonRow from './ReasonRow.vue';

export default {
    name: 'EventsTable',
    components: {
        ReasonRow,
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