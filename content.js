(function () {
    // Content scripts can be reinjected by page navigation, so guard against
    // duplicate timers and duplicate popup markup on the same YouTube page.
    if (window.__ytPopupMathInitialized) return;
    window.__ytPopupMathInitialized = true;

    // Shared interval choices used by the popup controls and the scheduler.
    const INTERVAL_OPTIONS = {
        "30s": 30 * 1000,
        "2m": 2 * 60 * 1000,
        "5m": 5 * 60 * 1000
    };
    let selectedIntervalKey = "2m";
    let popupTimer = null;
    let nextPopupAt = null;

    function ensurePopupStyles() {
        // Inject styles once from the content script so the extension does not
        // need a separate stylesheet file or global CSS on YouTube.
        if (document.getElementById("yt-study-guard-styles")) return;

        const style = document.createElement("style");
        style.id = "yt-study-guard-styles";
        style.textContent = `
            #yt-popup-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background:
                    radial-gradient(circle at 20% 20%, rgba(255, 106, 77, 0.14), transparent 45%),
                    radial-gradient(circle at 80% 80%, rgba(14, 88, 136, 0.18), transparent 45%),
                    rgba(8, 12, 20, 0.78);
                backdrop-filter: blur(6px);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                box-sizing: border-box;
            }

            #yt-popup-panel {
                width: min(92vw, 760px);
                min-height: 400px;
                border-radius: 24px;
                background: linear-gradient(180deg, #ffffff 0%, #f6f8fb 100%);
                border: 1px solid rgba(0, 0, 0, 0.08);
                box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
                font-family: "Trebuchet MS", "Segoe UI", sans-serif;
                color: #111827;
                padding: 34px;
                display: flex;
                flex-direction: column;
                gap: 16px;
                text-align: center;
            }

            #yt-popup-kicker {
                margin: 0;
                font-size: 14px;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: #0f4c81;
                font-weight: 700;
            }

            #yt-popup-title {
                margin: 0;
                font-size: clamp(30px, 5vw, 44px);
                line-height: 1.1;
            }

            #yt-popup-subtitle {
                margin: 0 auto;
                max-width: 680px;
                font-size: clamp(16px, 2vw, 22px);
                color: #334155;
            }

            #yt-popup-reminder-label {
                margin: 2px 0 0;
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
            }

            #yt-popup-intervals {
                display: flex;
                justify-content: center;
                gap: 10px;
                flex-wrap: wrap;
                margin-top: 4px;
            }

            .yt-popup-interval {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: #ffffff;
                border: 1px solid #d7deea;
                border-radius: 999px;
                padding: 8px 14px;
                cursor: pointer;
                font-size: 16px;
                color: #334155;
                transition: all 0.2s ease;
            }

            .yt-popup-interval:hover {
                border-color: #94a3b8;
                transform: translateY(-1px);
            }

            .yt-popup-interval input {
                accent-color: #e11d48;
            }

            #yt-popup-equation {
                margin: 4px 0 2px;
                font-size: clamp(42px, 8vw, 64px);
                font-weight: 700;
                color: #0f172a;
            }

            #yt-popup-answer {
                width: min(360px, 100%);
                margin: 0 auto;
                padding: 14px 16px;
                border-radius: 12px;
                border: 1.5px solid #c8d1de;
                background: #ffffff;
                font-size: 26px;
                text-align: center;
                outline: none;
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
                box-sizing: border-box;
            }

            #yt-popup-answer:focus {
                border-color: #0f4c81;
                box-shadow: 0 0 0 3px rgba(15, 76, 129, 0.15);
            }

            #yt-popup-submit {
                width: min(360px, 100%);
                margin: 2px auto 0;
                border: none;
                border-radius: 12px;
                padding: 14px 16px;
                font-size: 22px;
                font-weight: 700;
                background: linear-gradient(135deg, #d7263d 0%, #b91c1c 100%);
                color: #fff;
                cursor: pointer;
                box-shadow: 0 10px 22px rgba(185, 28, 28, 0.28);
                transition: transform 0.18s ease, box-shadow 0.18s ease;
            }

            #yt-popup-submit:hover {
                transform: translateY(-1px);
                box-shadow: 0 14px 24px rgba(185, 28, 28, 0.34);
            }

            #yt-popup-error {
                margin: 4px 0 0;
                min-height: 26px;
                font-size: 18px;
                color: #b00020;
            }

        `;

        document.head.appendChild(style);
    }

    function getPopupStatus() {
        // The browser-action popup asks for this status every second.
        const remainingMs = nextPopupAt ? Math.max(0, nextPopupAt - Date.now()) : null;
        return {
            intervalKey: selectedIntervalKey,
            intervalMs: INTERVAL_OPTIONS[selectedIntervalKey],
            nextPopupAt,
            remainingMs,
            popupOpen: Boolean(document.getElementById("yt-popup-overlay"))
        };
    }

    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
            if (!message || message.type !== "YT_POPUP_STATUS") return;
            sendResponse(getPopupStatus());
        });
    }

    function scheduleNextPopup() {
        // Rescheduling clears the previous timeout so changing the interval
        // takes effect immediately.
        if (popupTimer) {
            clearTimeout(popupTimer);
        }

        const delay = INTERVAL_OPTIONS[selectedIntervalKey];
        nextPopupAt = Date.now() + delay;

        popupTimer = setTimeout(function () {
            const popupShown = showMathPopup();
            if (!popupShown) {
                scheduleNextPopup();
            }
        }, delay);
    }

    function getEquation() {
        // Keep the arithmetic small enough to be a focus check, not a chore.
        const left = Math.floor(Math.random() * 20) + 1;
        const right = Math.floor(Math.random() * 20) + 1;
        const operators = ["+", "-", "*"];
        const operator = operators[Math.floor(Math.random() * operators.length)];

        if (operator === "+") {
            return { question: `${left} + ${right}`, answer: left + right };
        }
        if (operator === "-") {
            return { question: `${left} - ${right}`, answer: left - right };
        }
        return { question: `${left} * ${right}`, answer: left * right };
    }

    function pauseYouTubeVideo() {
        // YouTube may replace the video element during navigation, so query it
        // each time instead of storing a stale element reference.
        const video = document.querySelector("video");
        if (!video) return false;

        try {
            if (!video.paused) {
                video.pause();
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    function showMathPopup() {
        // Do not stack multiple blocking overlays if the timer fires while one
        // is already open.
        if (document.getElementById("yt-popup-overlay")) return false;

        pauseYouTubeVideo();
        nextPopupAt = null;

        const equation = getEquation();

        const overlay = document.createElement("div");
        overlay.id = "yt-popup-overlay";

        const popup = document.createElement("div");
        popup.id = "yt-popup-panel";

        popup.innerHTML = `
            <p id="yt-popup-kicker">Focus Reminder</p>
            <h2 id="yt-popup-title">YouTube Study Guard</h2>
            <p id="yt-popup-subtitle">Use this to avoid random videos and stay focused on learning.</p>
            <p id="yt-popup-reminder-label">Keep reminding me every:</p>
            <div id="yt-popup-intervals">
                <label class="yt-popup-interval">
                    <input type="radio" name="yt-popup-interval" value="30s" ${selectedIntervalKey === "30s" ? "checked" : ""} />
                    Every 30s
                </label>
                <label class="yt-popup-interval">
                    <input type="radio" name="yt-popup-interval" value="2m" ${selectedIntervalKey === "2m" ? "checked" : ""} />
                    Every 2 min
                </label>
                <label class="yt-popup-interval">
                    <input type="radio" name="yt-popup-interval" value="5m" ${selectedIntervalKey === "5m" ? "checked" : ""} />
                    Every 5 min
                </label>
            </div>
            <p id="yt-popup-equation">${equation.question} = ?</p>
            <input id="yt-popup-answer" type="number" placeholder="Answer to continue" />
            <button id="yt-popup-submit">Stay Focused</button>
            <p id="yt-popup-error"></p>
        `;

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        const answerInput = document.getElementById("yt-popup-answer");
        const submitBtn = document.getElementById("yt-popup-submit");
        const errorText = document.getElementById("yt-popup-error");
        const intervalRadios = popup.querySelectorAll('input[name="yt-popup-interval"]');

        intervalRadios.forEach(function (radio) {
            radio.addEventListener("change", function (event) {
                // Persist the user's choice for this page session and restart
                // the timer from now.
                selectedIntervalKey = event.target.value;
                scheduleNextPopup();
            });
        });

        answerInput.focus();

        function validateAnswer() {
            // Number("") is 0, which is acceptable only when the real answer is
            // also 0; incorrect or empty answers keep the guard visible.
            const userAnswer = Number(answerInput.value);
            if (userAnswer === equation.answer) {
                overlay.remove();
                scheduleNextPopup();
                return;
            }
            errorText.textContent = "Not correct. If this video is not educational, stop now.";
            answerInput.select();
        }

        submitBtn.addEventListener("click", validateAnswer);
        answerInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                validateAnswer();
            }
        });

        return true;
    }

    ensurePopupStyles();
    showMathPopup();
})();
