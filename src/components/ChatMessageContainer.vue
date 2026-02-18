<template>
    <div>
        <button class="btn btn-sm w-100 btn-primary mb-2" data-bs-toggle="collapse" data-bs-target="#chatMessage">
            See full chat message <i class="fas fa-angle-down" />
        </button>

        <div id="chatMessage" class="collapse">
            <div id="copyText" class="card card-body small mb-2" @click="copy">
                <slot />
            </div>

            <div class="row">
                <div :class="osuId ? 'col-sm-6' : 'col-sm-12'">
                    <a :href="`message?${messageType}=${mongoId}`" target="_blank" class="btn btn-sm w-100 btn-primary mb-2">
                        Preview message
                    </a>
                </div>
                <div v-if="osuId" class="col-sm-6">
                    <div>
                        <a :href="'https://osu.ppy.sh/community/chat?sendto=' + osuId" target="_blank" class="btn btn-sm w-100 btn-primary mb-2">
                            Open osu! chat
                        </a>
                    </div>
                </div>
                <div v-else-if="users" class="col-sm-3">
                    <div v-for="user in users" :key="user.osuId">
                        <user-link
                            :username="user.username"
                            :osu-id="user.osuId"
                        />
                        <a :href="'https://osu.ppy.sh/community/chat?sendto=' + user.osuId" target="_blank" class="btn btn-sm w-100 btn-primary mb-2">
                            Open osu! chat
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import UserLink from './UserLink.vue';

export default {
    name: 'ChatMessageContainer',
    components: {
        UserLink,
    },
    props: {
        osuId: {
            type: Number,
            default: 0,
        },
        messageType: {
            type: String,
            required: true,
        },
        mongoId: {
            type: String,
            required: true,
        },
        users: {
            type: Array,
            default() {
                return [];
            },
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
