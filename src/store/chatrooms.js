function getTargetKey(type, targetId) {
    return `${type}:${targetId}`;
}

function defaultRefreshMeta() {
    return {
        isRefreshing: false,
        lastRefreshedAt: null,
        lastError: null,
    };
}

export default {
    namespaced: true,
    state: {
        roomsById: {},
        roomIdsByTargetKey: {},
        refreshMetaByRoomId: {},
    },
    mutations: {
        setRoomsForTarget(state, { type, targetId, rooms }) {
            const key = getTargetKey(type, targetId);
            state.roomIdsByTargetKey[key] = rooms.map(room => room.id);

            for (const room of rooms) {
                state.roomsById[room.id] = {
                    ...(state.roomsById[room.id] || {}),
                    ...room,
                };
            }
        },
        addRoomToTarget(state, { type, targetId, room }) {
            const key = getTargetKey(type, targetId);
            const roomIds = state.roomIdsByTargetKey[key] || [];

            state.roomIdsByTargetKey[key] = roomIds.includes(room.id)
                ? roomIds
                : [room.id, ...roomIds];

            state.roomsById[room.id] = {
                ...(state.roomsById[room.id] || {}),
                ...room,
            };
        },
        setRoom(state, room) {
            state.roomsById[room.id] = {
                ...(state.roomsById[room.id] || {}),
                ...room,
            };
        },
        setRoomRefreshMeta(state, { roomId, patch }) {
            state.refreshMetaByRoomId[roomId] = {
                ...defaultRefreshMeta(),
                ...(state.refreshMetaByRoomId[roomId] || {}),
                ...patch,
            };
        },
    },
    getters: {
        roomsForTarget: (state) => (type, targetId) => {
            const key = getTargetKey(type, targetId);
            const roomIds = state.roomIdsByTargetKey[key] || [];
            return roomIds
                .map(id => state.roomsById[id])
                .filter(Boolean);
        },
        roomById: (state) => (roomId) => {
            return state.roomsById[roomId] || null;
        },
        roomRefreshMeta: (state) => (roomId) => {
            return state.refreshMetaByRoomId[roomId] || defaultRefreshMeta();
        },
        canPost: (state) => (roomId) => {
            return !!state.roomsById[roomId]?.viewerCanPost;
        },
        canModerate: (state) => (roomId) => {
            return !!state.roomsById[roomId]?.viewerCanModerate;
        },
        isParticipant: (state) => (roomId) => {
            return !!state.roomsById[roomId]?.viewerIsParticipant;
        },
        isPublicParticipant: (state) => (roomId) => {
            return !!state.roomsById[roomId]?.viewerIsPublicParticipant;
        },
    },
};
