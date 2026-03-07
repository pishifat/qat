class WebsocketManager {
    static sendNotification(type, data) {
        console.log(`Sending notification for tag '${type}' to ${global.ws.length} websocket client(s)`);

        for (const client of global.ws.filter((client) => client.tags.includes(type))) {
            client.ws.send(
                JSON.stringify({
                    type,
                    data,
                })
            );
        }
    }
}
/**
 * Available tags:
 * - `users:request_status_update`
 * - `data:content_review`
 */
WebsocketManager.availableTags = ['users:request_status_update', 'data:content_review'];
module.exports.websocketManager = WebsocketManager;
