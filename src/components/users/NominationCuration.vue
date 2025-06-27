<template>
    <div>
        <!--<events-list
            v-if="events.length"
            :events="events"
            :events-id="'favoriteNominations'"
            :header="'Your Ranked nominations'"
            :osu-id="loggedInUser.osuId"
            :is-evaluation="false"
        />-->
    </div>
</template>

<script>
import { mapState } from 'vuex';
import EventsList from '../evaluations/info/currentBns/userActivity/EventsList.vue';

export default {
    name: 'NominationCuration',
    components: {
        EventsList,
    },
    data() {
        return {
            events: [],
            loading: false,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
    mounted() {
        this.loadRankedNominations();
    },
    watch: {
        loggedInUser() {
            this.loadRankedNominations();
        },
    },
    methods: {
        async loadRankedNominations() {
            if (!this.loggedInUser) {
                this.events = [];
                return;
            }

            this.loading = true;
            
            try {
                const response = await this.$http.executeGet(`/users/${this.loggedInUser.id}/rankedNominations`);
                
                if (response.error) {
                    console.error('Error loading ranked nominations:', response.error);
                    this.events = [];
                } else {
                    this.events = response.events || [];
                }
            } catch (error) {
                console.error('Failed to load ranked nominations:', error);
                this.events = [];
            } finally {
                this.loading = false;
            }
        },
    },
};
</script>