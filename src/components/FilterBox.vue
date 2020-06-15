<template>
    <section class="card card-body">
        <input
            id="search"
            class="form-control"
            type="text"
            autocomplete="off"
            :placeholder="placeholder || ''"
            @change="updateFilterValue($event.target.value)"
        >

        <select
            id="mode"
            class="form-control"
            @change="updateFilterMode(options[$event.target.selectedIndex])"
        >
            <option
                v-for="option in options"
                :key="option"
                :value="option"
                :selected="option === filters.mode"
            >
                {{ option === '' ? 'All modes' : option }}
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
        options: {
            type: Array,
            required: true,
        },
        storeModule: {
            type: String,
            required: true,
        },
    },
    computed: {
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
    },
};
</script>
