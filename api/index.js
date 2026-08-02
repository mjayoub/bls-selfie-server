const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Serve static files (HTML, CSS, JS, images) from public directory
app.use(express.static(path.join(__dirname, '../public')));

app.get('/routes/verifyLiveness.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/routes/verifyLiveness.html'));
});

// ── Upstash Redis REST helper ─────────────────────────────────────────────
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || 'https://daring-goblin-175836.upstash.io';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || 'gQAAAAAAAq7cAQIgcDE1OTc1ODQ4MjUwMTE0MTUwYjhhN2YxMTM3OGZhYzcyOA';
const SESSION_TTL = 7200; // 2 hours in seconds

async function redisCmd(...args) {
    try {
        const res = await fetch(REDIS_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${REDIS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(args)
        });
        const json = await res.json();
        return json.result;
    } catch(e) {
        console.error('[Redis] Command error:', e.message);
        return null;
    }
}

async function getSession(cem) {
    const raw = await redisCmd('GET', `session:${cem}`);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch(e) { return null; }
}

async function setSession(cem, session) {
    await redisCmd('SET', `session:${cem}`, JSON.stringify(session), 'EX', SESSION_TTL);
}

async function getShortCodeCem(shortCode) {
    return await redisCmd('GET', `sc:${shortCode}`);
}

async function setShortCodeCem(shortCode, cem) {
    await redisCmd('SET', `sc:${shortCode}`, cem, 'EX', SESSION_TTL);
}

async function resolveCem(inputId) {
    if (!inputId) return null;
    const cleanId = String(inputId).trim();
    // If it's a 6-digit short code, look up the real CEM
    if (/^\d{4,8}$/.test(cleanId)) {
        const longCem = await getShortCodeCem(cleanId);
        if (longCem) return longCem;
    }
    return cleanId;
}

// ── Endpoint 1: Bot registers session or client fetches ───────────────────
app.post('/api/applications/fetchCem', async (req, res) => {
    const rawId = req.body.cem || req.body.shortCode;
    if (!rawId) {
        return res.status(400).json({ error: "CEM ID or Short Code required" });
    }

    const mainCem = await resolveCem(rawId);
    let session = await getSession(mainCem);
    const shouldReset = req.body.reset === true || req.body.reset === 'true' || req.body.forceReset;
    const isUpdate = req.body.mode === 'update';

    // Preserve already-verified sessions (don't allow re-registration)
    if (session && (session.status === true || session.status === 'true') && session.livenessId) {
        console.log(`[Redis] 🔒 Preserving ALREADY VERIFIED session: SC=${session.shortCode} | LivenessId=${session.livenessId}`);
        return res.json(session);
    }

    // Mode 'update': merge new fields into existing session without resetting
    // Used when bot navigates from Page 1 → Page 2 and needs to add userId/transactionId/userAgent
    if (isUpdate && session) {
        let changed = false;
        if (req.body.userId && req.body.userId !== session.userId) {
            session.userId = req.body.userId;
            changed = true;
        }
        if (req.body.transactionId && req.body.transactionId !== session.transactionId) {
            session.transactionId = req.body.transactionId;
            changed = true;
        }
        if (req.body.userAgent && req.body.userAgent !== session.userAgent) {
            session.userAgent = req.body.userAgent;
            changed = true;
        }
        if (req.body.ip && req.body.ip !== session.ip) {
            session.ip = req.body.ip;
            changed = true;
        } else if (!session.ip) {
            session.ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;
            changed = true;
        }
        if (req.body.shortCode && /^\d{4,8}$/.test(req.body.shortCode) && !session.shortCode) {
            session.shortCode = req.body.shortCode;
            await setShortCodeCem(req.body.shortCode, mainCem);
            changed = true;
        }
        if (changed) {
            session.updatedAt = Date.now();
            await setSession(mainCem, session);
            console.log(`[Redis] 📝 Session UPDATED: CEM=${mainCem.substring(0, 20)}... | userId=${session.userId} | txId=${session.transactionId?.substring(0, 20)} | UA=${session.userAgent ? 'Present' : 'None'}`);
        }
        return res.json(session);
    }

    if (!session || shouldReset) {
        const shortCode = (req.body.shortCode && /^\d{4,8}$/.test(req.body.shortCode))
            ? req.body.shortCode
            : String(Math.floor(100000 + Math.random() * 900000));

        session = {
            cem: mainCem,
            shortCode: shortCode,
            userId: req.body.userId || null,
            transactionId: req.body.transactionId || null,
            userAgent: req.body.userAgent || req.headers['user-agent'] || null,
            ip: req.body.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null,
            srn: "SRN-" + Date.now(),
            status: false,
            livenessId: null,
            best_shot: null,
            createdAt: Date.now()
        };
        await setSession(mainCem, session);
        await setShortCodeCem(shortCode, mainCem);
        console.log(`[Redis] 🔄 Session RESET/Registered: CEM=${mainCem.substring(0, 20)}... | SC=${session.shortCode} | userId=${session.userId}`);
    } else {
        // Session exists and no reset: update shortCode mapping and userAgent if needed
        let changed = false;
        if (req.body.shortCode && /^\d{4,8}$/.test(req.body.shortCode) && !session.shortCode) {
            session.shortCode = req.body.shortCode;
            await setShortCodeCem(req.body.shortCode, mainCem);
            changed = true;
        }
        if (req.body.userId && !session.userId) {
            session.userId = req.body.userId;
            changed = true;
        }
        if (req.body.transactionId && !session.transactionId) {
            session.transactionId = req.body.transactionId;
            changed = true;
        }
        if (req.body.userAgent && !session.userAgent) {
            session.userAgent = req.body.userAgent;
            changed = true;
        }
        if (changed) {
            session.updatedAt = Date.now();
            await setSession(mainCem, session);
        }
    }

    console.log(`[Redis] Registered: CEM=${mainCem.substring(0, 20)}... | SC=${session.shortCode} | userId=${session.userId} | Status=${session.status}`);
    return res.json(session);
});

