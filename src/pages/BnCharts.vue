<template>
    <div class="row">
        <div class="col-sm">
            <section class="card card-body">
                <nomination-curation />
            </section>
        </div>

        <toast-messages />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import ToastMessages from '../components/ToastMessages.vue';
import NominationCuration from '../components/users/NominationCuration.vue';

export default {
    name: 'BnCharts',
    components: {
        ToastMessages,
        NominationCuration,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
};
</script>