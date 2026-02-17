<template>
    <div class="row">
        <div v-if="bnHistory.length" class="col-sm-6">
            <p class="mb-2">
                <b>BN:</b> {{ calculateDuration('bn') }}
            </p>

            <ul class="text-secondary">
                <li v-for="history in sortedBnHistory" :key="history.date" class="small">
                    {{ toStandardDate(history.date) }}: {{ history.kind }}
                    <mode-display
                        :modes="history.mode"
                        data-toggle="tooltip"
                        data-placement="top"
                        :title="formatMode(history.mode)"
                    />
                    <a
                        v-if="history.relatedEvaluation && isEligibleToViewEvals"
                        :href="`/${loggedInUser.isNat ? 'evalarchive' : 'yourevals'}?id=${history.relatedEvaluation}`"
                        target="_blank"
                    >
                        (eval)
                    </a>
                </li>
                <li
                    v-if="additional"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="time is added for the user's BN badge, but not included in tenure above"
                    class="small"
                >
                    {{ additional }} as NAT while meeting BN activity requirements
                </li>
            </ul>
        </div>
        <div v-if="natHistory.length" class="col-sm-6">
            <p class="mb-2">
                <b>NAT:</b> {{ calculateDuration('nat') }}
            </p>

            <ul class="text-secondary">
                <li v-for="history in sortedNatHistory" :key="history.date" class="small">
                    {{ toStandardDate(history.date) }}: {{ history.kind }}
                    <mode-display
                        :modes="history.mode"
                        data-toggle="tooltip"
                        data-placement="top"
                        :title="formatMode(history.mode)"
                    />
                    <a
                        v-if="history.relatedEvaluation && isEligibleToViewEvals"
                        :href="`/${loggedInUser.isNat ? 'evalarchive' : 'yourevals'}?id=${history.relatedEvaluation}`"
                        target="_blank"
                    >
                        (eval)
                    </a>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import duration from '../../../mixins/duration.js';
import ModeDisplay from '../../ModeDisplay.vue';

export default {
    name: 'Duration',
    components: {
        ModeDisplay,
    },
    mixins: [ duration ],
    data () {
        return {
            additional: null,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('users', [
            'selectedUser',
        ]),
        sortedBnHistory () {
            return [...this.bnHistory].sort((a, b) => {
                if (a.date > b.date) return 1;
                if (a.date < b.date) return -1;

                return 0;
            });
        },
        sortedNatHistory () {
            return [...this.natHistory].sort((a, b) => {
                if (a.date > b.date) return 1;
                if (a.date < b.date) return -1;

                return 0;
            });
        },
        isEligibleToViewEvals () {
            if (!this.loggedInUser) return false;

            return this.loggedInUser.isNat || this.loggedInUser.id === this.selectedUser.id;
        },
    },
    watch: {
        selectedUser() {
            this.additional = null;
            this.findAdditionalBnMonths();
        },
    },
    created () {
        this.findAdditionalBnMonths();
    },
    methods: {
        async findAdditionalBnMonths() {
            const months = await this.$http.executePost(`/users/${this.selectedUser.id}/findAdditionalBnMonths`, {});

            if (this.$http.isValid(months)) {
                if (months == 0 || !months) {
                    this.additional = null;
                } else {
                    let years = Math.floor(months / 12);
                    let remainingMonths = Math.round(months % 12);

                    let additional = '';

                    if (years) {
                        additional += `${years} year${years > 1 ? 's' : ''}`;
                    }

                    if (years && remainingMonths) {
                        additional += ' and ';
                    }

                    if (remainingMonths) {
                        additional += `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
                    }

                    this.additional = additional;
                }
            }
        },
    },
};
</script>