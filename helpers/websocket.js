/**
 * tags:
 * "users:request_status_update" = user request status updates
 */

class WebsocketManager {
    static availableTags = ["users:request_status_update"];

    static sendNotification(type, data) {
        for (const client of global.ws.filter((client) => client.tags.includes(type))) {
            client.ws.send(JSON.stringify({
                type,
                data
            }))
        }
    }
}

module.exports.websocketManager = WebsocketManager;
