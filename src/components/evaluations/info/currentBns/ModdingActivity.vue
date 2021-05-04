<template>
    <div>
        <p>
            <b>
                Modding:
            </b>
            <a
                class="ml-1"
                data-toggle="tooltip"
                data-placement="top"
                title="Finds unique mod count in the last 90 days"
                href="#"
                @click.prevent="findModCount()"
            >
                <i class="fas fa-search" />
            </a>
        </p>
        <ul v-if="modCount" class="small">
            <li v-for="(count, i) in modCount" :key="i">
                Month {{ i+1 }}: {{ count }}
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
            required: true,
        },
    },
    data() {
        return {
            modCount: null,
        };
    },
    watch: {
        username() {
            this.modCount = null;
        },
    },
    methods: {
        async findModCount() {
            this.$store.dispatch('updateToastMessages', {
                message: `Loading modding activity (this may take a while)`,
                type: 'info',
            });
            const res = await this.$http.executeGet(`/users/findModsCount/${this.username}`);

            if (res) {
                this.modCount = res;
                this.$store.dispatch('updateToastMessages', {
                    message: `Loaded modding activity`,
                    type: 'success',
                });
            }
        },
    },
};
</script>