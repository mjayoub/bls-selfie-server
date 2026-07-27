// Universal vf.js for BLS Auto Selfie (Web & Extension)
window.addEventListener('load', async function () {
    const verifySelfieBtn = document.getElementById('verifySelfie');
    const appIdInput = document.getElementById('applicationId');
    const resetBtn = document.getElementById('RESET');
    const pinBoxes = Array.from(document.querySelectorAll('.pin-box'));

    // --- Webcam Selfie Capture (used in web mode to get a real face image) ---
    async function captureWebcamFrame() {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' }
        });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
        document.body.appendChild(video);
        await video.play();
        await new Promise(r => setTimeout(r, 1200));

        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth || 320, 320);
        canvas.height = Math.min(video.videoHeight || 240, 240);
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.65);

        stream.getTracks().forEach(t => t.stop());
        video.remove();
        return imageData;
    }

    // --- PIN Digit Box Auto-Tab & Input Synchronization ---
    function updateHiddenInput() {
        const fullCode = pinBoxes.map(b => b.value).join('');
        if (appIdInput) appIdInput.value = fullCode;
        pinBoxes.forEach(b => {
            if (b.value) b.classList.add('filled');
            else b.classList.remove('filled');
        });
    }

    pinBoxes.forEach((box, idx) => {
        box.addEventListener('input', (e) => {
            const val = e.target.value;
            if (val && idx < pinBoxes.length - 1) {
                pinBoxes[idx + 1].focus();
            }
            updateHiddenInput();
        });

        box.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !box.value && idx > 0) {
                pinBoxes[idx - 1].focus();
            }
        });

        box.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = (e.clipboardData || window.clipboardData).getData('text').trim();
            if (pastedData) {
                const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');
                digits.forEach((digit, i) => {
                    if (pinBoxes[i]) pinBoxes[i].value = digit;
                });
                updateHiddenInput();
                const nextFocusIdx = Math.min(digits.length, pinBoxes.length - 1);
                if (pinBoxes[nextFocusIdx]) pinBoxes[nextFocusIdx].focus();
            }
        });
    });

    // Auto-fill from URL if present
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('data') || params.get('cem') || params.get('uuid') || params.get('id');
    if (urlCode && pinBoxes.length > 0) {
        const cleanDigits = urlCode.replace(/\D/g, '').slice(0, 6).split('');
        cleanDigits.forEach((digit, i) => {
            if (pinBoxes[i]) pinBoxes[i].value = digit;
        });
        updateHiddenInput();
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            const currentCode = appIdInput?.value?.trim();
            if (currentCode) {
                fetch('/api/applications/reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cem: currentCode, shortCode: currentCode })
                }).catch(() => {});
            }
            pinBoxes.forEach(b => {
                b.value = '';
                b.classList.remove('filled');
            });
            if (appIdInput) appIdInput.value = '';
            let msgEl = document.getElementById('srn');
            if (msgEl) msgEl.textContent = '';
            if (verifySelfieBtn) {
                verifySelfieBtn.disabled = false;
                verifySelfieBtn.textContent = 'Valider Selfie';
                verifySelfieBtn.style.background = '';
            }
            if (pinBoxes[0]) pinBoxes[0].focus();
        });
    }

    const handleVerification = async () => {
        updateHiddenInput();
        const appId = appIdInput?.value?.trim();
        if (!appId || appId.length < 6) {
            let msgEl = document.getElementById('srn');
            if (msgEl) {
                msgEl.style.color = '#f59e0b';
                msgEl.textContent = '⚠️ Veuillez entrer les 6 chiffres du code';
            }
            return;
        }

        if (verifySelfieBtn) {
            verifySelfieBtn.disabled = true;
            verifySelfieBtn.textContent = '📷 Capture du selfie...';
        }

        // Always capture webcam frame so real face photo (best_shot) is available for BLS Portugal
        let capturedImage = null;
        try {
            capturedImage = await captureWebcamFrame();
            if (capturedImage) console.log('[BLS Auto Selfie] ✅ Selfie webcam photo captured successfully');
        } catch(e) {
            console.log('[BLS Auto Selfie] Webcam photo capture unavailable:', e.message);
        }

        if (verifySelfieBtn) {
            verifySelfieBtn.textContent = 'Vérification en cours...';
        }

        const handleSuccess = (res) => {
            console.log('[BLS Auto Selfie] Response:', res);
            let msgEl = document.getElementById('srn');
            const returnGuid = res?.livenessId || res?.folder_id || res?.event_session_id;
            const isVerified = (res && (res.status === true || res.status === 'true')) || (returnGuid && returnGuid.length > 10);

            if (!isVerified) {
                if (msgEl) {
                    msgEl.style.color = '#f59e0b';
                    msgEl.style.fontSize = '0.95rem';
                    msgEl.style.fontWeight = 'bold';
                    msgEl.textContent = '⏳ Session enregistrée — En attente du selfie...';
                }
                if (verifySelfieBtn) {
                    verifySelfieBtn.disabled = false;
                    verifySelfieBtn.textContent = 'Valider Selfie';
                }
                return;
            }

            if (msgEl) {
                msgEl.style.color = '#4ade80';
                msgEl.style.fontSize = '1rem';
                msgEl.style.fontWeight = 'bold';
                
                let guidHtml = '';
                if (returnGuid && returnGuid.length > 10) {
                    guidHtml = `
                        <div style="margin-top: 10px; padding: 10px; background: rgba(22, 163, 74, 0.25); border: 2px solid #22c55e; border-radius: 12px; text-align: center;">
                            <div style="font-size: 11px; color: #a7f3d0; text-transform: uppercase; font-weight: 800; margin-bottom: 4px;">🔑 VOTRE JETON CLIENT (GUID) :</div>
                            <div style="font-size: 13px; font-family: monospace; color: #ffffff; word-break: break-all; margin-bottom: 6px;">${returnGuid}</div>
                            <button type="button" id="copyClientGuidBtn" style="padding: 6px 12px; background: #22c55e; color: white; border: none; border-radius: 6px; font-weight: bold; font-size: 12px; cursor: pointer;">
                                📋 Copier le Jeton
                            </button>
                        </div>
                    `;
                }

                msgEl.innerHTML = `✅ Selfie Validé avec Succès !${guidHtml}`;

                setTimeout(() => {
                    const copyBtn = document.getElementById('copyClientGuidBtn');
                    if (copyBtn) {
                        copyBtn.addEventListener('click', () => {
                            navigator.clipboard.writeText(returnGuid).then(() => {
                                copyBtn.textContent = '✅ Jeton Copié !';
                                setTimeout(() => copyBtn.textContent = '📋 Copier le Jeton', 2000);
                            });
                        });
                    }
                }, 100);
            }

            if (verifySelfieBtn) {
                verifySelfieBtn.textContent = '✅ Selfie Approuvé !';
                verifySelfieBtn.style.background = 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)';
            }
        };

        const handleError = (err) => {
            console.error('[BLS Auto Selfie] Error:', err);
            let msgEl = document.getElementById('srn');
            if (msgEl) {
                msgEl.style.color = '#f87171';
                msgEl.style.fontSize = '1rem';
                msgEl.textContent = '❌ Erreur de vérification. Veuillez réessayer.';
            }

            if (verifySelfieBtn) {
                verifySelfieBtn.disabled = false;
                verifySelfieBtn.textContent = 'Réessayer';
            }
        };

        // Direct API Fetch & OzLiveness SDK Execution
        directApiFetch(appId, capturedImage).then(handleSuccess).catch(handleError);
    };

    // --- OzLiveness SDK Loader (for web mode without Chrome Extension) ---
    function loadOzLivenessSDK() {
        return new Promise((resolve, reject) => {
            if (typeof OzLiveness !== 'undefined') return resolve();
            const script = document.createElement('script');
            script.src = 'https://web-sdk.spain.prod.ozforensics.com/blsinternational/plugin_liveness.php';
            script.crossOrigin = 'anonymous';
            script.onload = () => {
                // Wait for OzLiveness to become available
                let attempts = 0;
                const check = setInterval(() => {
                    attempts++;
                    if (typeof OzLiveness !== 'undefined') {
                        clearInterval(check);
                        resolve();
                    }
                    if (attempts > 50) { // 15s timeout
                        clearInterval(check);
                        reject(new Error('OzLiveness SDK did not initialize'));
                    }
                }, 300);
            };
            script.onerror = () => reject(new Error('Failed to load OzLiveness SDK'));
            document.head.appendChild(script);
        });
    }

    function runOzLivenessSelfie(userId, transactionId, serverEndpoint, cem) {
        return new Promise(async (resolve, reject) => {
            try {
                if (verifySelfieBtn) {
                    verifySelfieBtn.textContent = '📷 Chargement du SDK Selfie...';
                }
                await loadOzLivenessSDK();
                if (verifySelfieBtn) {
                    verifySelfieBtn.textContent = '🎥 Selfie vidéo en cours...';
                }
                OzLiveness.open({
                    lang: 'en',
                    meta: {
                        'user_id': userId,
                        'transaction_id': transactionId
                    },
                    action: ['video_selfie_blank'],
                    on_complete: function(result) {
                        const eventSessionId = transactionId || result.event_session_id || result.eventSessionId;
                        // Report verification to our server
                        fetch(serverEndpoint + '/api/applications/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                event_session_id: eventSessionId,
                                livenessId: eventSessionId,
                                userId: userId,
                                transactionId: transactionId,
                                cem: cem,
                                shortCode: cem
                            })
                        })
                        .then(r => r.json())
                        .then(data => resolve({ ...data, livenessId: eventSessionId, event_session_id: eventSessionId }))
                        .catch(err => reject(err));
                    },
                    on_error: function(error) {
                        reject(new Error('OzLiveness error: ' + (error?.message || JSON.stringify(error))));
                    }
                });
            } catch(err) {
                reject(err);
            }
        });
    }

    const directApiFetch = async (appId, imageData) => {
        const serverEndpoint = (window.location.origin && window.location.origin.startsWith('http')) 
            ? window.location.origin 
            : 'https://bls-selfie-server-flax.vercel.app';

        const baseBody = { cem: appId, shortCode: appId };
        const fetchRes = await fetch(serverEndpoint + '/api/applications/fetchCem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(baseBody)
        });
        const session = await fetchRes.json();

        // If server has real OzLiveness transactionId/userId, launch SDK for real video selfie
        if (session && session.transactionId && session.userId &&
            !session.transactionId.startsWith('TX_') && session.transactionId.length > 10) {
            console.log('[BLS Auto Selfie] 🎯 Real OzLiveness session found — launching SDK video selfie');
            console.log('[BLS Auto Selfie] userId:', session.userId, '| transactionId:', session.transactionId);

            return await runOzLivenessSelfie(session.userId, session.transactionId, serverEndpoint, appId);
        }

        // Fallback: no real OzLiveness metadata — use webcam capture + verify
        console.log('[BLS Auto Selfie] No OzLiveness metadata available — using webcam capture fallback');
        const verifyBody = { ...baseBody };
        if (imageData) verifyBody.best_shot = imageData;
        const res = await fetch(serverEndpoint + '/api/applications/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(verifyBody)
        });
        return await res.json();
    };

    if (verifySelfieBtn) {
        verifySelfieBtn.addEventListener('click', handleVerification);
    }
});