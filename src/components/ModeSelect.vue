<template>
    <div class="d-inline-flex align-items-center">
        <i
            :class="osuCheck ? 'osu-icon-check' : 'osu-icon'"
            class="mode-icon-select fa-xl mr-1"
            @click="osuCheck = !osuCheck, updateSelectedMode('osu')"
        />
        <i
            :class="taikoCheck ? 'taiko-icon-check' : 'taiko-icon'"
            class="mode-icon-select fa-xl mr-1"
            @click="taikoCheck = !taikoCheck, updateSelectedMode('taiko')"
        />
        <i
            :class="catchCheck ? 'catch-icon-check' : 'catch-icon'"
            class="mode-icon-select fa-xl mr-1"
            @click="catchCheck = !catchCheck, updateSelectedMode('catch')"
        />
        <i
            :class="maniaCheck ? 'mania-icon-check' : 'mania-icon'"
            class="mode-icon-select fa-xl mr-1"
            @click="maniaCheck = !maniaCheck, updateSelectedMode('mania')"
        />
        <b
            v-if="allModes"
            :class="allModesCheck ? 'text-info' : ''"
            class="mode-icon-select"
            @click="allModesCheck = !allModesCheck, updateSelectedMode('all')"
        >
            all modes
        </b>
    </div>
</template>

<script>
export default {
    name: 'ModeSelect',
    model: {
        prop: 'selectedMode',
        event: 'change',
    },
    props: {
        selectedMode: {
            type: [ String, Array ],
            required: true,
        },
        maxSelection: {
            type: Number,
            required: true,
        },
        allModes: {
            type: Boolean,
            default: false,
        },
    },
    data () {
        return {
            osuCheck: false,
            taikoCheck: false,
            catchCheck: false,
            maniaCheck: false,
            allModesCheck: false,
        };
    },
    methods: {
        updateSelectedMode (singleMode) {
            if (this.maxSelection == 1) {
                switch (singleMode) {
                    case 'osu':
                        this.allModesCheck = this.taikoCheck = this.catchCheck = this.maniaCheck = false;
                        this.$emit('change', this.osuCheck ? singleMode : '');
                        break;
                    case 'taiko':
                        this.allModesCheck = this.osuCheck = this.catchCheck = this.maniaCheck = false;
                        this.$emit('change', this.taikoCheck ? singleMode : '');
                        break;
                    case 'catch':
                        this.allModesCheck = this.osuCheck = this.taikoCheck = this.maniaCheck = false;
                        this.$emit('change', this.catchCheck ? singleMode : '');
                        break;
                    case 'mania':
                        this.allModesCheck = this.osuCheck = this.taikoCheck = this.catchCheck = false;
                        this.$emit('change', this.maniaCheck ? singleMode : '');
                        break;
                    case 'all':
                        this.osuCheck = this.taikoCheck = this.catchCheck = this.maniaCheck = false;
                        this.$emit('change', this.allModesCheck ? singleMode : '');
                        break;
                }
            } else {
                const selectedModes = [];

                if (this.osuCheck) selectedModes.push('osu');
                if (this.taikoCheck) selectedModes.push('taiko');
                if (this.catchCheck) selectedModes.push('catch');
                if (this.maniaCheck) selectedModes.push('mania');

                this.$emit('change', selectedModes);
            }
        },
    },
};
</script>