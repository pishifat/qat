<template>
    <div class="row">
        <div class="col-sm">
            <section class="card card-body">
                <div class="text-center container">
                    <h5 class="text-danger">This page is no longer used!</h5>
                    You can still mess around if you want to though.
                </div>
            </section>
            
            <section class="card card-body">
                <nomination-curation />
            </section>
            
            <section class="card card-body mt-3">
                <monthly-charts />
            </section>
        </div>

        <toast-messages />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import ToastMessages from '../components/ToastMessages.vue';
import NominationCuration from '../components/charts/NominationCuration.vue';
import MonthlyCharts from '../components/charts/MonthlyCharts.vue';

export default {
    name: 'BnCharts',
    components: {
        ToastMessages,
        NominationCuration,
        MonthlyCharts,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
};
</script>