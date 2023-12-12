<template>
    <div>
        <!-- title -->
        <div class="form-inline">
            <input
                v-if="isEditingTitle"
                v-model="newTitleInput"
                class="form-control form-control-sm w-50 mb-2"
                type="text"
                placeholder="new title. enter to submit"
                @keyup.enter="updateAnnouncement($event)"
            >

            <h5 v-else>{{ announcement.title }} <span class="small text-secondary">({{ announcement.createdAt.slice(0,10) }})</span></h5>

            <a
                v-if="loggedInUser && loggedInUser.isNat"
                href="#"
                class="ml-1"
                @click.prevent="isEditingTitle = !isEditingTitle"
            >
                <i class="fas fa-edit" />
            </a>

        </div>
        <!-- content -->
        <div>
            <div v-if="isEditingContent">
                <textarea
                    v-model="newContentInput"
                    class="form-control form-control-sm mb-2"
                    type="text"
                    rows="4"
                    placeholder="new content"
                />
                <button type="submit" class="btn btn-primary float-right" @click="updateAnnouncement($event)">
                    Update
                </button>
                <button type="submit" class="btn btn-primary float-right mx-2" @click="isEditingContent = !isEditingContent">
                    Cancel
                </button>
                
            </div>

            <div v-else>
                <span class="v-html-content" v-html="$md.render(announcement.content)" />
                <button v-if="loggedInUser && loggedInUser.isNat" type="submit" class="btn btn-primary float-right" @click="isEditingContent = !isEditingContent">
                    Edit
                </button>
            </div>
        </div>
        
    </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
    name: 'Announcement',
    props: {
        announcement: {
            type: Object,
            required: true,
        },
    },
    data () {
        return {
            isEditingTitle: false,
            isEditingContent: false,
            newTitleInput: this.announcement.title,
            newContentInput: this.announcement.content,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
    methods: {
        async updateAnnouncement(e) {
            const announcement = await this.$http.executePost(
                `/updateAnnouncement/` + this.announcement.id, { newTitle: this.newTitleInput, newContent: this.newContentInput }, e);

            if (announcement && !announcement.error) {
                this.$store.commit('announcements/updateAnnouncement', announcement);
                this.$store.dispatch('updateToastMessages', {
                    message: `Updated announcement`,
                    type: 'success',
                });
                this.isEditingTitle = false;
                this.isEditingContent = false;
            }
        },
    },
};
</script>
