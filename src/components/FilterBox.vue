<template>
    <section class="row segment my-1 mx-4">
        <div class="small filter-box">
            <span class="filter-header">Search</span>
            <input
                id="search"
                class="ml-2"
                type="text"
                autocomplete="off"
                :placeholder="placeholder || ''"
                @input="$emit('update:filterValue', $event.target.value)"
            >
            <select id="mode" class="custom-select ml-2" @change="$emit('update:filterMode', options[$event.target.selectedIndex])">
                <option
                    v-for="option in options"
                    :key="option"
                    :value="option"
                    :selected="option === filterMode"
                >
                    {{ option === '' ? 'All modes' : option }}
                </option>
            </select>
            <slot />
        </div>
    </section>
</template>

<script>
export default {
    props: {
        filterMode: String,
        filterValue: String,
        placeholder: String,
        options: Array,
    },
};
</script>
