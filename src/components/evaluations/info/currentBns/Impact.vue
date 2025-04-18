<template>
    <div>
        <p class="small">
            <b class="mr-1">Impact level (legacy):</b>
            <span :class="getImpact(impact).color">
                <i v-if="impact !== 0" :class="getImpact(impact).icon" />
                <font-awesome-icon v-else :icon="getImpact(impact).icon" />
                {{ getImpact(impact).text }}
            </span>
            <!--<span class="ml-2 btn-group">
                <button 
                    class="btn btn-sm btn-success"
                    @click.prevent="updateImpact(0)"
                    :disabled="impact === 0"
                >
                    Minor
                </button>
                <button 
                    class="btn btn-sm btn-warning"
                    @click.prevent="updateImpact(1)"
                    :disabled="impact === 1"
                >
                    Notable
                </button>
                <button 
                    class="btn btn-sm btn-danger"
                    @click.prevent="updateImpact(2)"
                    :disabled="impact === 2"
                >
                    Severe
                </button>
            </span>-->
        </p>
    </div>
</template>

<script>
export default {
    name: 'Impact',
    props: {
        impact: {
            type: Number,
        },
        eventId: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
    },
    methods: {
        getImpact(impact) {
            switch (impact) {
                case 2:
                    return { color: 'text-danger', icon: 'fas fa-times-circle', text: 'Severe' };
                case 1:
                    return { color: 'text-warning', icon: 'fas fa-exclamation-circle', text: 'Notable' };
                case 0:
                    return { color: 'text-success', icon: 'fa-solid fa-circle-check', text: 'Minor' };
                default:
                    return { color: 'text-secondary', icon: 'fas fa-question', text: 'Unknown' };
            }
        },
    },
};
</script>
