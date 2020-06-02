<template>
    <application-card
        :target="isArchive ? '#applicationArchiveInfo' : '#applicationDiscussionInfo'"
        :application="application"
        :is-discuss="true"
        :is-application="true"
        :is-archive="isArchive"
        :all-checked="allChecked"
        @select-application="selectApplication()"
    />
</template>

<script>
import ApplicationCard from './ApplicationCard.vue';

export default {
    name: 'ApplicationDiscussionCard',
    components: {
        ApplicationCard,
    },
    props: {
        application: {
            type: Object,
            required: true,
        },
        allChecked: Boolean,
        isArchive: Boolean,
    },
    methods: {
        selectApplication() {
            this.$store.commit('setSelectedDiscussApplicationId', this.application.id);
        },
    },
};
</script>
