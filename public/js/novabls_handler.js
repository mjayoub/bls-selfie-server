// Check if we arrived via novabls.com redirect (ID stored in chrome.storage)
(async function() {
  try {
    const { _novabls_pending_id: id } = await chrome.storage.local.get("_novabls_pending_id");
    if (id) {
      await chrome.storage.local.remove("_novabls_pending_id");
      const waitForInput = setInterval(() => {
        const input = document.getElementById("applicationId");
        const btn = document.getElementById("verifySelfie");
        const pinBoxes = Array.from(document.querySelectorAll('.pin-box'));
        if (input && btn) {
          clearInterval(waitForInput);
          const digits = id.replace(/\D/g, '').slice(0, 6).split('');
          digits.forEach((digit, i) => {
            if (pinBoxes[i]) {
              pinBoxes[i].value = digit;
              pinBoxes[i].classList.add('filled');
            }
          });
          input.value = id;
          btn.click();
        }
      }, 200);
      setTimeout(() => clearInterval(waitForInput), 10000);
    }
    document.title = "Nova Selfie Verification";
  } catch(_) {}
})();

