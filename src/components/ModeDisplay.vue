<template>
    <span>
        <i v-if="modes.includes('osu')" class="far fa-circle" />
        <i v-if="modes.includes('taiko')" class="fas fa-drum" />
        <i v-if="modes.includes('catch')" class="fas fa-apple-alt" />
        <i v-if="modes.includes('mania')" class="fas fa-stream" />
        <span v-if="showAll && (!modes || modes.includes('all'))">
            <i class="far fa-circle" />
            <i class="fas fa-drum" />
            <i class="fas fa-apple-alt" />
            <i class="fas fa-stream" />
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
