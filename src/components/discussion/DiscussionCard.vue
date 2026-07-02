<template>
    <div
        class="col-md-6 col-lg-4 my-2 discussion-card-col"
        @mouseenter="openPreview"
        @mouseleave="closePreview"
    >
        <teleport to="body">
            <Transition name="image-preview">
                <div
                    v-if="previewVisible && isImage"
                    class="image-hover-preview"
                    :class="{ 'image-hover-preview-nat': discussion.isNatOnly }"
                    :style="previewStyle"
                >
                    <img :src="proxyImageLink" class="image-hover-preview-img" alt="">
                </div>
            </Transition>
        </teleport>

        <router-link
            :to="detailPath"
            class="discussion-card-link text-decoration-none text-body"
            :data-discussion="discussion.id"
        >
            <div
                class="card card-individual h-100"
                :class="[voteBorderClass, discussion.isNatOnly ? 'nat-vote' : '']"
            >
                <img
                    v-if="showImageBackground"
                    :src="proxyImageLink"
                    class="card-bg"
                    alt=""
                >
                <div class="card-body">
                    <div class="wrap-text text-truncate discussion-card-title-row">
                        <span
                            v-if="safeDiscussionLink"
                            class="discussion-card-title"
                            role="link"
                            tabindex="0"
                            @click.stop.prevent="confirmAndOpen(discussion.discussionLink)"
                            @keydown.enter.stop.prevent="confirmAndOpen(discussion.discussionLink)"
                        >
                            <b>{{ discussion.title }}</b>
                        </span>
                        <span v-else><b>{{ discussion.title }}</b></span>
                    </div>

                    <div v-if="discussion.isContentReview && !discussion.isActive" class="small">
                        Consensus:
                        <span :class="consensusClass + ' fw-bold'">
                            {{ consensusLabel }}
                        </span>
                    </div>

                    <div
                        class="card-status"
                        :class="discussion.isActive ? 'status-bar-active' : 'status-bar-inactive'"
                    />

                    <div class="card-icons d-flex align-items-center justify-content-between flex-wrap gap-1">
                        <div class="d-flex align-items-center flex-wrap gap-1">
                            <date-display class="small" :date="discussion.createdAt" />
                            <add-votes
                                v-if="!discussion.isActive || loggedInUser.isNatLeader"
                                :inputs="discussion.mediations"
                            />
                        </div>
                        <span
                            v-if="discussion.isContentReview"
                            class="content-type-icon"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            :title="contentTypeLabel"
                            @click.stop
                        >
                            <i :class="contentTypeIconClass" />
                        </span>
                        <mode-display
                            v-else
                            :modes="discussion.mode"
                            :show-all="true"
                        />
                    </div>
                </div>
            </div>
        </router-link>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import ModeDisplay from '../ModeDisplay.vue';
import DateDisplay from '../DateDisplay.vue';
import AddVotes from '../evaluations/card/AddVotes.vue';

