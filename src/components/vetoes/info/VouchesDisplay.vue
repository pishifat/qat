<template>
    <div v-if="loggedInUser && loggedInUser.isNat" class="text-secondary small mt-3">
        <div><b>NAT-only information</b></div>
        <ul>
            <li>
                Mapper:
                <user-link
                    :username="selectedVeto.beatmapMapper"
                    :osu-id="selectedVeto.beatmapMapperId"
                />
            </li>
            <li>
                Vetoer:
                <user-link
                    :username="selectedVeto.vetoer.username"
                    :osu-id="selectedVeto.vetoer.osuId"
                />
            </li>
            <li>
                Vouching users:
                <ul>
                    <li v-if="!selectedVeto.vouchingUsers || !selectedVeto.vouchingUsers.length">
                        None
                    </li>
                    <li v-for="user in selectedVeto.vouchingUsers" :key="user.id">
                        <user-link
                            :username="user.username"
                            :osu-id="user.osuId"
                        />
                    </li>
                </ul>
            </li>
        </ul>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import UserLink from '../../UserLink.vue';
export default {
    name: 'VouchesDisplay',
    components: {
        UserLink,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('vetoes', [
            'selectedVeto',
        ]),
    },
};
</script>
