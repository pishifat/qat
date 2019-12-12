<template>
    <div>
        <p class="text-shadow min-spacing">
            <a :href="nominations && '#nominations'" data-toggle="collapse">Unique nominations <i class="fas fa-angle-down" /></a> 
            ({{ loading ? '...' : nominations ? nominations.length: '0' }})
            <button v-if="isNat" class="btn btn-sm btn-nat float-right" @click="$emit('update-editing');">
                {{ editing ? 'Disable reason editing' : 'Enable reason editing' }}
            </button>
        </p>
        <div v-if="nominations" id="nominations" class="collapse">
            <table v-if="nominations.length" class="table table-sm table-dark table-hover col-md-12 mt-2">
                <thead>
                    <td scope="col">
                        Date
                    </td>
                    <td scope="col">
                        Mapset
                    </td>
                </thead>
                <tbody class="small">
                    <tr v-for="nomination in nominations" :key="nomination.id">
                        <td scope="row">
                            {{ new Date(nomination.timestamp).toString().slice(4,10) }}
                        </td>
                        <td scope="row">
                            <a :href="'https://osu.ppy.sh/beatmapsets/' + nomination.beatmapsetId + '/discussion/-/events'" target="_blank">
                                {{ nomination.metadata.length > 90 ? nomination.metadata.slice(0,90) + '...' : nomination.metadata }}
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

export default {
    name: 'unique-nominations-table',
    props: {
        nominations: Array,
        loading: Boolean,
        editing: Boolean,
        isNat: Boolean,
    },
};
</script>