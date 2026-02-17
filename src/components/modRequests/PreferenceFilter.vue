<template>
    <div class="col-sm-3 mb-4">
        <h6>{{ title }}</h6>
        <div>
            <div v-for="value in filteredValues" :key="value">
                <i
                    class="fa-check-circle fake-checkbox"
                    :class="[included.includes(value) ? 'text-success fas' : 'far']"
                    @click="$store.commit('modRequests/updateIncluded', value);"
                />
                <label
                    class="form-check-label text-secondary"
                >
                    {{ value }}
                </label>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
    name: 'PreferenceFilter',
    components: {
    },
    props: {
        title: {
            type: String,
            required: true,
        },
        values: {
            type: Array,
            required: true,
        },
    },
    computed: {
        ...mapState('modRequests', [
            'included',
        ]),
        filteredValues() {
            return this.values.filter(v => v !== 'other');
        },
    },
};
</script>

<style scoped>
.fake-checkbox:hover {
    cursor: pointer;
    color: lightblue;
    opacity: 0.7;
}
</style>