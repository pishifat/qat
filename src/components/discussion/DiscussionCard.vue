<template>
    <div class="col-md-6 col-lg-4 my-2" @click="selectDiscussion()">
        <div
            class="card"
            :class="['border-' + findRelevantMediation(), discussion.isNatOnly ? 'card-bg-nat-vote' : '']"
            data-toggle="modal"
            data-target="#extendedInfo"
            :data-discussion="discussion.id"
        >
            <div class="card-body">
                <p class="text-shadow wrap-text">
                    <a
                        v-if="discussion.discussionLink.length"
                        :href="discussion.discussionLink"
                        target="_blank"
                        @click.stop
                    >{{ discussion.title }}</a>
                    <span v-else>{{ discussion.title }}</span>
                </p>
                <p class="small text-shadow">
                    {{ discussion.isActive ? 'Open for voting' : 'Voting concluded' }}
                </p>
                <div class="discussion-status my-auto" :class="discussion.isActive ? 'status-bar-active' : 'status-bar-inactive'" />
                <div class="card-icons">
                    <span class="small text-shadow float-left">{{ discussion.createdAt.slice(0, 10) }}</span>
                    <i v-if="discussion.mode.includes('osu')" class="far fa-circle" />
                    <i v-if="discussion.mode.includes('taiko')" class="fas fa-drum" />
                    <i v-if="discussion.mode.includes('catch')" class="fas fa-apple-alt" />
                    <i v-if="discussion.mode.includes('mania')" class="fas fa-stream" />
                    <span v-if="discussion.mode.includes('all')">
                        <i class="far fa-circle" />
                        <i class="fas fa-drum" />
                        <i class="fas fa-apple-alt" />
                        <i class="fas fa-stream" />
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'DiscussionCard',
    props: {
        discussion: Object,
        userId: String,
    },
    methods: {
        selectDiscussion() {
            this.$emit('update:selectedDiscussion', this.discussion);
        },
        findRelevantMediation() {
            let vote;
            this.discussion.mediations.forEach(m => {
                if (m.mediator.id == this.userId) {
                    if (m.vote == 1) {
                        vote = 'pass';
                    } else if (m.vote == 2) {
                        vote = 'neutral';
                    } else {
                        vote = 'fail';
                    }
                }
            });

            return vote;
        },
    },
};
</script>

<style>
.status-bar-active {
    background: radial-gradient(white, transparent 70%);
}

.status-bar-inactive {
    background: radial-gradient(slategray, transparent 70%);
}

.discussion-status {
    height: 5px;
    margin: 5px 0;
}

.card-icons {
    text-align: right;
}

.card {
    overflow: hidden;
}

.card-bg-nat-vote {
    background-color: rgba(59, 36, 36, 0.596)!important;
}

</style>