// ── Endpoint 2: Client verifies selfie via short code ─────────────────────
app.post('/api/applications/verify', async (req, res) => {
    const rawId = req.body.cem || req.body.shortCode;
    if (!rawId) {
        return res.status(400).json({ error: "CEM or Short Code required" });
    }

    const mainCem = await resolveCem(rawId);
    let session = await getSession(mainCem);

    // Use real OzLiveness event_session_id or folder_id as livenessId when available
    const rawLivenessId = req.body.event_session_id || req.body.eventSessionId ||
                          req.body.folder_id || req.body.folderId ||
                          req.body.result_id || req.body.resultId ||
                          (req.body.livenessId && !req.body.livenessId.startsWith('LIVENESS_OK_') ? req.body.livenessId : null);

    const livenessId = rawLivenessId || null;

    if (!session) {
        session = { cem: mainCem, status: true, livenessId };
    } else {
        session.status = true;
        session.livenessId = livenessId || session.livenessId;
        session.verifiedAt = Date.now();
    }

    // Store selfie image from client webcam if provided
    if (req.body.best_shot) {
        session.best_shot = req.body.best_shot;
        console.log(`[Redis] 📷 Selfie image stored (${req.body.best_shot.length} chars)`);
    }

    await setSession(mainCem, session);

    console.log(`[Redis] ✅ Selfie VERIFIED for: ${rawId} → livenessId: ${livenessId ? livenessId.substring(0, 30) : 'IMAGE_ONLY'}...`);
    return res.json({
        success: true,
        message: "Selfie verified successfully",
        livenessId: session.livenessId,
        shortCode: session.shortCode
    });
});

// ── Endpoint 3: Get stored selfie data for LivenessHandler ───────────────
app.post('/api/applications/getSelfieData', async (req, res) => {
    const rawId = req.body.cem || req.body.shortCode;
    if (!rawId) return res.json({ folder_id: null, best_shot: null, status: false });

    const mainCem = await resolveCem(rawId);
    const session = await getSession(mainCem);

    if (session) {
        return res.json({
            folder_id: session.livenessId || null,
            best_shot: session.best_shot || null,
            status: session.status || false
        });
    }
    return res.json({ folder_id: null, best_shot: null, status: false });
});

// ── Endpoint 4: Reset session status (for retries / new attempts) ────────
app.post('/api/applications/reset', async (req, res) => {
    const rawId = req.body.cem || req.body.shortCode;
    if (!rawId) return res.json({ success: false, message: "ID required" });

    const mainCem = await resolveCem(rawId);
    let session = await getSession(mainCem);

    if (session) {
        session.status = false;
        session.livenessId = null;
        session.best_shot = null;
        session.resetAt = Date.now();
        await setSession(mainCem, session);
        console.log(`[Redis] 🧹 Session CLEARED for retry: ${rawId}`);
    }
    return res.json({ success: true, message: "Session reset for retry" });
});

// ── Endpoint 5: Bot polls status ──────────────────────────────────────────
app.post('/api/applications/checkStatus', async (req, res) => {
    const rawId = req.body.cem || req.body.shortCode;
    const mainCem = await resolveCem(rawId);
    const session = await getSession(mainCem);

    if (session && session.status === true) {
        console.log(`[Redis] 🟢 Selfie PASSED for: ${rawId}`);
        return res.json({
            status: true,
            livenessId: session.livenessId,
            best_shot: session.best_shot || null,
            message: "Selfie passed"
        });
    }

    return res.json({
        status: false,
        message: "Waiting for client selfie..."
    });
});

// ── Root Route: Serve verifyLiveness.html UI ─────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/routes/verifyLiveness.html'));
});

module.exports = app;
