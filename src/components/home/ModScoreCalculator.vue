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
                        class="btn btn-sm btn-primary"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="Automatically detect your mod score based on your modding history"
                        @click="autoCalculate"
                    >
                        Auto-calculate
                    </button>
                </div>
            </div>
        </div>

        <div class="form-group">
            <div class="input-group mb-3">
                <input
                    v-model="modsCount[0]"
                    class="modCount form-control"
                    type="number"
                    :placeholder="getPlaceholder(0)"
                >
            </div>
            <div class="input-group mb-3">
                <input
                    v-model="modsCount[1]"
                    class="modCount form-control"
                    type="number"
                    :placeholder="getPlaceholder(1)"
                >
            </div>
            <div class="input-group">
                <input
                    v-model="modsCount[2]"
                    class="modCount form-control"
                    type="number"
                    :placeholder="getPlaceholder(2)"
                >
            </div>
        </div>

        <ul class="small">
            <li>You can either write your username and auto-calculate your score, or manually write your mods count in the boxes above</li>
            <li>A "mod" is counted for each beatmapset through which you have received at least one Kudosu ("thumbs up" on discussion page)</li>
            <li>Scores 0 or higher are passing</li>
            <li>Selecting a different game mode above may impact your mod score (osu! has stricter requirements than taiko/catch/mania)</li>
        </ul>
    </section>
</template>

<script>
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
        };
    },
    watch: {
        modsCount () {
            this.manualCalculate();
        },
        selectedMode () {
            this.manualCalculate();
        },
    },
    methods: {
        getPlaceholder (monthOffset) {
            let to = new Date();
            let from = new Date();
            to.setMonth(to.getMonth() - monthOffset);

            if (monthOffset > 0) {
                from.setMonth(from.getMonth() - monthOffset - 1);
            }

            return `# mods from ${from.toLocaleDateString()} to ${to.toLocaleDateString()}`;
        },
        calculateMonthScore (modCount, modeValue) {
            if (!modCount) modCount = 0;
            modCount = parseInt(modCount);

            return Math.log(1 + modCount) / Math.log(Math.sqrt(1 + modeValue)) - (2 * (1 + modeValue)) / (1 + modCount);
        },
        manualCalculate () {
            let modeValue = this.selectedMode == 'osu' ? 4 : 3;
            let totalScore = this.modsCount.reduce((acc, c) => acc + this.calculateMonthScore(c, modeValue), 0);
            this.info = totalScore.toFixed(2);
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
            const data = await this.executeGet(`/modsCount/${this.user}`, e);

            if (!data.error) {
                this.$set(this.modsCount, 0, data.modCount[0]);
                this.$set(this.modsCount, 1, data.modCount[1]);
                this.$set(this.modsCount, 2, data.modCount[2]);
            }
        },
    },
};
</script>