<template>
    <div>
        <p class="form-inline">
            <b>
                Discord ID:
            </b>
            <input
                v-if="editingIdInput"
                v-model="idInput"
                class="form-control form-control-sm w-25"
                type="number"
                min="1"
                max="20"
                @keyup.enter="save()"
            >
            <span v-else class="mx-1">{{ idInput }}</span>
            <a href="#" @click.prevent="save()">
                <i class="fas fa-edit ml-1" />
            </a>
        </p>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'DiscordId',
    data () {
        return {
            idInput: '',
            editingIdInput: false,
        };
    },
    computed: {
        ...mapGetters('users', [
            'selectedUser',
        ]),
    },
    created () {
        this.idInput = this.selectedUser.discordId;
    },
    methods: {
        async save () {
            if (this.editingIdInput) {
                await this.$http.executePost(`/users/updateDiscordId`, {
                    discordId: this.idInput,
                    userId: this.selectedUser.id,
                });
            }

            this.editingIdInput = !this.editingIdInput;
        },
    },
};
</script>