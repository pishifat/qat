<template>
    <div>
        <span class="text-shadow">Modding:</span>
        <button
            class="btn btn-sm btn-nat mx-2 mb-2 minw-200"
            data-toggle="tooltip"
            data-placement="right"
            title="Finds unique mod count in the last 90 days. Only use on BNs with low activity"
            @click="findModCount()"
        >
            Load modding activity
        </button>
        <span v-if="loadingModCount" class="small">Finding mods (this will take a few seconds...)</span>
        <ul v-if="modCount" class="text-shadow">
            <li v-for="(mod, i) in modCount" :key="i" class="min-spacing small">
                Month {{ i+1 }}: {{ modCount[i] }}
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    name: 'ModdingActivity',
    props: {
        username: {
            type: String,
            default: null,
        },
    },
    data() {
        return {
            loadingModCount: false,
            modCount: null,
        };
    },
    methods: {
        async findModCount() {
            this.loadingModCount = true;
            axios
                .get('/modsCount/' + this.username)
                .then(response => {
                    this.loadingModCount = false;
                    this.modCount = response.data.modCount;
                });
        },
    },
};
</script>