<template>
    <div>
        <div class="form-inline">
            <input
                v-model="natDays"
                class="form-control"
                type="number"
                placeholder="days of activity..."
                min="1"
                max="100"
                @keyup.enter="findNatActivity($event)"
            >

            <select
                v-model="natMode"
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
                title="Finds NAT eval activity, defaults to 30 days"
                @click="findNatActivity($event)"
            >
                Load NAT activity
            </button>
        </div>

        <div v-if="natActivity">
            <div
                v-for="user in natActivity"
                :key="user.username"
                class="small mb-1"
            >
                <user-link
                    :osu-id="user.osuId"
                    :username="user.username"
                />
                (joined {{ user.joinDate | toStandardDate }})
                <ul>
                    <li>{{ user.totalBnAppEvals }} application evaluations</li>
                    <li>{{ user.totalCurrentBnEvals }} current BN evaluations</li>
                </ul>
            </div>

            <div class="ml-2 small">
                <div>
                    Total BN applications evaluated: {{ totalBnApps }}
                </div>
                <div>
                    Total current BNs evaluated: {{ totalBnEvaluations }}
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import UserLink from '../UserLink.vue';

export default {
    name: 'NatActivity',
    components: {
        UserLink,
    },
    data() {
        return {
            natActivity: null,
            natDays: null,
            natMode: 'osu',
            natTotal: null,
            totalBnApps: null,
            totalBnEvaluations: null,
        };
    },
    methods: {
        async findNatActivity(e) {
            if (!this.natDays || !this.natDays.length) this.natDays = 30;

            const res = await this.$http.executeGet(`/users/findNatActivity/${this.natDays}/${this.natMode}`, e);

            if (res) {
                this.natActivity = res.info;
                this.natTotal = res.bnAppsCount + res.bnEvaluationsCount;
                this.totalBnApps = res.bnAppsCount;
                this.totalBnEvaluations = res.bnEvaluationsCount;
            }
        },
    },
};
</script>

<style>

</style>
