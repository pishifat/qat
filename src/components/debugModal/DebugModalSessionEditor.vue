<template>
    <div class="container">
        <div class="row">
            <div class="col-sm-3">
                <div>Session editor</div>
                <small class="text-secondary">
                    Edit your current session directly
                    <br>
                    (re-login to reset to correct values)
                </small>
            </div>
            <div class="row col-sm-9">
                <div class="col-sm-6">
                    <div class="row align-items-center">
                        <label class="col-sm-3 text-secondary">mongoId</label>
                        <div class="col-sm-7">
                            <input v-model="mongoId" class="form-control form-control-sm">
                        </div>
                    </div>
                    <div class="row align-items-center">
                        <label class="col-sm-3 text-secondary">osuId</label>
                        <div class="col-sm-7">
                            <input v-model="osuId" class="form-control form-control-sm">
                        </div>
                    </div>
                    <div class="row align-items-center">
                        <label class="col-sm-3 text-secondary">username</label>
                        <div class="col-sm-7">
                            <input v-model="username" class="form-control form-control-sm">
                        </div>
                    </div>
                    <div class="row align-items-center">
                        <label class="col-sm-3 text-secondary">groups</label>
                        <div class="col-sm-7">
                            <input v-model="groups" class="form-control form-control-sm">
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-sm-10">
                            <button class="btn btn-sm btn-success w-100" @click="save()">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col-sm-6">
                    <p>
                        <a href="#sessionInfo" data-bs-toggle="collapse">
                            view raw session <i class="fas fa-angle-down" />
                        </a>
                    </p>
                    <pre id="sessionInfo" class="collapse container">{{ JSON.stringify(rawSession, null, 4) }}</pre>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'DebugModalSessionEditor',
    data () {
        return {
            mongoId: '',
            osuId: 0,
            username: '',
            groups: '',
            discordId: '',
            rawSession: {},
        };
    },
    created() {
        this.getSession();
    },
    methods: {
        async getSession() {
            const res = await this.$http.executeGet(`/debug/session`);

            if (this.$http.isValid(res)) {
                this.mongoId = res.session.mongoId;
                this.osuId = res.session.osuId;
                this.username = res.session.username;
                this.groups = res.session.groups;
                this.rawSession = res.session;
            }
        },
        async save() {
            const res = await this.$http.executePost(`/debug/updateSession`, {
                mongoId: this.mongoId,
                osuId: this.osuId,
                username: this.username,
                groups: this.groups.toString(),
                discordId: this.discordId,
            });

            if (this.$http.isValid(res)) {
                this.mongoId = res.session.mongoId;
                this.osuId = res.session.osuId;
                this.username = res.session.username;
                this.groups = res.session.groups;
                this.rawSession = res.session;
            }
        },
    },
};
</script>
