<template>
    <div>
        <div class="ms-2">
            <a
                :href="events && `#${eventsId}`"
                data-bs-toggle="collapse"
            >{{ header }} <i class="fas fa-angle-down" /></a>
            ({{ isLoading ? '...' : mappers.length }})
        </div>
        <div v-if="events" :id="eventsId" class="collapse">
            <data-table
                v-if="mappers.length"
                :headers="['Host', 'Nominations']"
            >
                <tr
                    v-for="mapper in mappers"
                    :key="mapper.creatorId || mapper.creatorName"
                >
                    <td>
                        <user-link
                            :username="mapper.creatorName || 'Unknown'"
                            :osu-id="mapper.creatorId"
                        />
                        <template v-if="showStaffPills">
                            <span
                                v-if="mapper.creatorGroups.includes('nat')"
                                class="badge rounded-pill ms-1 text-bg-nat"
                            >NAT</span>
                            <span
                                v-if="mapper.creatorGroups.includes('bn')"
                                class="badge rounded-pill ms-1 text-bg-bn"
                            >BN</span>
                        </template>
                    </td>
                    <td>
                        {{ mapper.count }}
                    </td>
                </tr>
            </data-table>
            <p v-else class="small ms-4">
                None...
            </p>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import DataTable from '../../../../DataTable.vue';
import UserLink from '../../../../UserLink.vue';

export default {
    name: 'MapperVariety',
    components: {
        DataTable,
        UserLink,
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
            default: 'Unique nominated mappers',
        },
        eventsId: {
            type: String,
            required: true,
        },
    },
    computed: {
        ...mapState(['loggedInUser']),
        ...mapState('activity', ['isLoading']),
        showStaffPills() {
            return Boolean(this.loggedInUser && this.loggedInUser.isNat);
        },
        mappers() {
            const groups = new Map();

            for (const event of this.events || []) {
                const key = event.creatorId != null ? String(event.creatorId) : (event.creatorName || 'unknown');
                const existing = groups.get(key);

                if (existing) {
                    existing.count += 1;
                } else {
                    groups.set(key, {
                        creatorId: event.creatorId,
                        creatorName: event.creatorName,
                        creatorGroups: event.creatorGroups || [],
                        count: 1,
                    });
                }
            }

            return [...groups.values()].sort((a, b) => {
                if (b.count !== a.count) return b.count - a.count;

                return String(a.creatorName || '').localeCompare(String(b.creatorName || ''));
            });
        },
    },
};
</script>
