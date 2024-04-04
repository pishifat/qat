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
                    <div class="row">
                        <span class="text-secondary col-sm-4">mongoId</span> <input class="form-control form-control-sm col-sm-6" v-model="mongoId" />
                    </div>
                    <div class="row">
                        <span class="text-secondary col-sm-4">osuId</span> <input class="form-control form-control-sm col-sm-6" v-model="osuId" />
                    </div>
                    <div class="row">
                        <span class="text-secondary col-sm-4">username</span> <input class="form-control form-control-sm col-sm-6" v-model="username" />
                    </div>
                    <div class="row">
                        <span class="text-secondary col-sm-4">groups</span> <input class="form-control form-control-sm col-sm-6" v-model="groups" />
                    </div>
                    <div class="row">
                        <span class="text-secondary col-sm-4">discordId</span> <input class="form-control form-control-sm col-sm-6" v-model="discordId" />
                    </div>
                    <div class="row mt-3">
                        <button class="btn btn-sm btn-success col-sm-10" @click="save()">Save</button>
                    </div>
                </div>
                <div class="col-sm-6">
                    <p>
                        <a href="#sessionInfo" data-toggle="collapse">
                            view raw session <i class="fas fa-angle-down" />
                        </a>
                    </p>
                    <pre id="sessionInfo" class="collapse container text-white">{{ JSON.stringify(rawSession, null, 4) }}</pre>
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
                this.discordId = res.session.discordId;
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
                this.discordId = res.session.discordId;
                this.rawSession = res.session;
            }
        },
    },
};
</script>
