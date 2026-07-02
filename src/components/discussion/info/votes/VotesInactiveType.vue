<template>
    <div>
        <div v-if="!onlyWrittenInput">
            {{ mediations.length }} "{{ type }}" {{ mediations.length == 1 ? 'vote' : 'votes' }}
            <div class="fw-bold small">
                GMT/NAT: {{ Math.round((natGmtMediations.length/totalNatGmtMediations)*1000) / 10 || 0 }}%
            </div>
            <div class="fw-bold small">
                BN: {{ Math.round((bnMediations.length/totalBnMediations)*1000) / 10 || 0 }}%
            </div>
            <div class="fw-bold small">
                Total: {{ Math.round(((bnMediations.length + natGmtMediations.length)/(totalBnMediations + totalNatGmtMediations))*1000) / 10 || 0 }}%
            </div>
        </div>

        <ul v-if="loggedInUser.hasBasicAccess">
            <li v-for="mediation in mediations" :key="mediation.id" class="small ms-2">
                <span v-if="loggedInUser.hasFullReadAccess && mediation.mediator">
                    <user-link
                        :username="mediation.mediator.username"
                        :osu-id="mediation.mediator.osuId"
                    />
                </span>
                <span v-else>
                    <span>{{ anonLabel(mediation.mediator) }}</span>
                </span>

                <span
                    v-if="mediation.comment && mediation.comment.length"
                    class="text-secondary pre-wrap ms-2"
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
            default: 'Neutral',
        },
        totalBnMediations: {
            type: Number,
            default: 1,
        },
        totalNatGmtMediations: {
            type: Number,
            default: 1,
        },
        showAll: Boolean,
        onlyWrittenInput: Boolean,
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
    methods: {
        anonLabel(mediator) {
            const groups = mediator?.groups || [];
            if (groups.includes('gmt')) return 'Anon GMT';
            if (groups.includes('nat')) return 'Anon NAT';
            if (groups.includes('bn')) return 'Anon BN';
            return 'Anon user (ex-GMT/NAT/BN)';
        },
    },
};
</script>