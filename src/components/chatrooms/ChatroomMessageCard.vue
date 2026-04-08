<template>
    <div
        class="card card-body mb-2"
        :class="[
            message.role === 'system' ? 'card-bg-system' : message.role === 'moderator' ? 'card-bg-nat' : 'card-bg-user',
            { 'card-deleted': message.deletedAt },
        ]"
    >
        <div class="card-message-header">
            <img
                v-if="message.user"
                :src="'https://a.ppy.sh/' + message.user.osuId"
                class="card-avatar-img"
                alt=""
            >
            <div class="flex-grow-1">
                <div class="d-flex flex-wrap align-items-center gap-1">
                    <b v-if="message.user">
                        <user-link
                            :username="message.user.username"
                            :osu-id="message.user.osuId"
                            :class="message.role === 'vetoer' ? 'text-warning' : message.role === 'voucher' ? 'text-probation' : ''"
                        />
                    </b>
                    <b
                        v-else
                        :class="message.role === 'vetoer' ? 'text-warning' : message.role === 'voucher' ? 'text-probation' : ''"
                    >{{ message.displayName }}</b>
                    <i
                        v-if="message.role === 'vetoer'"
                        class="fa-solid fa-gavel text-warning"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Vetoer"
                    />
                    <i
                        v-else-if="message.role === 'voucher'"
                        class="fa-solid fa-hand text-probation"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Vouching user"
                    />
                    <i
                        v-if="message.isAnonymous"
                        class="fa-solid fa-user-secret text-secondary"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        :title="message.anonName ? `Anonymous as ${message.anonName}` : 'Anonymous user'"
                    />
                    •
                    <b v-if="message.deletedAt" class="text-danger">Deleted</b>
                    <b data-bs-toggle="tooltip" data-bs-placement="top" :title="toStandardDetailedDate(message.createdAt)">
                        {{ toRelativeDate(message.createdAt) }}
                    </b>
                    <button
                        v-if="message.canDelete"
                        type="button"
                        class="btn btn-sm btn-link text-danger p-0 ms-1"
                        data-bs-toggle="tooltip"
                        title="Delete message"
                        @click="$emit('delete-message', message.id, $event)"
                    >
                        <i class="fa-solid fa-trash" />
                    </button>
                    <button
                        v-if="message.canRestore"
                        type="button"
                        class="btn btn-sm btn-link text-success p-0 ms-1"
                        data-bs-toggle="tooltip"
                        title="Restore message"
                        @click="$emit('restore-message', message.id, $event)"
                    >
                        <i class="fa-solid fa-rotate-left" />
                    </button>
                </div>
            </div>
        </div>
        <div v-html="$md.render(message.content)" />
    </div>
</template>

<script>
import UserLink from '../UserLink.vue';

export default {
    name: 'ChatroomMessageCard',
    components: {
        UserLink,
    },
    props: {
        message: {
            type: Object,
            required: true,
        },
    },
    emits: ['delete-message', 'restore-message'],
};
</script>

<style scoped>
.card-bg-system {
    background-image: url('/images/nat.png');
    background-repeat: repeat-y;
    background-position: left;
    background-blend-mode: saturation;
}

.card-bg-nat {
    background-image: url('/images/nat.png');
    background-repeat: repeat-y;
    background-position: left;
}

.card-bg-user {
    background-image: url('/images/user.png');
    background-repeat: repeat-y;
    background-position: left;
}

.card-message-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.card-avatar-img {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    object-fit: cover;
    border-radius: 100%;
    box-shadow: 0 1px 1rem rgba(10, 10, 25, 0.9);
    background-color: var(--bs-gray-800);
}

.text-warning :deep(a) {
    color: var(--bs-warning);
}

.card-deleted {
    opacity: 0.55;
}
</style>
