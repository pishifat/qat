<template>
    <div class="container">
        <div class="row mb-3">
            <div class="col-sm-6">
                Webhooks
            </div>
        </div>
        <div
            v-for="[webhookName, webhook] of Object.entries(webhooks)"
            :key="webhookName"
            class="row"
        >
            <small class="col-sm-4 text-secondary">
                {{ webhookName }}
            </small>
            <div class="col-sm-4">
                <input
                    v-model="webhook.id"
                    class="form-control form-control-sm"
                    type="text"
                    maxlength="100"
                    placeholder="id..."
                >
            </div>
            <div class="col-sm-4">
                <div class="row align-items-center">
                    <div class="col-10">
                        <input
                            v-model="webhook.token"
                            class="form-control form-control-sm"
                            type="text"
                            maxlength="100"
                            placeholder="token..."
                        >
                    </div>
                    <div class="col-2">
                        <a
                            href="#"
                            class="text-success"
                            @click.prevent="update(webhookName, webhook.id, webhook.token, $event)"
                        >
                            <i class="fas fa-save" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'SettingsModalWebhooks',
    data () {
        return {
            webhooks: {},
        };
    },

    async created () {
        await this.fetchWebhooks();
    },

    methods: {
        async fetchWebhooks () {
            const webhooks = await this.$http.executeGet(`/settings/webhooks`);

            if (!webhooks.error) {
                this.webhooks = webhooks;
            }
        },
        async update (webhook, id, token, e) {
            const res = await this.$http.executePost(`/settings/webhooks/update`, {
                webhook,
                id,
                token,
            }, e);

            if (!res.error) {
                this.webhooks[webhook].id = id;
                this.webhooks[webhook].token = token;
            }
        },
    },
};
</script>
