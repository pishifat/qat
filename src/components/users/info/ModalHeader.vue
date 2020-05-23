<template>
    <div
        class="modal-header text-dark"
        :class="selectedUser.probation.length && selectedUser.group != 'nat' ? 'bg-probation' : 'bg-' + selectedUser.group"
    >
        <h5 class="modal-title">
            <a class="text-dark" :href="'https://osu.ppy.sh/users/' + selectedUser.osuId">{{ selectedUser.username }}</a>
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
    },
};
</script>