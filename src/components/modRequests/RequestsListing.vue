<template>
    <section class="card">
        <h5 class="card-header">
            <a v-if="collapseTarget" data-toggle="collapse" :href="`#${collapseTarget}`">
                {{ title }} ({{ requests.length }})
                <small class="ml-2">
                    <i class="fas fa-chevron-down" />
                </small>
            </a>
            <span v-else>
                {{ title }} ({{ requests.length }})
            </span>
        </h5>

        <div
            :id="collapseTarget"
            class="card-body"
            :class="collapseTarget ? 'collapse' : ''"
        >
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
        collapseTarget: {
            type: String,
            default: '',
        },
    },
};
</script>
