<template>
    <div class="my-2">
        <button
            v-if="!badgeUsers.length"
            class="btn btn-sm btn-primary my-1"
            data-toggle="tooltip"
            data-placement="right"
            title="Finds relevant yearly profile badge info"
            @click="findUserBadgeInfo()"
        >
            Load badge info
        </button>
        <div v-if="badgeUsers.length">
            <small class="my-2">
                only pishifat can edit this section
            </small>

            <div v-for="user in badgeUsers" :key="user.id" class="small mb-1">
                <a :href="'https://osu.ppy.sh/users/' + user.osuId" target="_blank">{{ user.username }}</a>
                <ul>
                    <li :class="user.bnProfileBadge != calculateDuration(user.bnDuration) && calculateDuration(user.bnDuration) >= 1 ? 'background-fail' : ''">
                        BN: {{ calculateDuration(user.bnDuration) }} -- badge: {{ user.bnProfileBadge }}
                        <a href="#" @click.prevent="editBadgeValue(user.id, 'bn', true)"><i class="fas fa-plus" /></a>
                        <a href="#" @click.prevent="editBadgeValue(user.id, 'bn', false)"><i class="fas fa-minus" /></a>
                    </li>
                    <li :class="user.natProfileBadge != calculateDuration(user.natDuration) && calculateDuration(user.natDuration) >= 1 ? 'background-fail' : ''">
                        NAT: {{ calculateDuration(user.natDuration) }} -- badge: {{ user.natProfileBadge }}
                        <a href="#" @click.prevent="editBadgeValue(user.id, 'nat', true)"><i class="fas fa-plus" /></a>
                        <a href="#" @click.prevent="editBadgeValue(user.id, 'nat', false)"><i class="fas fa-minus" /></a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';

export default {
    name: 'Badges',
    mixins: [postData],
    data() {
        return {
            badgeUsers: [],
        };
    },
    methods: {
        async findUserBadgeInfo() {
            const users = await this.executeGet('/nat/findUserBadgeInfo');

            if (users) {
                this.badgeUsers = [];
                users.forEach(user => {
                    if ((this.calculateDuration(user.bnDuration) >= 1) || (this.calculateDuration(user.natDuration) >= 1)) {
                        this.badgeUsers.push(user);
                    }
                });
            }
        },
        calculateDuration(dateArray) {
            let days = 0;

            for (let i = 0; i < dateArray.length; i += 2) {
                let a = new Date(dateArray[i]);
                let b = new Date(dateArray[i + 1]);

                if (dateArray[i + 1]) {
                    days += Math.abs(b.getTime() - a.getTime()) / (1000 * 3600 * 24);
                } else {
                    days += Math.abs(new Date().getTime() - a.getTime()) / (1000 * 3600 * 24);
                }
            }

            let years = Math.floor(days / 365);

            return years;
        },
        async editBadgeValue(id, group, add) {
            const u = await this.executePost(
                '/nat/editBadgeValue/' + id,
                { group, add }
            );

            if (u && !u.error) {
                const i = this.badgeUsers.findIndex(user => user.id == u.id);
                group == 'bn' ? this.badgeUsers[i].bnProfileBadge = u.bnProfileBadge : this.badgeUsers[i].natProfileBadge = u.natProfileBadge;
            }
        },
    },
};
</script>

<style>

</style>
