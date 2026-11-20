const API_URL = "http://127.0.0.1:8000/predict";

const form = document.getElementById("predict-form");
const submitBtn = document.getElementById("submit-btn");
const scoreValueEl = document.getElementById("score-value");
const scoreRingEl = document.getElementById("score-ring");
const resultTextEl = document.getElementById("result-text");
const statusBadgeEl = document.getElementById("status-badge");
const endpointLabelEl = document.getElementById("endpoint-label");

endpointLabelEl.textContent = API_URL.replace(/^https?:\/\//, "");

function updateScoreVisual(score) {
  const clamped = Math.max(0, Math.min(10, score));
  const deg = Math.round((clamped / 10) * 360);

  let ringColor = "#10b981";
  let note = "Strong wellness signal based on your current daily habits.";

  if (clamped < 4) {
    ringColor = "#ef4444";
    note = "Elevated strain detected — better sleep, physical activity, or lower screen time may help.";
  } else if (clamped < 7) {
    ringColor = "#f59e0b";
    note = "Balanced overall — small improvements in rest or stress management can lift your score.";
  }

  scoreValueEl.textContent = clamped.toFixed(2);
  scoreRingEl.style.setProperty("--ring-color", ringColor);
  scoreRingEl.style.setProperty("--ring-deg", `${deg}deg`);

  resultTextEl.classList.remove("error");
  resultTextEl.innerHTML = `<strong>Score ${clamped.toFixed(2)} / 10:</strong> ${note}`;
  statusBadgeEl.textContent = "Predicted";
  statusBadgeEl.className = "status-pill success";
}

function showErrorVisual(message) {
  resultTextEl.classList.add("error");
  resultTextEl.textContent = message;
  statusBadgeEl.textContent = "Error";
  statusBadgeEl.className = "status-pill error";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    age: Number.parseInt(document.getElementById("age").value, 10),
    gender: document.getElementById("gender").value,
    country: document.getElementById("country").value.trim(),
    academic_level: document.getElementById("academic_level").value,
    most_used_platform: document.getElementById("most_used_platform").value,
    purpose_of_use: document.getElementById("purpose_of_use").value,
    avg_daily_usage_hours: Number.parseFloat(document.getElementById("avg_daily_usage_hours").value),
    daily_unlocks: Number.parseInt(document.getElementById("daily_unlocks").value, 10),
    study_hours: Number.parseFloat(document.getElementById("study_hours").value),
    physical_activity_hours: Number.parseFloat(document.getElementById("physical_activity_hours").value),
    sleep_hours_per_night: Number.parseFloat(document.getElementById("sleep_hours_per_night").value),
    stress_level: document.getElementById("stress_level").value,
  };

  const invalidNum = [
    payload.age,
    payload.avg_daily_usage_hours,
    payload.daily_unlocks,
    payload.study_hours,
    payload.physical_activity_hours,
    payload.sleep_hours_per_night,
  ].some((n) => Number.isNaN(n));

  if (invalidNum || !payload.country) {
    showErrorVisual("Please enter valid values in all fields.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.querySelector("span").textContent = "Predicting...";
  statusBadgeEl.textContent = "Loading...";
  statusBadgeEl.className = "status-pill";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const rawText = await res.text();
    const data = rawText ? JSON.parse(rawText) : null;

    if (!res.ok) {
      const errMsg = data?.detail
        ? typeof data.detail === "string"
          ? data.detail
          : JSON.stringify(data.detail)
        : `Request failed (${res.status})`;
      throw new Error(errMsg);
    }

    const score = Number(data?.predicted_mental_health_score);
    if (Number.isNaN(score)) {
      throw new Error("Invalid score format returned by API.");
    }

    updateScoreVisual(score);
  } catch (err) {
    showErrorVisual(`Could not predict: ${err.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector("span").textContent = "Predict Score";
  }
});