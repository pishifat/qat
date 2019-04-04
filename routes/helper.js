/**
 * Just replaces () and [] for now..
 * @param {string} username 
 */
function escapeUsername(username) {
    username = username.trim();
    return username.replace(/[()[\]]/g, '\\$&');
}

module.exports = { escapeUsername };