export default {
    namespaced: true,
    state: {
        announcements: [],
    },
    mutations: {
        setAnnouncements (state, announcements) {
            state.announcements = announcements;
        },
        updateAnnouncement (state, announcement) {
            const i = state.announcements.findIndex(a => a.id == announcement.id);
            if (i !== -1) state.announcements[i] = announcement;
        },
    },
};
