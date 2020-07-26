<template>
    <div id="copyText" class="card card-body pre-line small" @click="copy">
        <slot />
    </div>
</template>

<script>

export default {
    name: 'ForumPmContainer',
    methods: {
        copy () {
            const el = document.querySelector('#copyText');
            el.classList.add('animate-flicker');
            this.$store.dispatch('updateToastMessages', {
                message: 'Copied',
                type: 'info',
            });
            setTimeout(() => {
                el.classList.remove('animate-flicker');
            }, 500);
            const html = el.innerHTML.replace(/<br>/gi, '\r\n');
            const fakeEl = document.createElement('div');
            fakeEl.innerHTML = html;
            navigator.clipboard.writeText(fakeEl.textContent);
        },
    },
};
</script>

<style>

@keyframes flickerAnimation {
    0% { background-color: rgba(56, 199, 192, 0.233); }
}

@-moz-keyframes flickerAnimation {
    0% { background-color: rgba(56, 199, 192, 0.233); }
}

@-webkit-keyframes flickerAnimation {
    0% { background-color: rgba(56, 199, 192, 0.233); }
}

.animate-flicker {
    -webkit-animation: flickerAnimation .5s;
    -moz-animation: flickerAnimation .5s;
    animation: flickerAnimation .5s;
}

</style>
