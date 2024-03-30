<template>
    <div>
        <p>
            <b class="mr-1">Impact level:</b>
            <span v-if="impact === undefined" class="text-secondary">
                <i class="fas fa-question"></i> Unknown
            </span>
            <span v-else-if="impact" class="text-warning">
                <i class="fas fa-exclamation-triangle"></i> Notable
            </span>
            <span v-else class="text-success">
                <font-awesome-icon icon="fa-solid fa-circle-check" class="text-success"/>
                Minor
            </span>
            <span class="ml-2 btn-group">
                <button 
                    class="btn btn-sm btn-warning"
                    @click.prevent="updateImpact(1)"
                    :disabled="impact === 1"
                >
                    Notable
                </button>
                <button 
                    class="btn btn-sm btn-success"
                    @click.prevent="updateImpact(0)"
                    :disabled="impact === 0"
                >
                    Minor
                </button>
            </span>
        </p>
    </div>
</template>

<script>
export default {
    name: 'Impact',
    props: {
        impact: {
            type: Boolean,
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
        async updateImpact(impact) {
            let data = await this.$http.executePost('/dataCollection/updateImpact/' + this.eventId, { impact });

            if (this.$http.isValid(data)) {
                this.$store.commit('dataCollection/updateEvent', {
                    id: this.eventId,
                    type: this.type,
                    modifiedField: 'impact',
                    value: data.impact,
                });
            }
        },
    },
};
</script>
