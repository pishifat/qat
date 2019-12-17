<template>
    <div class="modal-body" style="overflow: hidden">
        <div class="text-shadow mb-2">
            <p class="min-spacing">
                <a :href="veto.discussionLink" target="_blank">Read the veto discussion here</a>
            </p>
            <small class="ml-2">Veto reason: <i v-html="filterLinks(veto.shortReason)" /></small>
        </div>
        <p class="min-spacing text-shadow">
            Consensus: {{
                veto.status === 'upheld' || veto.status === 'withdrawn' ? `Veto ${veto.status}` : 'none'
            }}
        </p>

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
