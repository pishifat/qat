<template>
    <span>
        <i v-if="modes.includes('osu')" class="osu-icon" />
        <i v-if="modes.includes('taiko')" class="taiko-icon" />
        <i v-if="modes.includes('catch')" class="catch-icon" />
        <i v-if="modes.includes('mania')" class="mania-icon" />
        <span v-if="showAll && (!modes || modes.includes('all'))">
            <i class="osu-icon" />
            <i class="taiko-icon" />
            <i class="catch-icon" />
            <i class="mania-icon" />
        </span>
    </span>
</template>

<script>
export default {
    name: 'ModeDisplay',
    props: {
        modes: {
            type: [Array, String],
            required: true,
        },
        showAll: Boolean,
    },
};
</script>