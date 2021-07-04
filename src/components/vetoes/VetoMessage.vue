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

        <h5 class="text-center">
            <a :href="'/vetoes?id=' + veto.id">View mediation here</a>
        </h5>

        <div>
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
                <div v-if="veto.reasons.length > 1">
                    <p>Explain your reasoning for each issue separately.</p>

                    <div>For example:</div>
                    <ul>
                        <li>Agree with concern (1) because...</li>
                        <li>Disagree with concern (2) because...</li>
                        <li>Neutral with concern (3) because...</li>
                    </ul>

                    <p>We will count your votes for each topic separately so the veto can be upheld for an one topic and dismissed for others. Your overall vote should be based on the sum of individual votes. For example if you agree with 1 and 2 but not 3, you'd vote "Agree". This leaves your overall vote as a general impression while focus remains on the specific issues.</p>
                </div>
                <hr>
                <p><b>Please post your opinion on the veto <a :href="'/vetoes?id=' + veto.id">here</a> within one week.</b></p>
                <div>Your decision will be anonymous to everyone but members of the NAT.</div>
                <p>If you have a reason not to participate in veto mediations, reply to the osu! chat message you received.</p>
                <div>Thank you!</div>
            </div>
        </div>
    </div>
</template>

<script>
import UserLink from '../UserLink.vue';

export default {
    name: 'VetoMessage',
    components: {
        UserLink,
    },
    props: {
        veto: {
            type: Object,
            required: true,
        },
    },
    computed: {

    },
};
</script>
