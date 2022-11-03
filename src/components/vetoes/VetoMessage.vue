<template>
    <div class="card card-body">
        <h4 class="text-center">
            Veto mediation
        </h4>
        <h5 class="text-center">
            <a :href="'https://osu.ppy.sh/beatmapsets/' + veto.beatmapId" target="_blank">
                {{ veto.beatmapTitle }}
            </a>
            by
            <user-link
                :osu-id="veto.beatmapMapperId"
                :username="veto.beatmapMapper"
            />
        </h5>

        <h5 v-if="veto.status !== 'archive'" class="text-center">
            <a :href="'/vetoes?id=' + veto.id">View mediation here</a>
        </h5>

        <div v-if="veto.status !== 'archive'">
            <h5>Mediation info</h5>
            <div class="card card-body small mb-4">
                <p>Hello! You've been selected to mediate the veto above.</p>
                <div>The map is currently vetoed for the following reason{{ veto.reasons.length > 1 ? 's' : '' }}:</div>
                <div>
                    <ul>
                        <li v-for="reason in veto.reasons" :key="reason">
                            <a :href="reason.link" target="_blank">{{ reason.summary }}</a>
                        </li>
                    </ul>
                </div>
                <hr>
                <p><b>Please post your opinion on the veto <a :href="'/vetoes?id=' + veto.id">here</a> within one week.</b></p>
                <div>Your decision will be anonymous to everyone but members of the NAT.</div>
                <p>If you have a reason not to participate in veto mediations, contact a NAT member.</p>
                <div>Thank you!</div>
            </div>
        </div>

        <div v-else>
            <div v-for="(reason, i) in veto.reasons" :key="i">
                <veto-part-summary
                    :veto="veto"
                    :reason-index="i"
                />
            </div>
            <div class="card card-body small mb-4">
                <span>Users involved in this veto's mediation: </span>

                <ul>
                    <li v-for="user in users" :key="user.osuId">
                        <user-link
                            :class="user.groups.includes('nat') ? 'text-nat' : user.groups.includes('bn') ? 'text-probation' : ''"
                            :osu-id="user.osuId"
                            :username="user.username"
                        />
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
import UserLink from '../UserLink.vue';
import VetoPartSummary from './VetoPartSummary.vue';

export default {
    name: 'VetoMessage',
    components: {
        UserLink,
        VetoPartSummary
    },
    data () {
        return {
            users: null,
        };
    },
    props: {
        veto: {
            type: Object,
            required: true,
        },
    },
    async created() {
        if (this.veto.status == 'archive') {
            this.users = await this.$http.executeGet(
                `/message/vetoMediators/${this.veto.id}`
            );
        }
    },
};
</script>
