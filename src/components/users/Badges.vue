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
                <user-link
                    :osu-id="user.osuId"
                    :username="user.username"
                />
                <ul>
                    <li :class="compareBadgeDuration(user.bnProfileBadge, user.bnDuration) ? 'background-fail' : ''">
                        BN: {{ yearsDuration(user.bnDuration) }} -- badge: {{ user.bnProfileBadge }}
                        <a href="#" @click.prevent="editBadgeValue(user.id, 'bn', true)"><i class="fas fa-plus" /></a>
                        <a href="#" @click.prevent="editBadgeValue(user.id, 'bn', false)"><i class="fas fa-minus" /></a>
                    </li>
                    <li :class="compareBadgeDuration(user.natProfileBadge, user.natDuration) ? 'background-fail' : ''">
                        NAT: {{ yearsDuration(user.natDuration) }} -- badge: {{ user.natProfileBadge }}
                        <a href="#" @click.prevent="editBadgeValue(user.id, 'nat', true)"><i class="fas fa-plus" /></a>
                        <a href="#" @click.prevent="editBadgeValue(user.id, 'nat', false)"><i class="fas fa-minus" /></a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
import UserLink from '../UserLink.vue';

export default {
    name: 'Badges',
    components: {
        UserLink,
    },
    data () {
        return {
            badgeUsers: [],
        };
    },
    methods: {
        async findUserBadgeInfo() {
            const users = await this.$http.executeGet('/users/nat/findUserBadgeInfo');

            if (users) {
                this.badgeUsers = users.filter(user =>
                    (this.yearsDuration(user.bnDuration) >= 1) || (this.yearsDuration(user.natDuration) >= 1)
                );
            }
        },
        compareBadgeDuration (currentBadge, days) {
            return (currentBadge || 0) != this.yearsDuration(days);
        },
        yearsDuration (days) {
            return Math.floor(days / 365);
        },
        async editBadgeValue(id, group, add) {
            const u = await this.$http.executePost(
                '/users/nat/editBadgeValue/' + id,
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
