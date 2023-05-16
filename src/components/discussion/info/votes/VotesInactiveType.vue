<template>
    <div>
        <div>
            {{ mediations.length }} "{{ type }}" {{ mediations.length == 1 ? 'vote' : 'votes' }}
            <div class="font-weight-bold small">
                GMT/NAT: {{ Math.round((natGmtMediations.length/totalNatGmtMediations)*1000) / 10 || 0 }}%
            </div>
            <div class="font-weight-bold small">
                BN: {{ Math.round((bnMediations.length/totalBnMediations)*1000) / 10 || 0 }}%
            </div>
            <div class="font-weight-bold small">
                Total: {{ Math.round(((bnMediations.length + natGmtMediations.length)/(totalBnMediations + totalNatGmtMediations))*1000) / 10 || 0 }}%
            </div>
        </div>

        <ul v-if="loggedInUser.hasBasicAccess">
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
        bnMediations: {
            type: Array,
            required: true,
        },
        natGmtMediations: {
            type: Array,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        totalBnMediations: {
            type: Number,
            required: true,
        },
        totalNatGmtMediations: {
            type: Number,
            required: true,
        },
        showAll: Boolean,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        mediations() {
            if (this.showAll) return this.bnMediations.concat(this.natGmtMediations);
            else return this.natGmtMediations;
        },
    },
};
</script>