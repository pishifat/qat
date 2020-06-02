<template>
    <div>
        <p>
            {{ mediations.length }} "{{ type }}" {{ mediations.length == 1 ? 'vote' : 'votes' }}
            <b>{{ Math.round((mediations.length/totalMediations)*100) || 0 }}%</b>
        </p>

        <ul v-if="isNat">
            <li v-for="mediation in mediations" :key="mediation.id" class="small ml-2">
                {{ mediation.mediator.username }}

                <span v-if="mediation.comment && mediation.comment.length" class="text-secondary pre-line ml-2">
                    {{ mediation.comment }}
                </span>
            </li>
        </ul>
    </div>
</template>

<script>
import { mapState } from 'vuex';
export default {
    name: 'VotesInactiveType',
    props: {
        mediations: {
            type: Array,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        totalMediations: {
            type: Number,
            required: true,
        },
    },
    computed: mapState([
        'isNat',
    ]),
};
</script>