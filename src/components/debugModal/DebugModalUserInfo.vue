<template>
    <div class="container">
        <div class="row">
            <div class="col-sm-3">
                <div>User Document</div>
                <small class="text-secondary">
                    Your current user document              
                </small>
            </div>
            <div class="col-sm-9">
                <p>
                    <a href="#userDocument" data-toggle="collapse">
                        view user document <i class="fas fa-angle-down" />
                    </a>
                </p>
                <pre id="userDocument" class="collapse container">{{ JSON.stringify(loggedInUser, null, 4) }}</pre>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
};
</script>
