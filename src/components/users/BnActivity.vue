<template>
    <div class="my-2">
        <button
            class="btn btn-sm btn-nat minw-200 my-1"
            data-toggle="tooltip"
            data-placement="right"
            title="Finds BN nomination, pop/dq, and report activity, defaults to 30 days"
            @click="findBnActivity()"
        >
            Load BN activity
        </button>
        <input
            v-model="bnDays"
            class="small"
            type="text"
            autocomplete="off"
            placeholder="days of activity..."
            maxlength="3"
            @keyup.enter="findBnActivity()"
        >
        <small class="ml-1">
            <select v-model="bnMode" class="custom-select" @change="findBnActivity()">
                <option class="ml-2" value="osu" selected>osu!</option>
                <option class="ml-2" value="taiko">osu!taiko</option>
                <option class="ml-2" value="catch">osu!catch</option>
                <option class="ml-2" value="mania">osu!mania</option>
            </select>
        </small>
        <div v-if="bnActivity">
            <div v-for="user in bnActivity" :key="user.username" class="small min-spacing mb-1">
                <a :href="'https://osu.ppy.sh/users/' + user.osuId" target="_blank">{{ user.username }}</a> (joined {{ user.joinDate.toString().slice(0, 10) }})
                <ul>
                    <li
                        :class="user.uniqueNominations < bnDaysDisplay/10 ?
                            'background-fail' :
                            user.uniqueNominations < bnDaysDisplay/6 ?
                                'background-warn' :
                                'background-pass'"
                    >
                        {{ user.uniqueNominations }} nominations
                    </li>
                    <li>{{ user.nominationResets }} nomination resets</li>
                    <li>Next evaluation: {{ user.nextEvaluation.slice(0,10) }}</li>
                </ul>
            </div>
            <p class="small min-spacing ml-2">
                Note: Nominations only accounted for after March 31st 2019.
            </p>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';

export default {
    name: 'BnActivity',
    mixins: [ postData ],
    data() {
        return {
            bnActivity: null,
            bnDays: '',
            bnDaysDisplay: '',
            bnMode: 'osu',
        };
    },
    methods: {
        async findBnActivity() {
            if (!this.bnDays.length) this.bnDays = 30;
            const activity = await this.executeGet('/users/findBnActivity/' + this.bnDays + '/' + this.bnMode);

            if (activity) {
                this.bnActivity = activity;
                this.bnDaysDisplay = this.bnDays;
            }
        },
    },
};
</script>

<style>

</style>
