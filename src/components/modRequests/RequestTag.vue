<template>
    <span class="badge badge-pill my-1 mx-1 text-capitalize" :class="classList">
        <slot />
    </span>
</template>

<script>
export default {
    name: 'RequestTag',
    props: {
        classList: {
            type: String,
            default: 'badge-info',
        },
    },
};
</script>
