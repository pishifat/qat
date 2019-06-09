<template>
    <div id="addRcDiscussion" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-nat">
                    <h5 class="modal-title text-dark">Submit a Ranking Criteria thread for vote</h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body" style="overflow: hidden">
                    <div class="container">
                        <div class="row text-shadow">
                            <p>Game mode:</p>
                            <div class="row ml-4">
                                <label class="mx-1">
                                    <input type="radio" class="osu-radio hide-default" name="osu" value="osu" v-model="mode" checked />
                                    <i class="fas fa-circle fa-lg"></i>
                                </label>
                                <label class="mx-1">
                                    <input type="radio" class="taiko-radio hide-default" name="taiko" value="taiko" v-model="mode" />
                                    <i class="fas fa-drum fa-lg"></i>
                                </label>
                                <label class="mx-1">
                                    <input type="radio" class="catch-radio hide-default" name="catch" value="catch" v-model="mode" />
                                    <i class="fas fa-apple-alt fa-lg"></i>
                                </label>
                                <label class="mx-1">
                                    <input type="radio" class="mania-radio hide-default" name="mania" value="mania" v-model="mode" />
                                    <i class="fas fa-stream fa-lg"></i>
                                </label>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <small class="text-shadow mb-1">Link to the Ranking Criteria thread</small>
                            <input
                                type="text"
                                class="form-control"
                                placeholder="thread link..."
                                v-model="discussionLink"
                            />
                        </div>
                        <div class="row mb-3">
                            <small class="text-shadow mb-1">Title for Ranking Criteria vote</small>
                            <input
                                type="text"
                                class="form-control"
                                placeholder="title..."
                                v-model="title"
                            />
                        </div>
                        <div class="row mb-2">
                            <small class="text-shadow mb-1">Summarize the Ranking Criteria change</small>
                            <input
                                type="text"
                                class="form-control"
                                placeholder="rc change..."
                                v-model="shortReason"
                            />
                        </div>
                        <p class="errors text-shadow">{{ info }}</p>
                        <hr />
                        <button type="submit" class="btn btn-nat float-right" @click="submitRcDiscussion($event)">
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';

export default {
    name: 'submit-rc-discussion',
    mixins: [postData],
    data() {
        return {
            discussionLink: null,
            title: null,
            shortReason: null,
            mode: null,
            info: null,
        };
    },
    methods: {
        submitRcDiscussion: async function(e) {
            if (!this.discussionLink || !this.shortReason || !this.title) {
                this.info = 'Cannot leave fields blank!';
            } else {
                const rcDiscussion = await this.executePost(
                    '/rcVote/submit',
                    {
                        discussionLink: this.discussionLink,
                        title: this.title,
                        shortReason: this.shortReason,
                        mode: this.mode,
                    },
                    e
                );

                if (rcDiscussion) {
                    if (rcDiscussion.error) {
                        this.info = rcDiscussion.error;
                    } else {
                        $('#addRcDiscussion').modal('hide');
                        this.$emit('submit-rc-discussion', rcDiscussion);
                    }
                }
            }
        },
    },
};
</script>

<style>
</style>
