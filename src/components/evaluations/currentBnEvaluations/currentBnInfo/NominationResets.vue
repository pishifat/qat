<template>
    <div>
        <p class="text-shadow min-spacing">
            <a :href="events && `#${eventsId}`" data-toggle="collapse">{{ header }} <i class="fas fa-angle-down" /></a> 
            ({{ loading ? '...' : events ? events.length : '0' }})
        </p>
        <div v-if="events" :id="eventsId" class="collapse">
            <table v-if="events.length" class="table table-sm table-dark table-hover col-md-12 mt-2">
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
                <tbody class="small">
                    <tr v-for="event in events" :key="event._id">
                        <td scope="row">
                            {{ new Date(event.timestamp).toString().slice(4,10) }}
                        </td>
                        <td scope="row truncate">
                            <a :href="event.postId ? 'https://osu.ppy.sh/beatmapsets/' + event.beatmapsetId + '/discussion/-/generalAll#/' + event.postId : 'https://osu.ppy.sh/beatmapsets/' + event.beatmapsetId + '/discussion/-/events'" target="_blank">
                                {{ event.metadata }}
                            </a>
                        </td>
                        <nomination-reset-editing
                            :event="event"
                            :is-nat="isNat"
                            @update-content="$emit('update-content', $event);"
                            @update-obviousness="$emit('update-obviousness', $event);"
                            @update-severity="$emit('update-severity', $event);"
                        />
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
import NominationResetEditing from './NominationResetEditing.vue';

export default {
    name: 'NominationResets',
    components: {
        NominationResetEditing,
    },
    props: {
        events: Array,
        eventsId: String,
        header: String,
        loading: Boolean,
        isNat: Boolean,
    },
};
</script>