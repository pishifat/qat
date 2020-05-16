<template>
    <section class="row segment my-1 mx-4">
        <div class="small filter-box">
            <span class="filter-header">Search</span>
            <input
                id="search"
                v-model="newFilterValue"
                class="ml-2"
                type="text"
                autocomplete="off"
                :placeholder="placeholder || ''"
                @change="updateFilterValue(newFilterValue)"
            >
            <select
                id="mode"
                class="custom-select ml-2"
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
        </div>
    </section>
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex';

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
    },
    data () {
        return {
            newFilterValue: '',
        };
    },
    computed: mapState([
        'filters',
    ]),
    methods: {
        ...mapMutations([
            'setFilterValue',
            'setFilterMode',
        ]),
        ...mapActions([
            'updateFilterValue',
            'updateFilterMode',
        ]),
    },
};
</script>
