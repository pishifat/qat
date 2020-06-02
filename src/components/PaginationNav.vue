<template>
    <div class="row">
        <div class="col-sm-6 text-right">
            <button
                v-if="pagination.page > 1"
                class="btn btn-lg btn-link"
                type="button"
                @click="$emit('show-newer')"
            >
                <i class="fas fa-angle-left px-1" />
            </button>
        </div>

        <div class="col-sm-6">
            <button
                v-if="pagination.page < pagination.maxPages"
                class="btn btn-lg btn-link"
                type="button"
                @click="$emit('show-older')"
            >
                <i class="fas fa-angle-right px-1" />
            </button>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
export default {
    name: 'PaginationNav',
    computed: mapState(['pagination']),
};
</script>