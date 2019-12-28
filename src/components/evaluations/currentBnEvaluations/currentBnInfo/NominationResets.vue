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
                    <tr v-for="event in events" :key="event.id" :class="!isNat ? '' : getNotabilityColor(event.valid)">
                        <td scope="row">
                            {{ new Date(event.timestamp).toString().slice(4,10) }}
                        </td>
                        <td scope="row">
                            <a :href="event.postId ? 'https://osu.ppy.sh/beatmapsets/' + event.beatmapsetId + '/discussion/-/generalAll#/' + event.postId : 'https://osu.ppy.sh/beatmapsets/' + event.beatmapsetId + '/discussion/-/events'" target="_blank">
                                {{ event.metadata.length > 30 ? event.metadata.slice(0,30).trim() + "..." : event.metadata }}
                            </a>
                        </td>
                        <td v-if="!editing" scope="row" v-html="filterLinks(event.content)" />
                        <td v-else scope="row">
                            <input class="w-60" :class="'input-' + event._id" type="text" :placeholder="event.content.length > 40 ? event.content.slice(0,40) + '...' : event.content" maxlength="100">
                            <button class="btn btn-xs btn-nat" @click="updateReason(event._id, $event);">
                                Save
                            </button>
                            <notability
                                :selected-entry="event"
                                @update-notability-color="updateNotabilityColor($event, event._id)"
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
            <p v-else class="small text-shadow ml-4">
                None...
            </p>
            <p v-if="info" class="errors">
                {{ info }}
            </p>
        </div>
    </div>
</template>

<script>
import postData from '../../../../mixins/postData.js';
import filterLinks from '../../../../mixins/filterLinks.js';
import Notability from '../../../dataCollection/Notability.vue';

export default {
    name: 'nomination-resets',
    mixins: [ postData, filterLinks ],
    props: {
        events: Array,
        eventsId: String,
        header: String,
        loading: Boolean,
        editing: Boolean,
        isNat: Boolean,
    },
    components: {
        Notability,
    },
    data() {
        return {
            info: null,
        };
    },
    watch: {
        editing() {
            this.info = null;
        },
    },
    methods: {
        async updateReason(entryId, e) {
            let reasonInput = $(`.input-${entryId}`).val();
            const result = await this.executePost('/dataCollection/updateReason/' + entryId, { reason: reasonInput }, e);
            if (result) {
                if (result.error) {
                    this.info = result.error;
                } else {
                    this.$emit('update-entry', result);
                }
            }
        },

        getNotabilityColor(notability) {
            switch(notability) {
                case 1:
                    return 'vote-border-pass';
                case 2:
                    return 'vote-border-extend';
                case 3:
                    return 'vote-border-fail';
                default:
                    return '';
            }
        },

        updateNotabilityColor(notability, eventId) {
            const event = this.events.filter(x => x._id === eventId);
            console.log(event[0]);
            event[0].valid = notability;
        }
    },
};
</script>