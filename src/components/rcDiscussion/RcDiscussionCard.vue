<template>
    <div class="col-md-6 col-lg-4 my-2" @click="selectRcDiscussion()">
        <div
            class="card"
            :class="'border-' + findRelevantMediation()"
            data-toggle="modal"
            data-target="#extendedInfo"
            :data-rc-discussion="rcDiscussion.id"
        >
            <div class="card-body">
                <p class="text-shadow wrap-text">
                    <a :href="rcDiscussion.discussionLink" target="_blank" @click.stop>{{ rcDiscussion.title }}</a>
                </p>
                <p class="small text-shadow">
                    {{ rcDiscussion.isActive ? 'Open for voting' : 'Voting concluded' }}
                </p>
                <div class="rc-discussion-status my-auto" :class="rcDiscussion.isActive ? 'status-bar-active' : 'status-bar-inactive'" />
                <div class="card-icons">
                    <span class="small text-shadow float-left">{{ rcDiscussion.createdAt.slice(0, 10) }}</span>
                    <i v-if="rcDiscussion.mode.indexOf('osu') >= 0" class="far fa-circle" />
                    <i v-if="rcDiscussion.mode.indexOf('taiko') >= 0" class="fas fa-drum" />
                    <i v-if="rcDiscussion.mode.indexOf('catch') >= 0" class="fas fa-apple-alt" />
                    <i v-if="rcDiscussion.mode.indexOf('mania') >= 0" class="fas fa-stream" />
                    <span v-if="rcDiscussion.mode.indexOf('all') >= 0">
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
    name: 'RcDiscussionCard',
    props: ['rcDiscussion', 'userId'],
    methods: {
        selectRcDiscussion() {
            this.$emit('update:selectedRcDiscussion', this.rcDiscussion);
        },
        findRelevantMediation() {
            let vote;
            this.rcDiscussion.mediations.forEach(m => {
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

.rc-discussion-status {
    height: 5px;
    margin: 5px 0;
}

.card-icons {
    text-align: right;
}

.card {
    overflow: hidden;
}

</style>
