<template>
    <section class="card card-body">
        <div class="input-group">
            <input
                id="search"
                class="form-control"
                type="text"
                autocomplete="off"
                :placeholder="placeholder || ''"
                @change="updateFilterValue($event.target.value)"
            >
            <div class="input-group-append">
                <button class="btn btn-sm btn-primary px-3">
                    <i class="fas fa-search" />
                </button>
            </div>
        </div>

        <select
            v-if="modes && modes.length"
            id="mode"
            class="form-control"
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

        <select
            v-if="groups && groups.length"
            id="group"
            class="form-control"
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

        <slot />
    </section>
</template>

<script>
export default {
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
    },
    computed: {
        /** @returns {string[]} */
        filters () {
            return this.$store.state[this.storeModule].pageFilters.filters;
        },
    },
    methods: {
        updateFilterValue (value) {
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
    },
};
</script>
