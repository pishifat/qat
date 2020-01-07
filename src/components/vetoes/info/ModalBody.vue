<template>
    <div class="modal-body" style="overflow: hidden">
        <div class="text-shadow mb-2">
            <p class="min-spacing mb-2">
                <a :href="veto.discussionLink" target="_blank">Read the veto discussion here</a>
            </p>
            <p class="min-spacing mb-2">
                Veto reason: 
                <small v-html="filterLinks(veto.shortReason)" />
            </p>
            <p>
                Consensus: 
                <small>{{ veto.status === 'upheld' || veto.status === 'withdrawn' ? `Veto ${veto.status}` : 'none'}}</small>
            </p>
        </div>
        

        <slot />
    </div>
</template>

<script>
import filterLinks from '../../../mixins/filterLinks.js';

export default {
    name: 'modal-body',
    mixins: [ filterLinks ],
    props: {
        veto: {
            discussionLink: String,
            status: String
        }
    }
};
</script>
