const CONFIG = {
  videos: [
    { title: "CH-01 // Launch Complex 39A", url: "video1.mp4" },
    { title: "CH-02 // Upper Stage Separation", url: "video2.mp4" },
    { title: "CH-03 // Deep Space Network", url: "video3.mp4" }
  ],
  scenarios: {
    earth_climate_monitor: { maxBudget: 50, maxMass: 300 },
    mars_exploration: { maxBudget: 250, maxMass: 1000 }
  }
};

let currentMission = 'earth_climate_monitor';

// Navigation between the 4 views
function switchView(targetId) {
  document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  
  const targetView = document.getElementById(`view-${targetId}`);
  if (targetView) targetView.classList.add('active');
  
  const targetNav = document.querySelector(`.nav-btn[data-target="${targetId}"]`);
  if (targetNav) targetNav.classList.add('active');
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.onclick = () => switchView(btn.dataset.target);
});

// UTC Clock ticker
setInterval(() => {
  const now = new Date();
  document.getElementById('utc-clock').textContent = "UTC " + now.toISOString().substring(11, 19);
}, 1000);

// Video Feed Selector
const videoPlayer = document.getElementById('main-video-player');
const videoSource = document.getElementById('video-source');
document.querySelectorAll('.feed-select-btn[data-src]').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.feed-select-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    videoSource.src = btn.dataset.src;
    videoPlayer.load();
    videoPlayer.play();
  };
});
if (CONFIG.videos.length) {
  videoSource.src = CONFIG.videos[0].url;
  videoPlayer.load();
}

// Rocket Builder State
let rocketConfig = {
  components: { payload: "capsule_shield_full", avionics: "full_avionics", orbital_stage: "terrier_1200", booster_stage: "swivel_2350", aero: "fairing_and_4fins" },
  staging_sequence: "correct_bottom_up",
  metrics: { total_deltav_ms: 3550, launch_twr: 1.45, is_flight_ready: true }
};

function updateRocketBuilder() {
  let dv = 3550;
  let twr = 1.45;
  if (rocketConfig.components.booster_stage === 'reliant_2500') { dv = 3700; twr = 1.65; }
  if (rocketConfig.components.booster_stage === 'weak_1800') { dv = 2900; twr = 0.92; }

  document.getElementById('bld-deltav').textContent = `${dv} m/s`;
  document.getElementById('bld-twr').textContent = twr.toFixed(2);
  document.getElementById('builder-json-out').textContent = JSON.stringify(rocketConfig, null, 2);
}

document.querySelectorAll('.part-option-btn').forEach(btn => {
  btn.onclick = () => {
    const group = btn.dataset.group;
    const val = btn.dataset.val;
    document.querySelectorAll(`.part-option-btn[data-group="${group}"]`).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    rocketConfig.components[group] = val;
    updateRocketBuilder();
  };
});

document.getElementById('bld-staging').onchange = (e) => {
  rocketConfig.staging_sequence = e.target.value;
  updateRocketBuilder();
};

// Mission Sim Inputs
const inputs = {
  orbit: document.getElementById('in-orbit'),
  mass: document.getElementById('in-mass'),
  power: document.getElementById('in-power'),
  budget: document.getElementById('in-budget'),
  data: document.getElementById('in-data'),
  comm: document.getElementById('in-comm'),
  life: document.getElementById('in-life')
};

function setMission(mKey) {
  currentMission = mKey;
  if (mKey === 'mars_exploration') {
    inputs.mass.value = 750;
    inputs.budget.value = 190;
    inputs.power.value = 1400;
  } else {
    inputs.mass.value = 250;
    inputs.budget.value = 30;
    inputs.power.value = 500;
  }
  updateSimLabels();
}

function updateSimLabels() {
  document.getElementById('v-orbit').textContent = inputs.orbit.value;
  document.getElementById('v-mass').textContent = inputs.mass.value + ' kg';
  document.getElementById('v-power').textContent = inputs.power.value + ' W';
  document.getElementById('v-budget').textContent = '$' + inputs.budget.value + 'M';
  document.getElementById('v-data').textContent = inputs.data.value + ' GB';
  document.getElementById('v-comm').textContent = inputs.comm.value + ' kbps';
  document.getElementById('v-life').textContent = inputs.life.value + ' YRS';
}

Object.values(inputs).forEach(el => el.addEventListener('input', updateSimLabels));

// Mission Launch & AI evaluation
const btnLaunch = document.getElementById('btn-launch-mission');
let lastPayload = null;

btnLaunch.onclick = async () => {
  lastPayload = {
    mission_id: currentMission,
    rocket_assembly: rocketConfig,
    parameters: {
      orbit: inputs.orbit.value,
      mass_kg: Number(inputs.mass.value),
      power_watts: Number(inputs.power.value),
      budget_mil_usd: Number(inputs.budget.value),
      data_volume_gb_day: Number(inputs.data.value),
      communication_kbps: Number(inputs.comm.value),
      mission_lifetime_years: Number(inputs.life.value)
    }
  };

  const overlay = document.getElementById('flight-overlay');
  overlay.style.display = 'flex';
  
  setTimeout(async () => {
    overlay.style.display = 'none';
    try {
      const aiRes = await evaluateMissionWithAI(lastPayload);
      document.getElementById('m-score').textContent = `${aiRes.score}/10`;
      document.getElementById('m-summary').textContent = aiRes.summary;
      document.getElementById('ai-modal').style.display = 'flex';
    } catch (e) {
      console.error(e);
    }
  }, 2000);
};

// AI Chat inside modal
const chatInput = document.getElementById('ai-chat-input');
const chatSend = document.getElementById('ai-chat-send');
const chatMsgs = document.getElementById('ai-chat-msgs');

chatSend.onclick = async () => {
  const txt = chatInput.value.trim();
  if (!txt) return;
  chatMsgs.innerHTML += `<div>User: ${txt}</div>`;
  chatInput.value = '';

  try {
    const resp = await fetch('/api/evaluate-mission', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lastPayload, user_question: txt })
    });
    const data = await resp.json();
    chatMsgs.innerHTML += `<div style="color:var(--nasa-light-blue);">AI: ${data.summary}</div>`;
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
  } catch(err) {
    chatMsgs.innerHTML += `<div style="color:red;">Error connecting to AI.</div>`;
  }
};

updateRocketBuilder();
updateSimLabels();