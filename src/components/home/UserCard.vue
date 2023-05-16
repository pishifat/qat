<template>
    <div class="card home-card" :style="cardDecoration(user)">
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
                        v-html="$md.renderInline(formatLink(status, user.requestLink, user.osuId))"
                    />
                </span>
                <span v-if="user.languages">
                    <span
                        v-for="language in user.languages"
                        :key="language"
                        class="language-tag badge badge-pill mx-1 text-lowercase badge-secondary"
                        v-html="language"
                    />
                </span>
            </span>
        </div>
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
    mixins: [ evaluations ],
    methods: {
        /** @returns {array} */
        requestMethods(requestStatus) {
            let statusList = [...requestStatus];
            statusList = statusList.sort();

            if (statusList.length && !statusList.includes('closed')) {
                statusList.unshift('open');
            }

            return statusList;
        },
        /** @returns {string} */
        formatLink(status, requestLink, osuId) {
            status = this.makeWordFromField(status);

            if (status === 'Personal Queue' && requestLink) {
                return `[mod queue](${requestLink})`;
            } else if (status === 'Personal Queue') {
                return `mod queue`;
            }
            
            if (status === 'Game Chat') {
                return `[chat](https://osu.ppy.sh/community/chat?sendto=${osuId})`;
            }

            return status;
        },
        /** @returns {string} */
        cardDecoration(user) {
            let css = this.getCardBackground(user);

            if (user.group === 'nat') {
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
            return `background: linear-gradient(90deg, #2D3B42 6.19%, rgba(0, 0, 0, 0.82) 179.48%), url(${this.getCover(user)}) center no-repeat; background-size: cover;`;
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
