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

        // Capture webcam selfie in web mode (not inside extension)
        let capturedImage = null;
        const isInsideExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
        if (!isInsideExtension) {
            try {
                capturedImage = await captureWebcamFrame();
                if (capturedImage) console.log('[BLS Auto Selfie] ✅ Selfie webcam captured');
            } catch(e) {
                console.log('[BLS Auto Selfie] Webcam unavailable:', e.message);
            }
        }

        if (verifySelfieBtn) {
            verifySelfieBtn.textContent = 'Vérification en cours...';
        }

        const handleSuccess = (res) => {
            console.log('[BLS Auto Selfie] Response:', res);
            let msgEl = document.getElementById('srn');
            if (msgEl) {
                msgEl.style.color = '#4ade80';
                msgEl.style.fontSize = '1.1rem';
                msgEl.style.fontWeight = 'bold';
                msgEl.textContent = '✅ Selfie Validé avec Succès pour le Code : ' + appId;
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

        // 1. Try Chrome Extension messaging if running inside Chrome Extension
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            try {
                chrome.runtime.sendMessage({ action: 'fetchCem', cem: appId, shortCode: appId }, (response) => {
                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
                        directApiFetch(appId, capturedImage).then(handleSuccess).catch(handleError);
                    } else if (response) {
                        handleSuccess(response);
                    } else {
                        directApiFetch(appId, capturedImage).then(handleSuccess).catch(handleError);
                    }
                });
                return;
            } catch(e) {}
        }

        // 2. Direct Web / APK API Fetch
        directApiFetch(appId, capturedImage).then(handleSuccess).catch(handleError);
    };

    const directApiFetch = async (appId, imageData) => {
        const baseBody = { cem: appId, shortCode: appId };
        await fetch('/api/applications/fetchCem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(baseBody)
        });
        // Include selfie image in verify request so LivenessHandler can retrieve it
        const verifyBody = { ...baseBody };
        if (imageData) verifyBody.best_shot = imageData;
        const res = await fetch('/api/applications/verify', {
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