<template>
    <div v-if="mediationId && veto.status === 'wip'">
        <hr>
        <p class="text-shadow min-spacing mb-2">
            Reason for vote:
        </p>
        <p class="text-shadow small min-spacing mb-1 ml-2">
            This comment will be displayed anonymously alongside the verdict post. If your response is deemed inappropriate, your vote will be marked as invalid.
        </p>
        <div class="form-group">
            <textarea
                id="comment"
                v-model="commentInput"
                class="form-control dark-textarea"
                style="white-space: pre-line;"
                placeholder="Why you agree/disagree with the veto..."
                rows="2"
            />
        </div>
        <div class="mb-2">
            <span class="mr-3 text-shadow">Vote:</span>
            <div class="form-check form-check-inline">
                <input
                    id="1"
                    class="form-check-input"
                    type="radio"
                    name="vote"
                    value="1"
                    :checked="vote === 1"
                >
                <label class="form-check-label text-shadow vote-pass" for="1">Agree</label>
            </div>
            <div class="form-check form-check-inline">
                <input
                    id="2"
                    class="form-check-input"
                    type="radio"
                    name="vote"
                    value="2"
                    :checked="vote === 2"
                >
                <label class="form-check-label text-shadow vote-neutral" for="2">Neutral</label>
            </div>
            <div class="form-check form-check-inline">
                <input
                    id="3"
                    class="form-check-input"
                    type="radio"
                    name="vote"
                    value="3"
                    :checked="vote === 3"
                >
                <label class="form-check-label text-shadow vote-fail" for="3">Disagree</label>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'mediation-input',
    props: {
        comment: String,
        mediationId: String,
        veto: {
            status: String
        },
        vote: Number
    },
    data() {
        return {
            commentInput: this.comment
        }
    }
};
</script>
