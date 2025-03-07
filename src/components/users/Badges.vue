<template>
    <div>
        <b>Badges:</b>

        <a
            class="ml-1"
            data-toggle="tooltip"
            data-placement="top"
            title="loads badge tracker"
            href="#"
            @click.prevent="findUserBadgeInfo()"
        >
            <i class="fas fa-search" />
        </a>
        
        <div v-if="badgeUsers.length">
            <div v-for="user in badgeUsers" :key="user.id" class="small mb-1">
                <div v-if="user || (compareBadgeDuration(user.bnProfileBadge, user.bnDuration) || compareBadgeDuration(user.natProfileBadge, user.natDuration) || compareNominationsBadge(user.nominationsProfileBadge, user.actualNominationsProfileBadge))">
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
                        <li :class="compareNominationsBadge(user.nominationsProfileBadge, user.actualNominationsProfileBadge) ? 'background-fail' : ''">
                            Nominations: {{ thresholds[user.actualNominationsProfileBadge] }} -- badge: {{ thresholds[user.nominationsProfileBadge] }}
                            <a href="#" @click.prevent="editBadgeValue(user.id, 'nom', true)"><i class="fas fa-plus" /></a>
                            <a href="#" @click.prevent="editBadgeValue(user.id, 'nom', false)"><i class="fas fa-minus" /></a>
                        </li>
                        <li v-if="compareBadgeDuration(user.bnProfileBadge, user.bnDuration)">
                            <code>{{ badgeCommand(user.osuId, user.bnProfileBadge, user.bnDuration, 'bn') }}</code>
                        </li>
                        <li v-if="compareBadgeDuration(user.natProfileBadge, user.natDuration)">
                            <code>{{ badgeCommand(user.osuId, user.natProfileBadge, user.natDuration, 'nat') }}</code>
                        </li>
                        <li v-if="compareNominationsBadge(user.nominationsProfileBadge, user.actualNominationsProfileBadge)">
                            <code>{{ badgeCommand(user.osuId, user.nominationsProfileBadge, user.actualNominationsProfileBadge, 'nom') }}</code>
                        </li>
                    </ul>
                </div>
            </div>
            <div v-if="!user">
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
                        <li :class="compareNominationsBadge(user.nominationsProfileBadge, user.actualNominationsProfileBadge) ? 'background-fail' : ''">
                            Nominations: {{ thresholds[user.actualNominationsProfileBadge] }} -- badge: {{ thresholds[user.nominationsProfileBadge] }}
                            <a href="#" @click.prevent="editBadgeValue(user.id, 'nom', true)"><i class="fas fa-plus" /></a>
                            <a href="#" @click.prevent="editBadgeValue(user.id, 'nom', false)"><i class="fas fa-minus" /></a>
                        </li>
                    </ul>
                </div>
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
    props: {
        user: {
            type: Object,
            default: null,
        },
    },
    data () {
        return {
            badgeUsers: [],
            thresholds: [0, 100, 200, 400, 600, 800, 1000, 1500, 2000],
        };
    },
    watch: {
        user() {
            this.badgeUsers = [];
        },
    },
    methods: {
        async findUserBadgeInfo(e) {
            let users;

            if (this.user) {
                users = await this.$http.executeGet(`/users/nat/findUserBadgeInfo/` + this.user.id, e);

                if (users) {
                    this.badgeUsers = users;
                }
            } else {
                users = await this.$http.executeGet('/users/nat/findUserBadgeInfo/false', e);

                if (users) {
                    this.badgeUsers = users.filter(user =>
                        (this.yearsDuration(user.bnDuration) >= 1) || (this.yearsDuration(user.natDuration) >= 1 || user.actualNominationsProfileBadge >= 1)
                    );
                }
            }
        },
        compareBadgeDuration (currentBadge, days) {
            if ((this.yearsDuration(days) > 10) && (currentBadge === 10)) return false; // remove this line when +5 year badges are added
            return (currentBadge || 0) != this.yearsDuration(days);
        },
        compareNominationsBadge (currentBadge, actual) {
            return (currentBadge || 0) != actual;
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
                group == 'bn' ? this.badgeUsers[i].bnProfileBadge = u.bnProfileBadge : group == 'nat' ? this.badgeUsers[i].natProfileBadge = u.natProfileBadge : this.badgeUsers[i].nominationsProfileBadge = u.nominationsProfileBadge;
            }
        },

        badgeCommand (osuId, currentBadge, value, type) {
            let command = '';

            if (type == 'bn' || type == 'nat') {
                value = this.yearsDuration(value);
            }

            const natBadges = ['NAT1y.png', 'NAT2y.png', 'NAT3y.png', 'NAT4y.png', 'NAT5y.png', 'NAT6y.png', 'NAT7y.png', 'NAT8y.png', 'NAT9y.png', 'NAT10y.png'];
            const bnBadges = ['BN1y.png', 'BN2y.png', 'BN3y.png', 'BN4y.png', 'BN5y.png', 'BN6y.png', 'BN7y.png', 'BN8y.png', 'BN9y.png', 'BN10y.png'];
            const nomBadges = ['100_noms.png', 'noms200.png', 'noms400.png', 'noms600.png', 'noms800.png', 'noms1000.png'];
            const natTooltip = [
                'Longstanding contribution to the Nomination Assessment Team - 1 Year',
                'Longstanding contribution to the Nomination Assessment Team - 2 Years',
                'Longstanding contribution to the Nomination Assessment Team - 3 Years',
                'Longstanding contribution to the Nomination Assessment Team - 4 Years',
                'Longstanding contribution to the Nomination Assessment Team - 5 Years',
                'Longstanding contribution to the Nomination Assessment Team - 6 Years',
                'Longstanding contribution to the Nomination Assessment Team - 7 Years',
                'Longstanding contribution to the Nomination Assessment Team - 8 Years',
                'Longstanding contribution to the Nomination Assessment Team - 9 Years',
                'Longstanding contribution to the Nomination Assessment Team - 10 Years',
            ];
            const bnTooltip = [
                'Longstanding contribution to the Beatmap Nominators - 1 Year',
                'Longstanding contribution to the Beatmap Nominators - 2 Years',
                'Longstanding contribution to the Beatmap Nominators - 3 Years',
                'Longstanding contribution to the Beatmap Nominators - 4 Years',
                'Longstanding contribution to the Beatmap Nominators - 5 Years',
                'Longstanding contribution to the Beatmap Nominators - 6 Years',
                'Longstanding contribution to the Beatmap Nominators - 7 Years',
                'Longstanding contribution to the Beatmap Nominators - 8 Years',
                'Longstanding contribution to the Beatmap Nominators - 9 Years',
                'Longstanding contribution to the Beatmap Nominators - 10 Years',
            ];
            const nomTooltip = [
                'Nominated 100+ beatmaps as a Beatmap Nominator',
                'Nominated 200+ beatmaps as a Beatmap Nominator',
                'Nominated 400+ beatmaps as a Beatmap Nominator',
                'Nominated 600+ beatmaps as a Beatmap Nominator',
                'Nominated 800+ beatmaps as a Beatmap Nominator',
                'Nominated 1,000+ beatmaps as a Beatmap Nominator',
            ];
            const natWiki = 'https://osu.ppy.sh/wiki/en/People/Nomination_Assessment_Team';
            const bnWiki = 'https://osu.ppy.sh/wiki/en/People/Beatmap_Nominators';
            const nomWiki = 'https://osu.ppy.sh/wiki/en/Beatmap_ranking_procedure#nominations';

            if (type == 'nat') {
                command = `.add-badge ${osuId} ${natBadges[value - 1]} "${natTooltip[value - 1]}" ${natWiki}`;
                (currentBadge >= 1) ? command += ` --replace ${natBadges[currentBadge - 1]}` : '';
            } else if (type == 'bn') {
                command = `.add-badge ${osuId} ${bnBadges[value - 1]} "${bnTooltip[value - 1]}" ${bnWiki}`;
                (currentBadge >= 1) ? command += ` --replace ${bnBadges[currentBadge - 1]}` : '';
            } else if (type == 'nom') {
                command = `.add-badge ${osuId} ${nomBadges[value - 1]} "${nomTooltip[value - 1]}" ${nomWiki}`;
                (currentBadge >= 1) ? command += ` --replace ${nomBadges[currentBadge - 1]}` : '';
            }

            return command;
        },
    },
};
</script>