export default {
    name: 'DiscussionCard',
    components: {
        ModeDisplay,
        DateDisplay,
        AddVotes,
    },
    props: {
        discussion: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            previewVisible: false,
            previewStyle: {},
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        detailPath() {
            return this.discussion.isContentReview
                ? `/contentreview/${this.discussion.id}`
                : `/discussionvote/${this.discussion.id}`;
        },
        safeDiscussionLink() {
            return this.sanitizeUrl(this.discussion?.discussionLink);
        },
        proxyImageLink() {
            const imageUrl = this.resolveDiscussionImageUrl(this.safeDiscussionLink);
            return imageUrl ? this.proxyUrl(imageUrl) : null;
        },
        isImage() {
            return this.isDiscussionImageUrl(this.safeDiscussionLink);
        },
        showImageBackground() {
            return this.discussion.isContentReview && this.isImage;
        },
        contentType() {
            if (!this.discussion.isContentReview) return null;
            return this.resolveDiscussionContentType(this.safeDiscussionLink);
        },
        contentTypeLabel() {
            if (this.contentType === 'image') return 'Image';
            if (this.contentType === 'video') return 'Video';
            return 'Unknown content type';
        },
        contentTypeIconClass() {
            if (this.contentType === 'image') return 'fas fa-image text-info';
            if (this.contentType === 'video') return 'fas fa-video text-danger';
            return 'fas fa-question-circle text-secondary';
        },
        voteBorderClass() {
            const vote = this.findRelevantMediation();
            return vote ? `border-${vote}` : null;
        },
        consensusClass() {
            if (this.discussion.isAcceptable === true) return 'text-success';
            if (this.discussion.isAcceptable === false) return 'text-danger';
            return 'text-secondary';
        },
        consensusLabel() {
            if (this.discussion.isAcceptable === true) return 'Pass';
            if (this.discussion.isAcceptable === false) return 'Fail';
            return 'Unknown';
        },
    },
    methods: {
        openPreview(event) {
            if (!this.isImage) return;

            const rect = event.currentTarget.getBoundingClientRect();
            const spaceAbove = rect.top;
            const spaceBelow = window.innerHeight - rect.bottom;
            const showAbove = spaceAbove >= spaceBelow;

            this.previewStyle = {
                top: showAbove ? `${rect.top - 8}px` : `${rect.bottom + 8}px`,
                left: `${rect.left + rect.width / 2}px`,
                transform: showAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
            };
            this.previewVisible = true;
        },
        closePreview() {
            this.previewVisible = false;
        },
        confirmAndOpen(url) {
            const safeUrl = this.sanitizeUrl(url);
            if (!safeUrl) {
                alert('Invalid or unsafe URL.');
                return;
            }
            if (confirm(`This will redirect you to another webpage or download a file. This is user-submitted content, so if you don't trust the url, don't proceed.\n\n${safeUrl}`)) {
                window.location.href = safeUrl;
            }
        },
        findRelevantMediation() {
            if (!this.loggedInUser || !Array.isArray(this.discussion.mediations)) return null;

            for (const m of this.discussion.mediations) {
                if (m.mediator && m.mediator.id == this.loggedInUser.id) {
                    if (m.vote == 1) return 'pass';
                    if (m.vote == 2) return 'neutral';
                    if (m.vote == 3) return 'fail';
                }
            }

            return null;
        },
    },
};
</script>

<style scoped>
.discussion-card-link {
    display: block;
    height: 100%;
}

.card-individual {
    position: relative;
    overflow: hidden;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.card-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.3;
    pointer-events: none;
}

.discussion-card-link:hover .card-individual {
    transform: translateY(-2px);
}

.discussion-card-title-row {
    position: relative;
    z-index: 1;
}

.content-type-icon {
    line-height: 1;
    cursor: default;
}

.discussion-card-title {
    cursor: pointer;
    color: var(--bs-link-color);
}

.discussion-card-title:hover {
    color: var(--bs-link-hover-color);
}

.discussion-card-title:hover b {
    text-decoration: underline;
}

.status-bar-active {
    background: radial-gradient(#fff, transparent 70%);
}

.status-bar-inactive {
    background: radial-gradient(var(--bs-gray-600), transparent 70%);
}

.nat-vote {
    background-color: rgb(95, 60, 60) !important;
}
</style>

<style>
.image-hover-preview {
    position: fixed;
    z-index: 1080;
    pointer-events: none;
    padding: 0.25rem;
    border-radius: 0.35rem;
    background-color: hsl(170, 20%, 20%);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(0, 0, 0, 0.175);
}

.image-hover-preview-nat {
    background-color: rgb(95, 60, 60);
}

.image-hover-preview-img {
    display: block;
    max-width: min(80vw, 360px);
    max-height: min(60vh, 360px);
    width: auto;
    height: auto;
    object-fit: contain;
    border-radius: 0.2rem;
}

.image-preview-enter-active,
.image-preview-leave-active {
    transition: opacity 0.18s ease;
}

.image-preview-enter-from,
.image-preview-leave-to {
    opacity: 0;
}
</style>
