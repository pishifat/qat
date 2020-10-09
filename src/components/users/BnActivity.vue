<template>
    <div>
        <div class="form-inline">
            <input
                v-model="bnDays"
                class="form-control"
                type="text"
                autocomplete="off"
                placeholder="days of activity..."
                maxlength="3"
                @keyup.enter="findBnActivity($event)"
            >

            <select v-model="bnMode" class="form-control ml-1" @change="findBnActivity($event)">
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
                title="Finds BN nomination, pop/dq, and report activity, defaults to 30 days"
                @click="findBnActivity($event)"
            >
                Load BN activity
            </button>
        </div>

        <div v-if="bnActivity">
            <div v-for="user in bnActivity" :key="user.username" class="small mb-1">
                <user-link
                    :osu-id="user.osuId"
                    :username="user.username"
                />
                (joined {{ user.joinDate | toStandardDate }})
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
                    <li>{{ user.qualityAssuranceChecks }} quality assurance checks</li>
                    <li>Next evaluation: {{ user.nextEvaluation ? (user.nextEvaluation.slice(0, 10)): 'Never' }}</li>
                </ul>
            </div>
            <p class="small ml-2">
                Note: Nominations only accounted for after March 31st 2019.
            </p>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';
import UserLink from '../UserLink.vue';

export default {
    name: 'BnActivity',
    components: {
        UserLink,
    },
    mixins: [ postData ],
    data() {
        return {
            bnActivity: null,
            bnDays: null,
            bnDaysDisplay: '',
            bnMode: 'osu',
        };
    },
    methods: {
        async findBnActivity(e) {
            if (!this.bnDays || !this.bnDays.length) this.bnDays = 30;

            const activity = await this.executeGet('/users/findBnActivity/' + this.bnDays + '/' + this.bnMode, e);

            if (activity) {
                this.bnActivity = activity;
                this.bnDaysDisplay = this.bnDays;
            }
        },
    },
};
</script>
