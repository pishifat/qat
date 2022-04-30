<template>
    <div>
        <div class="form-inline">
            <input
                v-model="number"
                class="form-control"
                type="number"
                placeholder="# of apps and bn evals to consider"
                min="1"
                max="100"
                @keyup.enter="findNatActivity($event)"
            >

            <select
                v-model="mode"
                class="form-control ml-1"
                @change="findNatActivity($event)"
            >
                <option class="ml-2" value="osu" selected>
                    osu!
                </option>
                <option class="ml-2" value="taiko">
                    osu!taiko
                </option>
                <option class="ml-2" value="catch">
                    osu!catch
                </option>
                <option class="ml-2" value="mania">
                    osu!mania
                </option>
            </select>

            <button
                class="btn btn-sm btn-primary ml-1"
                data-toggle="tooltip"
                data-placement="right"
                title="load NAT activity based on # of evals. this takes a while so sit tight"
                @click="findNatActivity($event)"
            >
                Load NAT activity
            </button>
        </div>

        <div v-if="userInfo.length">
            <data-table :headers="['#', 'user', 'BN app evals', 'current BN evals', 'total', 'total days overdue']" class="w-75 my-2">
                <tr
                    v-for="(user, i) in userInfo"
                    :key="user.username"
                    :class="user.recentlyJoinedNat ? 'bg-danger' : ''"
                >
                    <!-- # -->
                    <td class="text-center">
                        {{ i+1 }}
                    </td>
                    <!-- user -->
                    <td class="text-center">
                        <user-link
                            :osu-id="user.osuId"
                            :username="user.username"
                        />{{ user.recentlyJoinedNat ? '*' : '' }}{{ user.inBag ? '^' : '' }}
                    </td>
                    <!-- stats -->
                    <td class="text-center">
                        {{ user.participatedAppEvals }}
                    </td>
                    <td class="text-center">
                        {{ user.participatedCurrentBnEvals }}
                    </td>
                    <td class="text-center">
                        <b>{{ user.totalParticipated }} ({{ Math.round((user.totalParticipated/total)*100) }}%)</b>
                    </td>
                    <!--<td class="text-center" disabled="true">
                        {{ user.totalFeedbackWritten }}
                    </td>-->
                    <td class="text-center">
                        {{ user.totalDaysOverdue }}
                    </td>
                </tr>
            </data-table>

            <div v-if="recentlyJoinedNatExists" class="text-danger">
                *user joined NAT after some evaluations were completed
            </div>
            <div class="text-danger">
                ^user could be assigned to the next evaluation (in the 'bag')
            </div>
            <!--<button
                class="btn btn-sm btn-danger ml-1"
                @click="cycleBag($event)"
            >
                Cycle bag
            </button>-->
        </div>
    </div>
</template>

<script>
import UserLink from '../UserLink.vue';
import DataTable from '../DataTable.vue';

export default {
    name: 'NatActivity2',
    components: {
        UserLink,
        DataTable,
    },
    data() {
        return {
            number: 10,
            mode: 'osu',
            userInfo: [],
            total: null,
        };
    },
    computed: {
        /** @returns {boolean} */
        recentlyJoinedNatExists () {
            let recentlyJoinedNatExists;

            if (this.userInfo.length) {
                recentlyJoinedNatExists = this.userInfo.some(u => u.recentlyJoinedNat);
            }

            return recentlyJoinedNatExists;
        },
    },
    methods: {
        async findNatActivity(e) {
            const res = await this.$http.executeGet(`/users/findNatActivity2/${this.number}/${this.mode}`, e);

            if (res) {
                this.userInfo = res.info;
                this.total = res.total;
            }
        },
        async cycleBag(e) {
            const res = await this.$http.executePost(`/users/cycleBag/${this.mode}`, e);

            if (res) {
                await this.findNatActivity();
            }
        },
    },
};
</script>

<style>

</style>
