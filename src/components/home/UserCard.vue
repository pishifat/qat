<template>
    <div 
        class="card home-card" 
        :style="cardDecoration(user)" 
        @click="selectUser()"
        data-toggle="modal"
        data-target="#userInfo"
    >
        <img :src="'https://a.ppy.sh/' + user.osuId" class="card-avatar-img">
        <div class="body">
            <span>
                <user-link
                :osu-id="user.osuId"
                :username="user.username"
                />
                <span v-if="user.requestStatus">
                    <span
                        v-for="status in requestMethods(user.requestStatus)"
                        :key="status"
                        class="badge badge-pill mx-1 text-lowercase"
                        :class="status === 'closed' ? 'badge-danger' : status === 'open' ? 'badge-success' : 'badge-primary'"
                        v-html="requestType(status, user.requestLink, user.osuId).html || requestType(status, user.requestLink, user.osuId).type"
                        data-toggle="tooltip"
                        data-placement="top"
                        :title="requestType(status, user.requestLink, user.osuId).type"
                    />
                </span>
            </span>
        </div>
        <span
            class="text-light mr-2"
            data-toggle="tooltip"
            data-placement="top"
            title="view request info"
        >
            <i class="fas fa-ellipsis-v" />
        </span>
    </div>
</template>

<script>
import UserLink from '../UserLink.vue';
import evaluations from '../../mixins/evaluations';

export default {
    name: 'UserCard',
    components: {
        UserLink,
    },
    props: {
        user: {
            type: Object,
            required: true,
        },
    },
    computed: {
        selectedUser () {
            return this.user;
        },
    },
    mixins: [ evaluations ],
    methods: {
        selectUser() {
            this.$store.commit('usersHome/setSelectedUserId', this.user.id);

            if (this.$route.query.id !== this.user.id) {
                // if route doesnt exist, replace it with home, else push query
                if (this.$route.path === '/') {
                    this.$router.replace(`/home?id=${this.user.id}`);
                } else {
                    this.$router.push(`?id=${this.user.id}`);
                }
            }
        },
        /** @returns {array} */
        requestMethods(requestStatus) {
            let statusList = [...requestStatus];
            statusList = statusList.sort();

            if (statusList.length && !statusList.includes('closed')) {
                statusList.unshift('open');
            }

            return statusList;
        },
        /** @returns {Object} */
        requestType(status, requestLink, osuId) {
            status = this.makeWordFromField(status);

            let requestType = {
                type: status.toLowerCase(),
                html: null,
            };

            if (status === 'Personal Queue' && requestLink) {
                requestType.html = `<a href="${requestLink}" target="_blank"><i class="fas fa-external-link-alt" /></a>`;
            } else if (status === 'Personal Queue') {
                requestType.html = `<i class="fas fa-external-link-alt" />`;
            } else if (status === 'Game Chat') {
                requestType.html = `<a href="https://osu.ppy.sh/community/chat?sendto=${osuId}" target="_blank"><i class="fas fa-comment" /></a>`;
            }

            return requestType;
        },
        /** @returns {string} */
        cardDecoration(user) {
            let css = this.getCardBackground(user);

            if (user.level == 'evaluator') {
                return css += 'border-left: 4px solid var(--danger);';
            }

            if (user.level === 'probation') {
                return css += 'border-left: 4px solid var(--probation);';
            }

            if (user.level === 'full') {
                return css += 'border-left: 4px solid var(--bn);';
            }
        },
        /** @returns {string} */
        getCardBackground(user) {
            return `background: linear-gradient(90deg, var(--bright-blue-gray) 6%, rgba(0, 0, 0, 0.82) 140%), url(${this.getCover(user)}) center no-repeat; background-size: cover;`;
        },
        /** @returns {string} */
        getCover(user) {
            return user.cover ? user.cover : `https://a.ppy.sh/${user.osuId}` // fallback to avatar if no cover
        },
    }
};
</script>

<style scoped>
.card-avatar-img {
    position: relative;
    top: calc(50% - 40px);
    max-width: 30px;
    max-height: 30px;
    object-fit: cover;
    border-radius: 100%;
    box-shadow: 0 1px 1rem rgba(10, 10, 25, .9);
    background-color: var(--gray-dark);
}

.body {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    padding: 0 10px;
    flex-wrap: wrap;
}
</style>
