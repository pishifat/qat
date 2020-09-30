<template>
    <section class="card">
        <h5 class="card-header">
            {{ title }} ({{ requests.length }})
        </h5>
        <div class="card-body">
            <transition-group
                appear
                name="list"
                tag="div"
            >
                <div
                    v-for="request in requests"
                    :key="request.id"
                >
                    <request-wrapper :request="request">
                        <slot :request="request" />
                    </request-wrapper>
                </div>
            </transition-group>
        </div>
        <slot name="footer" />
    </section>
</template>

<script>
import RequestWrapper from './RequestWrapper.vue';

export default {
    name: 'RequestsListing',
    components: {
        RequestWrapper,
    },
    props: {
        title: {
            type: String,
            default: 'Requests',
        },
        requests: {
            type: Array,
            default () {
                return [];
            },
        },
    },
};
</script>
