<template>
    <div>
        <div class="form-inline">
            <input
                v-model="gmtDays"
                class="form-control w-25"
                type="number"
                placeholder="days of activity..."
                min="1"
                max="100"
                @keyup.enter="findGmtActivity($event)"
            >

            <button
                class="btn btn-sm btn-primary ml-1"
                data-toggle="tooltip"
                data-placement="right"
                title="Finds GMT vote activity, defaults to 30 days"
                @click="findGmtActivity($event)"
            >
                Load GMT activity
            </button>
        </div>

        <div v-if="gmtActivity">
            <div
                v-for="user in gmtActivity"
                :key="user.username"
                class="small mb-1"
            >
                <user-link
                    :osu-id="user.osuId"
                    :username="user.username"
                />
                <div>{{ user.totalVotes }} content review votes</div>
            </div>
        </div>
    </div>
</template>

<script>
import UserLink from '../UserLink.vue';

export default {
    name: 'GmtActivity',
    components: {
        UserLink,
    },
    data() {
        return {
            gmtActivity: null,
            gmtDays: null,
        };
    },
    methods: {
        async findGmtActivity(e) {
            if (!this.gmtDays || !this.gmtDays.length) this.gmtDays = 30;

            const res = await this.$http.executeGet(`/users/findGmtActivity/${this.gmtDays}`, e);

            if (res) {
                this.gmtActivity = res.info;
            }
        },
    },
};
</script>

<style>

</style>
