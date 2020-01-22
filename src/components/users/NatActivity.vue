<template>
    <div class="my-2">
        <button
            class="btn btn-sm btn-nat minw-200 my-1"
            data-toggle="tooltip"
            data-placement="right"
            title="Finds NAT eval activity, defaults to 30 days"
            @click="findNatActivity()"
        >
            Load NAT activity
        </button>
        <input
            v-model="natDays"
            class="small"
            type="text"
            autocomplete="off"
            placeholder="days of activity..."
            maxlength="3"
            @keyup.enter="findNatActivity()"
        >
        <small class="ml-1">
            <select v-model="natMode" class="custom-select" @change="findNatActivity()">
                <option class="ml-2" value="osu" selected>osu!</option>
                <option class="ml-2" value="taiko">osu!taiko</option>
                <option class="ml-2" value="catch">osu!catch</option>
                <option class="ml-2" value="mania">osu!mania</option>
            </select>
        </small>
        <div v-if="natActivity">
            <div v-for="user in natActivity" :key="user.username" class="small min-spacing mb-1">
                <a :href="'https://osu.ppy.sh/users/' + user.osuId" target="_blank">{{ user.username }}</a> (joined {{user.joinDate.toString().slice(0, 10)}})
                <ul>
                    <li>{{ user.totalBnAppEvals }} application evaluations</li>
                    <li>{{ user.totalCurrentBnEvals }} current BN evaluations</li>
                    <li>{{ user.totalWrittenFeedbacks }} total written feedback</li>
                </ul>
            </div>
            <p class="small min-spacing ml-2">
                Total BN applications evaluated: {{ totalBnApps }}
            </p>
            <p class="small min-spacing ml-2">
                Total current BNs evaluated: {{ totalEvalRounds }}
            </p>
            <p class="small min-spacing ml-2">
                Note: Evaluations only counted after May 5th 2019. Written feedback only counted after September 9th 2019.
            </p>
        </div>
    </div>
</template>

<script>
export default {
    name: 'NatActivity',
    data() {
        return {
            natActivity: null,
            natDays: '',
            natMode: 'osu',
            natTotal: null,
            totalBnApps: null,
            totalEvalRounds: null,
        };
    },
    methods: {
        findNatActivity() {
            if(!this.natDays.length) this.natDays = 30;
            axios
                .get('/users/findNatActivity/' + this.natDays + '/' + this.natMode)
                .then(response => {
                    this.natActivity = response.data.info;
                    this.natTotal = response.data.bnAppsCount + response.data.evalRoundsCount;
                    this.totalBnApps = response.data.bnAppsCount;
                    this.totalEvalRounds = response.data.evalRoundsCount;
                });
        },
    },
};
</script>

<style>

</style>
