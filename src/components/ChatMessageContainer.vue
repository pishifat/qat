<template>
    <div>
        <button class="btn btn-sm btn-block btn-primary mb-2" data-toggle="collapse" data-target="#chatMessage">
            See full chat message <i class="fas fa-angle-down" />
        </button>

        <div id="chatMessage" class="collapse">
            <div id="copyText" class="card card-body small mb-2" @click="copy">
                <slot />
            </div>
            <a :href="'https://osu.ppy.sh/community/chat?sendto=' + osuId" target="_blank" class="btn btn-sm btn-block btn-primary mb-2">
                Open osu! chat
            </a>
        </div>
    </div>
</template>

<script>

export default {
    name: 'ChatMessageContainer',
    props: {
        osuId: {
            type: Number,
            required: true,
        },
    },
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
            navigator.clipboard.writeText(fakeEl.textContent.trim());
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

#copyText {
    cursor: pointer;
}

</style>
