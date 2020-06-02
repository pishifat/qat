<template>
    <application-card
        target="#applicationIndividualInfo"
        :application="application"
        :is-discuss="false"
        :is-application="true"
        :all-checked="allChecked"
        @select-application="selectApplication()"
    />
</template>

<script>
import ApplicationCard from './ApplicationCard.vue';

export default {
    name: 'ApplicationIndividualCard',
    components: {
        ApplicationCard,
    },
    props: {
        application: {
            type: Object,
            required: true,
        },
        allChecked: Boolean,
    },
    methods: {
        selectApplication() {
            this.$store.commit('setSelectedIndividualApplicationId', this.application.id);
        },
    },
};
</script>
