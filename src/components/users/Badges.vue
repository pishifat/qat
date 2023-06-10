<template>
    <div class="my-2">
        <button
            v-if="!badgeUsers.length"
            class="btn btn-sm btn-primary my-1"
            data-toggle="tooltip"
            data-placement="right"
            title="Finds relevant yearly profile badge info"
            @click="findUserBadgeInfo($event)"
        >
            Load badge info
        </button>
        <div v-if="badgeUsers.length">
            <hr>
            <ul class="small">
                <li>BN1y.png</li>
                <li>BN2y.jpg</li>
                <li>BN3y.jpg</li>
                <li>BN4y.jpg</li>
                <li>BN5y.jpg</li>
                <li>Longstanding contribution to the Beatmap Nominators - 1 Year</li>
                <li>Longstanding contribution to the Beatmap Nominators - 2 Years</li>
                <li>Longstanding contribution to the Beatmap Nominators - 3 Years</li>
                <li>Longstanding contribution to the Beatmap Nominators - 4 Years</li>
                <li>Longstanding contribution to the Beatmap Nominators - 5 Years</li>
                <li>https://osu.ppy.sh/wiki/en/People/The_Team/Beatmap_Nominators</li>
                <li>QAT1y.png</li>
                <li>QAT2y.jpg</li>
                <li>QAT3y.jpg</li>
                <li>QAT4y.jpg</li>
                <li>QAT5y.jpg</li>
                <li>Longstanding contribution to the Nomination Assessment Team - 1 Year</li>
                <li>Longstanding contribution to the Nomination Assessment Team - 2 Years</li>
                <li>Longstanding contribution to the Nomination Assessment Team - 3 Years</li>
                <li>Longstanding contribution to the Nomination Assessment Team - 4 Years</li>
                <li>Longstanding contribution to the Nomination Assessment Team - 5 Years</li>
                <li>Longstanding contribution to the Quality Assurance Team / Nomination Assessment Team - 4 Years</li>
                <li>Longstanding contribution to the Quality Assurance Team / Nomination Assessment Team - 5 Years</li>
                <li>https://osu.ppy.sh/wiki/en/People/Nomination_Assessment_Team</li>
            </ul>
            <hr>
            <h5>Users that need updates:</h5>
                <div v-for="user in badgeUsers" :key="user.id" class="small mb-1">
                    <div v-if="compareBadgeDuration(user.bnProfileBadge, user.bnDuration) || compareBadgeDuration(user.natProfileBadge, user.natDuration)">
                        <user-link
                            :osu-id="user.osuId"
                            :username="user.username"
                        /> {{ user.osuId }}
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
                <hr>
                <h5>All users:</h5>
            <div v-for="user in badgeUsers" :key="user.id" class="small mb-1">
                <user-link
                    :osu-id="user.osuId"
                    :username="user.username"
                /> {{ user.osuId }}
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
        async findUserBadgeInfo(e) {
            const users = await this.$http.executeGet('/users/nat/findUserBadgeInfo', e);

            if (users) {
                this.badgeUsers = users.filter(user =>
                    (this.yearsDuration(user.bnDuration) >= 1) || (this.yearsDuration(user.natDuration) >= 1)
                );
            }
        },
        compareBadgeDuration (currentBadge, days) {
            if ((this.yearsDuration(days) > 5) && (currentBadge === 5)) return false; // remove this line when +5 year badges are added
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
