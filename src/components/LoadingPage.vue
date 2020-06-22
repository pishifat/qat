<template>
    <div>
        <div
            v-if="isLoading"
            class="loading-container"
        >
            <!-- <img
                src="/images/rip.svg"
                style="max-height: 160px"
            > -->
            <div
                class="spinner-border"
                role="status"
                style="height: 3rem; width: 3rem;"
            >
                <span class="sr-only">Loading...</span>
            </div>
        </div>
        <div
            class="opacity-transition"
            :class="isLoading ? 'hide' : ''"
        >
            <slot />
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
export default {
    name: 'LoadingPage',
    computed: mapState([
        'isLoading',
    ]),
};
</script>

<style scoped>

.loading-container {
    position: absolute;
    margin: auto;
    left: 0;
    right: 0;
    top: 50vh;
    text-align: center;
    z-index: 1;
}

.hide {
    visibility: hidden;
    opacity: 0;
}

.opacity-transition {
    transition: opacity 0.25s ease-in-out;
}

</style>
