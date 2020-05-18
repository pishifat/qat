<template>
    <div style="position: fixed; bottom: 20px; left: 20px; z-index: 2000;">
        <div
            v-for="(toast, i) in toastMessages"
            :key="i"
            class="toast show"
        >
            <div
                class="toast-body"
                :class="getToastTypeClass(toast)"
            >
                {{ toast.message }}
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
    computed: {
        ...mapState({
            toastMessages: (state) => state.toasts.toastMessages,
        }),
    },
    methods: {
        getToastTypeClass(toast) {
            if (toast.type === 'success') return 'bg-success';
            if (toast.type === 'info') return 'bg-info';

            return 'bg-danger';
        },
    },
};
</script>

<style>
.toast {
    -webkit-animation: fadeOutAnimation 0.5s ease-in 3s forwards;
    -moz-animation: fadeOutAnimation 0.5s ease-in 3s forwards;
    -o-animation: fadeOutAnimation 0.5s ease-in 3s forwards;
    animation: fadeOutAnimation 0.5s ease-in 3s forwards;
    -webkit-animation-fill-mode: forwards;
    animation-fill-mode: forwards;
}

@keyframes fadeOutAnimation {
    from {
        display: block;
        opacity: 1;
    }
    to {
        display: none;
        opacity: 0;
    }
}
@-webkit-keyframes fadeOutAnimation {
    from {
        display: block;
        opacity: 1;
    }
    to {
        display: none;
        opacity: 0;
    }
}
</style>