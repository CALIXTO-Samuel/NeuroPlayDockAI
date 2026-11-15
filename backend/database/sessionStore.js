
const fs = require("fs");
const path = require("path");
const session = require("express-session");

const SESSION_PATH = path.resolve(__dirname, "../../dados_sessoes.json");

function readSessions() {
    try {
        return JSON.parse(fs.readFileSync(SESSION_PATH, "utf8"));
    } catch (error) {
        throw new Error("Não foi possível ler as sessões: " + error.message);
    }
}

function writeSessions(data) {
    const temporaryPath = SESSION_PATH + ".tmp";

    try {
        fs.writeFileSync(temporaryPath, JSON.stringify(data, null, 2), "utf8");
        fs.renameSync(temporaryPath, SESSION_PATH);
    } catch (error) {
        if (fs.existsSync(temporaryPath)) {
            fs.unlinkSync(temporaryPath);
        }

        throw error;
    }
}

class JSONSessionStore extends session.Store {
    get(sid, callback) {
        try {
            const sessions = readSessions();
            const record = sessions[sid];

            if (!record) return callback(null, null);

            if (record.expires && new Date(record.expires) <= new Date()) {
                delete sessions[sid];
                writeSessions(sessions);
                return callback(null, null);
            }

            callback(null, record.session || null);
        } catch (error) {
            callback(error);
        }
    }

    set(sid, sessionData, callback = () => {}) {
        try {
            const sessions = readSessions();

            const expires = sessionData.cookie?.expires
                ? new Date(sessionData.cookie.expires).toISOString()
                : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

            sessions[sid] = {
                session: sessionData,
                expires
            };

            writeSessions(sessions);
            callback(null);
        } catch (error) {
            callback(error);
        }
    }

    destroy(sid, callback = () => {}) {
        try {
            const sessions = readSessions();
            delete sessions[sid];
            writeSessions(sessions);
            callback(null);
        } catch (error) {
            callback(error);
        }
    }

    touch(sid, sessionData, callback = () => {}) {
        try {
            const sessions = readSessions();

            if (sessions[sid]) {
                sessions[sid].session = sessionData;

                sessions[sid].expires = sessionData.cookie?.expires
                    ? new Date(sessionData.cookie.expires).toISOString()
                    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

                writeSessions(sessions);
            }

            callback(null);
        } catch (error) {
            callback(error);
        }
    }

    clearExpired() {
        const sessions = readSessions();
        const now = Date.now();

        for (const [sid, record] of Object.entries(sessions)) {
            if (!record.expires || new Date(record.expires).getTime() <= now) {
                delete sessions[sid];
            }
        }

        writeSessions(sessions);
    }
}

module.exports = new JSONSessionStore();
