<template>
    <section class="card card-body" v-if="announcements.length">
        <div class="d-flex align-items-center mb-1">
            <h4 class="mb-0">
                News from the NAT
            </h4>
        </div>

        <div>
            <div v-for="announcement in announcements" :key="announcement.id" class="card card-body small mb-4">
                <h5>{{ announcement.title }} <span class="small text-secondary">({{ announcement.createdAt.slice(0,10) }})</span></h5> 
                <span v-html="$md.render(announcement.content)" />
            </div>
            <div>
                <button
                    v-if="!max"
                    id="showMore"
                    class="btn btn-sm btn-primary mb-2"
                    type="button"
                    @click="showMore($event)"
                >
                    <i class="fas fa-angle-down mr-1" /> show more <i class="fas fa-angle-down ml-1" />
                </button>
                <div v-else>No more announcements to load.</div>
            </div>
        </div>
    </section>
</template>

<script>

export default {
    name: 'Announcements',
    data () {
        return {
            announcements: [],
            limit: 1,
            max: false,
        };
    },
    async created () {
        const announcements = await this.$http.initialRequest(`/findAnnouncements?limit=${this.limit}`);

            if (announcements) {
                this.announcements = announcements;
            }
    },
    methods: {
        async findNextAnnouncement (e) {
            const announcements = await this.$http.executeGet(`/findAnnouncements?limit=${this.limit}`, e);

            if (announcements) {
                this.announcements = announcements;
            }
        },
        async showMore (e) {
            this.limit *= 2;
            const currentLength = this.announcements.length;
            await this.findNextAnnouncement(e);
            if (this.announcements.length == currentLength) {
                this.max = true;
            }
        }
    },
};
</script>
