<template>
    <section class="card card-body">
        <input
            id="search"
            v-model="newFilterValue"
            class="form-control"
            type="text"
            autocomplete="off"
            :placeholder="placeholder || ''"
            @change="updateFilterValue(newFilterValue)"
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
import { mapState, mapActions } from 'vuex';

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
        ...mapActions([
            'updateFilterValue',
            'updateFilterMode',
        ]),
    },
};
</script>
