function formatRemaining(ms) {
    // Round up so the display does not show 0s while a popup is still pending.
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
        return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
    }
    return `${seconds}s`;
}

function intervalLabel(intervalKey) {
    // Convert the content script's compact interval key into toolbar text.
    if (intervalKey === "30s") return "Every 30s";
    if (intervalKey === "2m") return "Every 2 min";
    if (intervalKey === "5m") return "Every 5 min";
    return "-";
}

function setText(id, text) {
    document.getElementById(id).textContent = text;
}

function clearError() {
    setText("error", "");
}

function setError(text) {
    setText("error", text);
}

function updateFromStatus(data) {
    // Mirror the current YouTube tab's guard state into the extension popup.
    setText("interval", intervalLabel(data.intervalKey));

    if (data.popupOpen) {
        setText("status", "Focus check is active");
        setText("remaining", "Waiting for answer");
        setText("message", "Solve it only if you want to continue intentionally.");
        return;
    }

    setText("status", "Next focus check scheduled");

    if (typeof data.remainingMs === "number") {
        setText("remaining", formatRemaining(data.remainingMs));
    } else {
        setText("remaining", "-");
    }

    setText("message", "Reminder: watch educational videos that make you smarter.");
}

function fetchStatus() {
    // The toolbar popup cannot read the page directly, so it asks the active
    // YouTube tab's content script for the current timer state.
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs || !tabs.length || !tabs[0].id) {
            setError("No active tab found.");
            return;
        }

        const tab = tabs[0];
        const url = tab.url || "";
        if (!url.startsWith("https://www.youtube.com/")) {
            setText("status", "Not on YouTube");
            setText("remaining", "-");
            setText("message", "Open YouTube to see your next study-focus check.");
            setText("interval", "-");
            clearError();
            return;
        }

        chrome.tabs.sendMessage(tab.id, { type: "YT_POPUP_STATUS" }, function (response) {
            // A reload usually fixes this because it reinjects the content
            // script on the YouTube tab.
            if (chrome.runtime.lastError || !response) {
                setError("Could not read Study Guard timer. Reload the YouTube tab once.");
                return;
            }

            clearError();
            updateFromStatus(response);
        });
    });
}

fetchStatus();
setInterval(fetchStatus, 1000);
