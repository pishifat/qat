<template>
    <section class="card card-body">
        <div
            class="filter-image-search-region"
            @mouseenter="onSearchRegionEnter"
            @mouseleave="onSearchRegionLeave"
            @focusin="onSearchRegionEnter"
            @focusout="onSearchRegionFocusOut"
        >
            <div class="input-group">
                <input
                    id="search"
                    class="form-control"
                    type="text"
                    autocomplete="off"
                    :placeholder="placeholder || ''"
                    :value="filters.value"
                    @change="updateFilterValue($event.target.value)"
                >
                <button class="btn btn-sm btn-primary px-3 h-75 mt-1">
                    <i class="fas fa-search" />
                </button>
            </div>

            <image-dropzone
                v-if="enableImageSearch"
                class="mt-2"
                variant="compact"
                enable-paste
                clearable
                allow-any-image
                :paste-armed="imageSearchPasteArmed"
                active-label="Image search active"
                empty-text="Paste or drop an image here to search by similarity"
                :model-value="imageSearchFile"
                @update:model-value="setImageSearchFile"
            />
        </div>

        <div class="input-group">
            <select
                v-if="modes && modes.length"
                id="mode"
                class="form-select mt-2 ms-1"
                @change="updateFilterMode(modes[$event.target.selectedIndex])"
            >
                <option
                    v-for="mode in modes"
                    :key="mode"
                    :value="mode"
                    :selected="mode === filters.mode"
                >
                    {{ mode === '' ? 'All modes' : formatOption(mode) }}
                </option>
            </select>
        </div>

        <div class="input-group">
            <select
                v-if="groups && groups.length"
                id="group"
                class="form-select ms-1 my-2"
                @change="updateFilterGroup(groups[$event.target.selectedIndex])"
            >
                <option
                    v-for="group in groups"
                    :key="group"
                    :value="group"
                    :selected="group === filters.group"
                >
                    {{ group === '' ? 'All groups' : formatOption(group) }}
                </option>
            </select>
        </div>

        <slot />
    </section>
</template>

<script>
import ImageDropzone from './ImageDropzone.vue';

export default {
    components: {
        ImageDropzone,
    },
    props: {
        placeholder: {
            type: String,
            required: true,
        },
        modes: {
            type: Array,
            default() {
                return [];
            },
        },
        groups: {
            type: Array,
            default() {
                return [];
            },
        },
        storeModule: {
            type: String,
            required: true,
        },
        enableImageSearch: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            imageSearchPasteArmed: false,
        };
    },
    computed: {
        /** @returns {string[]} */
        filters () {
            return this.$store.state[this.storeModule].pageFilters.filters;
        },
        imageSearchFile() {
            if (!this.enableImageSearch) return null;
            return this.$store.state[this.storeModule]?.imageSearchFile || null;
        },
    },
    methods: {
        onSearchRegionEnter() {
            if (this.enableImageSearch) {
                this.imageSearchPasteArmed = true;
            }
        },
        onSearchRegionLeave() {
            this.imageSearchPasteArmed = false;
        },
        onSearchRegionFocusOut(event) {
            if (!event.currentTarget.contains(event.relatedTarget)) {
                this.imageSearchPasteArmed = false;
            }
        },
        updateFilterValue (value) {
            if (value) {
                this.$store.commit(`${this.storeModule}/clearImageSearch`);
            }
            this.$store.commit(this.storeModule + '/pageFilters/setFilterValue', value);
        },
        updateFilterMode (mode) {
            this.$store.commit(this.storeModule + '/pageFilters/setFilterMode', mode);
        },
        updateFilterGroup (group) {
            this.$store.commit(this.storeModule + '/pageFilters/setFilterGroup', group);
        },
        formatOption (option) {
            switch (option) {
                case 'osu':
                    return 'osu!';
                case 'taiko':
                    return 'osu!taiko';
                case 'catch':
                    return 'osu!catch';
                case 'mania':
                    return 'osu!mania';
                case 'bn':
                    return 'BN';
                case 'nat':
                    return 'NAT';
                case 'gmt':
                    return 'GMT';
                default:
                    return option;
            }
        },
        setImageSearchFile(file) {
            if (!file) {
                this.$store.commit(`${this.storeModule}/clearImageSearch`);
                return;
            }

            this.$store.commit(`${this.storeModule}/pageFilters/setFilterValue`, '');
            this.$store.commit(`${this.storeModule}/setImageSearchFile`, file);
        },
    },
};
</script>
