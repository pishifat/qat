<template>
    <section class="card card-body explicit-content-gate text-center">
        <i
            class="fas fa-exclamation-triangle text-warning explicit-content-icon mb-3"
            aria-hidden="true"
        />

        <h2 class="mb-3 text-warning">
            Explicit Content Warning
        </h2>

        <p class="explicit-content-body mx-auto mb-2">
            This page may contain <b>explicit content</b>, as it contains user-submitted images,
            videos, and links reviewed for beatmap suitability.
        </p>

        <p class="small text-secondary mx-auto mb-4">
            Only continue if you are comfortable viewing sensitive material.
        </p>

        <div>
            <button
                type="button"
                class="btn btn-secondary"
                @click="$emit('proceed', $event)"
            >
            Enable explicit content
            </button>
        </div>

        <p class="small text-secondary mt-3 mb-0">
            You can also toggle this in
            <a
                href="#"
                data-bs-toggle="modal"
                data-bs-target="#globalSettings"
                @click.prevent
            >settings</a>.
        </p>
    </section>
</template>

<script>
export default {
    name: 'ExplicitContentGate',
    emits: ['proceed'],
};
</script>

<style scoped>
.explicit-content-icon {
    font-size: 2rem;
    line-height: 1;
}

.explicit-content-body {
    max-width: 32rem;
}
</style>
