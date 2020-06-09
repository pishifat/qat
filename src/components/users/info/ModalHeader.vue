<template>
    <div
        class="modal-header"
        :class="headerColor"
    >
        <h5 class="modal-title">
            <a :href="'https://osu.ppy.sh/users/' + selectedUser.osuId" class="text-white">
                <b>{{ selectedUser.username }}</b>
            </a>

            <i v-if="selectedUser.modes.indexOf('osu') >= 0" class="far fa-circle" />
            <i v-if="selectedUser.modes.indexOf('taiko') >= 0" class="fas fa-drum" />
            <i v-if="selectedUser.modes.indexOf('catch') >= 0" class="fas fa-apple-alt" />
            <i v-if="selectedUser.modes.indexOf('mania') >= 0" class="fas fa-stream" />
        </h5>
        <button type="button" class="close" data-dismiss="modal">
            <span>&times;</span>
        </button>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'ModalHeader',
    computed: {
        ...mapGetters([
            'selectedUser',
        ]),
        headerColor () {
            if (!this.selectedUser) return '';

            if (this.selectedUser.probation.length && this.selectedUser.group != 'nat') {
                return 'bg-probation';
            } else if (this.selectedUser.group == 'user') {
                return 'bg-bright-blue-gray';
            }

            return 'bg-' + this.selectedUser.group;
        },
    },
};
</script>
