<template>
    <section class="card card-body">
        <div class="d-flex align-items-center mb-1">
            <h4 class="mb-0">
                Mod score calculator
            </h4>

            <small v-if="info" class="ml-3">
                {{ info }}
            </small>
        </div>

        <div class="form-inline mb-3 justify-content-between">
            <mode-radio-display
                v-model="selectedMode"
                class="form-group"
            />

            <div class="input-group">
                <input
                    v-model="user"
                    class="form-control"
                    type="text"
                    placeholder="username / id"
                    @keyup.enter="autoCalculate"
                >
                <div class="input-group-append">
                    <button
                        :disabled="!loggedInUser"
                        class="btn btn-sm btn-primary"
                        data-toggle="tooltip"
                        data-placement="top"
                        :title="loggedInUser ? 'Automatically detect your mod score based on your modding history' : 'Authorize above to auto-calculate mod score'"
                        @click="autoCalculate"
                    >
                        Auto-calculate
                    </button>
                </div>
            </div>
        </div>

        <div class="form-group">
            <div v-for="index in 3" :key="index" class="input-group mb-3">
                <input
                    v-model="modsCount[index - 1]"
                    class="modCount form-control"
                    type="number"
                    :placeholder="getPlaceholder(index - 1)"
                >
            </div>
        </div>

        <ul class="small">
            <li>"Auto-calculate" will fetch modding activity from a user.</li>
            <li>Manually inputting numbers will let you see mod score for any combination</li>
            <li>A "mod" is counted for each beatmapset through which you receive <a href="https://osu.ppy.sh/wiki/en/Modding/Kudosu" target="_blank">kudosu</a> ("thumbs up" on discussion page).</li>
            <li>Date for a mod is determined by the latest kudosu received</li>
            <li>Selecting a different game mode above may impact your mod score (osu! has stricter requirements than taiko/catch/mania)</li>
            <li>Scores 0 or higher are passing</li>
        </ul>
    </section>
</template>

<script>
import { mapState } from 'vuex';
import postData from '../../mixins/postData';
import ModeRadioDisplay from '../ModeRadioDisplay.vue';

export default {
    name: 'ModScoreCalculator',
    components: {
        ModeRadioDisplay,
    },
    mixins: [ postData ],
    data () {
        return {
            selectedMode: 'osu',
            modsCount: [null, null, null],
            user: '',
            info: '',
            months: 3,
        };
    },
    computed: mapState([
        'loggedInUser',
    ]),
    watch: {
        modsCount () {
            this.calculateTotalScore();
        },
        selectedMode () {
            this.calculateTotalScore();
        },
    },
    methods: {
        getPlaceholder (monthOffset) {
            const from = this.$moment.utc().subtract(monthOffset + 1, 'month');
            const to = this.$moment.utc().subtract(monthOffset, 'month');

            return `# mods from ${from.format('MM-DD-YYYY')} to ${to.format('MM-DD-YYYY')}`;
        },
        calculateMonthScore (modCount, modeValue) {
            if (!modCount) modCount = 0;
            modCount = parseInt(modCount);

            return Math.log(1 + modCount) / Math.log(Math.sqrt(1 + modeValue)) - (2 * (1 + modeValue)) / (1 + modCount);
        },
        calculateTotalScore () {
            let modeValue = this.selectedMode == 'osu' ? 4 : 3;
            let totalScore = this.modsCount.reduce((acc, c) => {
                if (!c && c !== 0) return acc;

                return acc + this.calculateMonthScore(c, modeValue);
            }, 0);
            this.info = totalScore.toFixed(2);
            this.info += this.months !== 3 ? ` (Only the last ${this.months} ${this.months == 1 ? 'month is' : 'months are'} considered because of your previous BN experience!)` : '';
            this.months = 3; // Reset so message disappears after an edit
        },
        async autoCalculate (e) {
            if (!this.user) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Must enter username or osu ID!`,
                    type: 'danger',
                });

                return;
            }

            this.info = 'Retrieving info... (this will take a few seconds)';
            const data = await this.executeGet(`/modsCount/${this.user}/${this.selectedMode}`, e);

            if (!data.error) {
                this.$set(this.modsCount, 0, data.modCount[0]);
                this.$set(this.modsCount, 1, data.modCount[1]);
                this.$set(this.modsCount, 2, data.modCount[2]);
                this.months = data.months;
            }
        },
    },
};
</script>
