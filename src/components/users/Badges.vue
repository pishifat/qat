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

        <div v-if="loading">
            this will take a few minutes because an api call required for every user (and there are lots of users)
        </div>
        
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
                            Nominations: {{ user.actualNominationsProfileBadge*200 }} -- badge: {{ user.nominationsProfileBadge*200 }}
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
                            Nominations: {{ user.actualNominationsProfileBadge*200 }} -- badge: {{ user.nominationsProfileBadge*200 }}
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
            loading: false,
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
                this.loading = true;
                users = await this.$http.executeGet('/users/nat/findUserBadgeInfo/false', e);
                this.loading = false;

                if (users) {
                    this.badgeUsers = users.filter(user =>
                        (this.yearsDuration(user.bnDuration) >= 1) || (this.yearsDuration(user.natDuration) >= 1 || user.actualNominationsProfileBadge >= 1)
                    );
                }
            }
        },
        compareBadgeDuration (currentBadge, days) {
            if ((this.yearsDuration(days) > 5) && (currentBadge === 5)) return false; // remove this line when +5 year badges are added
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

            const natBadges = ['QAT1y.png', 'QAT2y.png', 'QAT3y.jpg', 'QAT4y.jpg', 'QAT5y.jpg'];
            const bnBadges = ['BN1y.png', 'BN2y.jpg', 'BN3y.jpg', 'BN4y.jpg', 'BN5y.jpg'];
            const nomBadges = ['noms200.png', 'noms400.png', 'noms600.png', 'noms800.png', 'noms1000.png'];
            const natTooltip = [
                'Longstanding contribution to the Nomination Assessment Team - 1 Year',
                'Longstanding contribution to the Nomination Assessment Team - 2 Years',
                'Longstanding contribution to the Nomination Assessment Team - 3 Years',
                'Longstanding contribution to the Nomination Assessment Team - 4 Years',
                'Longstanding contribution to the Nomination Assessment Team - 5 Years',
            ];
            const bnTooltip = [
                'Longstanding contribution to the Beatmap Nominators - 1 Year',
                'Longstanding contribution to the Beatmap Nominators - 2 Years',
                'Longstanding contribution to the Beatmap Nominators - 3 Years',
                'Longstanding contribution to the Beatmap Nominators - 4 Years',
                'Longstanding contribution to the Beatmap Nominators - 5 Years',
            ];
            const nomTooltip = [
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
