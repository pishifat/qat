<template>
    <section class="row segment my-1 mx-4">
        <div class="small filter-box">
            <span class="filter-header">Search</span>
            <input 
                id="search" 
                class="ml-2" 
                @input="$emit('update:filterValue', $event.target.value)" 
                type="text" 
                autocomplete="off"
                :placeholder="placeholder || ''" 
            />
            <select class="custom-select ml-2" id="mode" @change="$emit('update:filterMode', options[$event.target.selectedIndex])">
                <option 
                    v-for="option in options" 
                    :key="option" :value="option"
                    :selected="option == filterMode"
                >
                    {{ option == '' ? 'All modes' : option }}
                </option>
            </select>
            <slot></slot>
        </div>
    </section>
</template>

<script>
export default {
    props: ['filter-mode', 'filter-value', 'placeholder'],
    data () {
        return {
            options: ['', 'osu', 'taiko', 'catch', 'mania'],
        }
    },
}
</script>
