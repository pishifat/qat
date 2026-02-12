<template>
    <div class="d-inline-flex align-items-center">
        <span 
            v-if="!modesFilter || modesFilter && modesFilter.includes('osu')" 
            data-toggle="tooltip" 
            title="osu!"
        >
            <i
                :class="osuCheck ? 'osu-icon-check' : 'osu-icon'"
                class="mode-icon-select fa-xl mr-1"
                
                @click="osuCheck = !osuCheck, updateSelectedMode('osu')"
            />
        </span>
        <span 
            v-if="!modesFilter || modesFilter && modesFilter.includes('taiko')" 
            data-toggle="tooltip" 
            title="osu!taiko"
        >
            <i
                :class="taikoCheck ? 'taiko-icon-check' : 'taiko-icon'"
                class="mode-icon-select fa-xl mr-1"
                @click="taikoCheck = !taikoCheck, updateSelectedMode('taiko')"
            />
        </span>
        <span 
            v-if="!modesFilter || modesFilter && modesFilter.includes('catch')" 
            data-toggle="tooltip" 
            title="osu!catch"
        >
            <i
                :class="catchCheck ? 'catch-icon-check' : 'catch-icon'"
                class="mode-icon-select fa-xl mr-1"
                @click="catchCheck = !catchCheck, updateSelectedMode('catch')"
            />
        </span>
        <span 
            v-if="!modesFilter || modesFilter && modesFilter.includes('mania')" 
            data-toggle="tooltip" 
            title="osu!mania"
        >
            <i
                :class="maniaCheck ? 'mania-icon-check' : 'mania-icon'"
                class="mode-icon-select fa-xl mr-1"
                @click="maniaCheck = !maniaCheck, updateSelectedMode('mania')"
            />
        </span>
        <span data-toggle="tooltip" title="all modes">
            <i
                v-if="allModes"
                :class="allModesCheck ? 'text-info' : ''"
                class="mode-icon-select fas fa-asterisk mb-2"
                @click="allModesCheck = !allModesCheck, updateSelectedMode('all')"
            />
        </span>
    </div>
</template>

<script>
export default {
    name: 'ModeSelect',
    props: {
        modelValue: {
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
        modesFilter: {
            type: [ String, Array ],
            required: false,
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
                        this.$emit('update:modelValue', this.osuCheck ? singleMode : '');
                        break;
                    case 'taiko':
                        this.allModesCheck = this.osuCheck = this.catchCheck = this.maniaCheck = false;
                        this.$emit('update:modelValue', this.taikoCheck ? singleMode : '');
                        break;
                    case 'catch':
                        this.allModesCheck = this.osuCheck = this.taikoCheck = this.maniaCheck = false;
                        this.$emit('update:modelValue', this.catchCheck ? singleMode : '');
                        break;
                    case 'mania':
                        this.allModesCheck = this.osuCheck = this.taikoCheck = this.catchCheck = false;
                        this.$emit('update:modelValue', this.maniaCheck ? singleMode : '');
                        break;
                    case 'all':
                        this.osuCheck = this.taikoCheck = this.catchCheck = this.maniaCheck = false;
                        this.$emit('update:modelValue', this.allModesCheck ? singleMode : '');
                        break;
                }
            } else {
                const selectedModes = [];

                if (this.osuCheck) selectedModes.push('osu');
                if (this.taikoCheck) selectedModes.push('taiko');
                if (this.catchCheck) selectedModes.push('catch');
                if (this.maniaCheck) selectedModes.push('mania');

                this.$emit('update:modelValue', selectedModes);
            }
        },
    },
};
</script>