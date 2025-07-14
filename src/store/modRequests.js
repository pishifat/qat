export default {
    namespaced: true,
    state: {
        included: [],
        users: [],
    },

    mutations: {
        setUsers (state, users) {
            state.users = users;
        },
        updateIncluded (state, value) {
            const i = state.included.indexOf(value);
            if (i !== -1) state.included.splice(i, 1);
            else state.included.push(value);
        },
    },

    getters: {
        filteredUsers (state) {
            const sortOrder = ['osu', 'taiko', 'catch', 'mania', 'none'];
            const filtered = JSON.parse(JSON.stringify(state.users));

            // filter out users who have "closed" in their requestStatus array
            filtered.forEach((mode) => {
                mode.users = mode.users.filter((user) => {
                    return (!user.requestStatus?.includes('closed') && user.requestStatus?.length);
                });
            });

            // filter out users who don't have a specific preference ✔'d
            if (state.included.length) {
                filtered.forEach((mode) => {
                    mode.users = mode.users.filter((user) => {
                        const preferences = [...user.genrePreferences, ...user.languagePreferences, ...user.osuStylePreferences, ...user.taikoStylePreferences, ...user.catchStylePreferences, ...user.maniaStylePreferences, ...user.maniaKeymodePreferences, ...user.detailPreferences, ...user.mapperPreferences];
                        let match = true;
                        
                        for (const preference of state.included) {
                            if (!preferences.includes(preference)) {
                                match = false;
                            }
                        }

                        return match;
                    });
                });
            }

            return filtered.sort(function(a, b) {
                return sortOrder.indexOf(a._id) - sortOrder.indexOf(b._id);
            });
        }
    }
};
