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
            <hr />
            <!-- TODO: rewrite this to return accurate and non-duped numbers -->
            <!--
            <div class="small mt-2">
                <ul>
                    <li>
                        Total nominations: <b>{{ totalNominations }}</b>
                    </li>
                    <li>
                        Total resets: <b>{{ totalResets }}</b>
                    </li>
                </ul>
            </div>
            <hr />
            -->
            <div v-for="user in bnActivity" :key="user.username" class="small mb-1">
                <user-link
                    :osu-id="user.osuId"
                    :username="user.username"
                />
                (joined {{ toStandardDate(user.joinDate) }})
                <ul>
                    <li
                        :class="user.uniqueNominations < Math.round(bnDaysDisplay/30) ?
                            'background-fail' :
                            user.uniqueNominations < (Math.round(bnDaysDisplay/30)*2) ?
                                'background-warn' :
                                'background-pass'"
                    >
                        {{ user.uniqueNominations }} {{ user.uniqueNominations == 1 ? 'nomination' : 'nominations' }}
                    </li>
                    <li>{{ user.nominationResets }} nomination {{ user.nominationResets == 1 ? 'reset' : 'resets' }}</li>
                    <li>Next evaluation: {{ user.nextEvaluation ? user.nextEvaluation : 'Never' }}</li>
                </ul>
            </div>
            <p class="small ml-2">
                Note: Nominations only accounted for after March 31st 2019.
            </p>
        </div>
    </div>
</template>

<script>
import UserLink from '../UserLink.vue';

export default {
    name: 'BnActivity',
    components: {
        UserLink,
    },
    data() {
        return {
            bnActivity: null,
            totalNominations: null,
            totalResets: null,
            bnDays: null,
            bnDaysDisplay: '',
            bnMode: 'osu',
        };
    },
    methods: {
        async findBnActivity(e) {
            if (!this.bnDays || !this.bnDays.length) this.bnDays = 30;

            const activity = await this.$http.executeGet('/users/findBnActivity/' + this.bnDays + '/' + this.bnMode, e);

            if (activity) {
                this.bnActivity = activity;
                this.bnDaysDisplay = this.bnDays;
                this.totalNominations = activity.reduce((total, element) => total + element.uniqueNominations, 0);
                this.totalResets = activity.reduce((total, element) => total + element.nominationResets, 0);
            }
        },
    },
};
</script>
