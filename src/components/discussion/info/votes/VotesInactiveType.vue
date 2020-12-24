<template>
    <div>
        <p>
            {{ mediations.length }} "{{ type }}" {{ mediations.length == 1 ? 'vote' : 'votes' }}
            <b>{{ Math.round((mediations.length/totalMediations)*100) || 0 }}%</b>
        </p>

        <ul>
            <li v-for="mediation in mediations" :key="mediation.id" class="small ml-2">
                <span v-if="loggedInUser.hasFullReadAccess">
                    <user-link
                        :username="mediation.mediator.username"
                        :osu-id="mediation.mediator.osuId"
                    />
                </span>
                <span v-else>
                    <span>{{ mediation.mediator.groups.includes('gmt') ? 'Anon GMT' : mediation.mediator.groups.includes('nat') ? 'Anon NAT' : mediation.mediator.groups.includes('bn') ? 'Anon BN' : 'Anon user (ex-GMT/NAT/BN)' }}</span>
                </span>

                <span
                    v-if="mediation.comment && mediation.comment.length"
                    class="text-secondary pre-wrap ml-2"
                    v-html="$md.render(mediation.comment)"
                />
            </li>
        </ul>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import UserLink from '../../../UserLink.vue';

export default {
    name: 'VotesInactiveType',
    components: {
        UserLink,
    },
    props: {
        mediations: {
            type: Array,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        totalMediations: {
            type: Number,
            required: true,
        },
    },
    computed: mapState([
        'loggedInUser',
    ]),
};
</script>