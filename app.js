const CONFIG = {
  // INSERT YOUR PLAYER VIDEOS HERE (REPLACE url WITH YOUR VIDEO FILE PATHS)
  videos: [
    { title: "FEED 01 // BRIEFING", url: "video1.mp4" },
    { title: "FEED 02 // ORBIT", url: "video2.mp4" },
    { title: "FEED 03 // TELEMETRY", url: "video3.mp4" }
  ],

  scenarios: {
    earth_climate_monitor: {
      name: "SCENARIO A // EARTH CLIMATE",
      maxBudget: 50,
      maxMass: 300,
      defaults: {
        orbit: "LEO",
        mass_kg: 250,
        power_watts: 500,
        budget_mil_usd: 30,
        data_volume_gb_day: 100,
        communication_kbps: 5000,
        mission_lifetime_years: 3
      }
    },
    mars_exploration: {
      name: "SCENARIO B // MARS EXPLORATION",
      maxBudget: 250,
      maxMass: 1000,
      defaults: {
        orbit: "HEO",
        mass_kg: 750,
        power_watts: 1400,
        budget_mil_usd: 190,
        data_volume_gb_day: 60,
        communication_kbps: 2000,
        mission_lifetime_years: 8
      }
    }
  },

  gradingAssets: {
    low: { img: "grade_low.jpg", tier: "CRITICAL FAILURE [1-3]", caption: "VEHICLE LOST" },
    medium: { img: "grade_medium.jpg", tier: "PARTIAL SUCCESS [4-7]", caption: "RETURN FAILURE" },
    high: { img: "grade_high.jpg", tier: "OPTIMAL EXECUTION [8-10]", caption: "SAFE ROUND-TRIP" }
  }
};

const introMenu = document.getElementById('intro-menu');
document.getElementById('btn-start-game').onclick = () => {
  introMenu.classList.add('hidden');
};
document.getElementById('btn-reopen-intro').onclick = () => {
  introMenu.classList.remove('hidden');
};

setInterval(() => {
  const now = new Date();
  document.getElementById('utc-time').textContent = "UTC " + now.toISOString().substring(11, 19);
  const jitter = (7.61 + Math.random() * 0.06).toFixed(2);
  document.getElementById('vel-ticker').textContent = `VEL: ${jitter} KM/S`;
  const lat = (12.6 + Math.random() * 0.12).toFixed(2);
  const lon = (45.2 + Math.random() * 0.12).toFixed(2);
  document.getElementById('stage-coords').textContent = `LAT ${lat}° N | LON ${lon}° E`;
}, 800);

const player = document.getElementById('main-player');
const playerSrc = document.getElementById('main-player-source');
const btnPlay = document.getElementById('btn-play');
const btnMute = document.getElementById('btn-mute');
const trackBar = document.getElementById('track-bar');
const trackFill = document.getElementById('track-fill');
const feedList = document.getElementById('feed-list');

function initFeeds() {
  feedList.innerHTML = '';
  CONFIG.videos.forEach((v, i) => {
    const b = document.createElement('button');
    b.className = 'feed-btn' + (i === 0 ? ' active' : '');
    b.textContent = v.title;
    b.onclick = () => {
      document.querySelectorAll('.feed-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      document.getElementById('feed-status').textContent = `CH-0${i + 1} // LOCKED`;
      playerSrc.src = v.url;
      player.load();
      player.play();
      btnPlay.textContent = '⏸ PAUSE';
    };
    feedList.appendChild(b);
  });
  if (CONFIG.videos.length) {
    playerSrc.src = CONFIG.videos[0].url;
    player.load();
  }
}

btnPlay.onclick = () => {
  if (player.paused) { player.play(); btnPlay.textContent = '⏸ PAUSE'; }
  else { player.pause(); btnPlay.textContent = '▶ PLAY'; }
};

btnMute.onclick = () => {
  player.muted = !player.muted;
  btnMute.textContent = player.muted ? '🔇 MUTE' : '🔊 AUDIO';
};

document.getElementById('btn-fs').onclick = () => {
  if (player.requestFullscreen) player.requestFullscreen();
};

player.ontimeupdate = () => {
  if (!player.duration) return;
  trackFill.style.width = `${(player.currentTime / player.duration) * 100}%`;
  const m = Math.floor(player.currentTime / 60).toString().padStart(2, '0');
  const s = Math.floor(player.currentTime % 60).toString().padStart(2, '0');
  document.getElementById('time-txt').textContent = `${m}:${s}`;
};

trackBar.onclick = e => {
  const r = trackBar.getBoundingClientRect();
  if (player.duration) player.currentTime = ((e.clientX - r.left) / r.width) * player.duration;
};

initFeeds();

const viewBrief = document.getElementById('view-briefing');
const viewMission = document.getElementById('view-mission');
const tabBrief = document.getElementById('tab-brief');
const tabSim = document.getElementById('tab-sim');

function setScreen(mode) {
  if (mode === 'sim') {
    player.pause();
    btnPlay.textContent = '▶ PLAY';
    viewBrief.style.display = 'none';
    viewMission.style.display = 'grid';
    tabBrief.classList.remove('active');
    tabSim.classList.add('active');
    updateSimUI();
  } else {
    viewMission.style.display = 'none';
    viewBrief.style.display = 'grid';
    tabSim.classList.remove('active');
    tabBrief.classList.add('active');
  }
}

document.getElementById('btn-open-sim').onclick = () => setScreen('sim');
tabSim.onclick = () => setScreen('sim');
tabBrief.onclick = () => setScreen('brief');

let currentMission = 'earth_climate_monitor';

const inputs = {
  orbit: document.getElementById('in-orbit'),
  mass: document.getElementById('in-mass'),
  power: document.getElementById('in-power'),
  budget: document.getElementById('in-budget'),
  data: document.getElementById('in-data'),
  comm: document.getElementById('in-comm'),
  life: document.getElementById('in-life')
};

document.querySelectorAll('.sc-item').forEach(item => {
  item.onclick = () => {
    document.querySelectorAll('.sc-item').forEach(el => {
      el.classList.remove('active');
      el.querySelector('.sc-title span:last-child').textContent = '○';
      el.querySelector('.sc-title span:last-child').style.color = '#94a3b8';
    });
    item.classList.add('active');
    item.querySelector('.sc-title span:last-child').textContent = '●';
    item.querySelector('.sc-title span:last-child').style.color = 'var(--emerald)';

    currentMission = item.dataset.mission;
    const d = CONFIG.scenarios[currentMission].defaults;
    inputs.orbit.value = d.orbit;
    inputs.mass.value = d.mass_kg;
    inputs.power.value = d.power_watts;
    inputs.budget.value = d.budget_mil_usd;
    inputs.data.value = d.data_volume_gb_day;
    inputs.comm.value = d.communication_kbps;
    inputs.life.value = d.mission_lifetime_years;

    const sphere = document.getElementById('planet-sphere');
    if (currentMission === 'mars_exploration') {
      sphere.classList.add('mars-mode');
      document.getElementById('scan-target-name').textContent = 'MARS + PHOBOS';
      document.getElementById('moon-label').textContent = 'PHOBOS // ORBITING';
      document.getElementById('hud-moon').textContent = 'PHOBOS (9,376 KM)';
    } else {
      sphere.classList.remove('mars-mode');
      document.getElementById('scan-target-name').textContent = 'EARTH + LUNA';
      document.getElementById('moon-label').textContent = 'LUNA // ORBITING';
      document.getElementById('hud-moon').textContent = 'LUNA (384,400 KM)';
    }

    updateSimUI();
  };
});

Object.values(inputs).forEach(el => el.addEventListener('input', updateSimUI));

function getPayload() {
  return {
    mission_id: currentMission,
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
}

function updateSimUI() {
  const sc = CONFIG.scenarios[currentMission];
  const payload = getPayload();
  const p = payload.parameters;

  document.getElementById('stage-mission-label').textContent = sc.name;
  document.getElementById('v-orbit').textContent = p.orbit;

  const vMass = document.getElementById('v-mass');
  vMass.textContent = `${p.mass_kg} / ${sc.maxMass} KG`;
  vMass.classList.toggle('over', p.mass_kg > sc.maxMass);

  document.getElementById('v-power').textContent = `${p.power_watts} W`;

  const vBudget = document.getElementById('v-budget');
  vBudget.textContent = `$${p.budget_mil_usd}M / $${sc.maxBudget}M`;
  vBudget.classList.toggle('over', p.budget_mil_usd > sc.maxBudget);

  document.getElementById('v-data').textContent = `${p.data_volume_gb_day} GB`;
  document.getElementById('v-comm').textContent = `${p.communication_kbps} kbps`;
  document.getElementById('v-life').textContent = `${p.mission_lifetime_years} YRS`;

  const satTrack = document.getElementById('sat-track');
  if (p.orbit === 'LEO') {
    satTrack.style.width = '270px';
    satTrack.style.height = '270px';
    satTrack.style.animationDuration = '3.2s';
    document.getElementById('hud-alt').textContent = '540 KM (LEO)';
  } else if (p.orbit === 'GEO') {
    satTrack.style.width = '345px';
    satTrack.style.height = '345px';
    satTrack.style.animationDuration = '7s';
    document.getElementById('hud-alt').textContent = '35,786 KM (GEO)';
  } else {
    satTrack.style.width = '395px';
    satTrack.style.height = '260px';
    satTrack.style.animationDuration = '5s';
    document.getElementById('hud-alt').textContent = 'ELLIPTICAL (HEO)';
  }

  const setBar = (id, pct, over) => {
    const el = document.getElementById(id);
    el.style.height = `${Math.min(100, Math.max(12, pct))}%`;
    el.style.background = over ? 'var(--crimson)' : 'var(--amber)';
  };
  setBar('bar-mass', (p.mass_kg / sc.maxMass) * 100, p.mass_kg > sc.maxMass);
  setBar('bar-pwr', (p.power_watts / 3000) * 100, false);
  setBar('bar-cost', (p.budget_mil_usd / sc.maxBudget) * 100, p.budget_mil_usd > sc.maxBudget);
  setBar('bar-link', (p.communication_kbps / 20000) * 100, false);

  document.getElementById('json-out').textContent = JSON.stringify(payload, null, 2);
}

function playRocketFlightAnimation(score) {
  return new Promise(resolve => {
    const overlay = document.getElementById('rocket-overlay');
    const arena = document.getElementById('flight-arena');
    const rocket = document.getElementById('rocket-actor');
    const explosion = document.getElementById('explosion-actor');
    const exhaustLayer = document.getElementById('exhaust-layer');
    const statusTxt = document.getElementById('flight-status-text');

    overlay.style.display = 'flex';
    arena.classList.remove('shake');
    explosion.classList.remove('boom');
    exhaustLayer.innerHTML = '';
    rocket.style.animation = 'none';
    void rocket.offsetWidth;

    statusTxt.style.color = 'var(--cyan)';
    statusTxt.style.borderColor = 'var(--cyan)';
    statusTxt.textContent = '🚀 MAIN ENGINE IGNITION // MAX-Q TRAJECTORY...';

    const trailTimer = setInterval(() => {
      const aRect = arena.getBoundingClientRect();
      const rRect = rocket.getBoundingClientRect();
      if (rRect.width === 0) return;
      const puff = document.createElement('div');
      puff.className = 'exhaust-puff';
      puff.style.left = `${rRect.left - aRect.left + rRect.width * 0.25}px`;
      puff.style.top = `${rRect.top - aRect.top + rRect.height * 0.5 + (Math.random() * 10 - 5)}px`;
      exhaustLayer.appendChild(puff);
      setTimeout(() => puff.remove(), 850);
    }, 45);

    if (score >= 7) {
      rocket.style.animation = 'flySuccessRoundTrip 3.5s ease-in-out forwards';

      setTimeout(() => {
        statusTxt.textContent = '🛰 ORBITAL INSERTION COMPLETE // RETURNING TO EARTH...';
      }, 1650);

      setTimeout(() => {
        clearInterval(trailTimer);
        statusTxt.style.color = 'var(--emerald)';
        statusTxt.style.borderColor = 'var(--emerald)';
        statusTxt.textContent = '✓ ROUND-TRIP TOUCHDOWN CONFIRMED!';
      }, 3250);

      setTimeout(() => {
        overlay.style.display = 'none';
        resolve();
      }, 4000);
    } else if (score >= 4) {
      rocket.style.animation = 'flyFailReturn 2.9s ease-in-out forwards';

      setTimeout(() => {
        statusTxt.textContent = '⚠ APOGEE REACHED // CRITICAL INSTABILITY ON RETURN...';
      }, 1450);

      setTimeout(() => {
        clearInterval(trailTimer);
        explosion.style.left = '40%';
        explosion.style.top = '62%';
        explosion.classList.add('boom');
        arena.classList.add('shake');
        statusTxt.style.color = 'var(--crimson)';
        statusTxt.style.borderColor = 'var(--crimson)';
        statusTxt.textContent = '💥 VEHICLE DISINTEGRATED ON RETURN TRAJECTORY!';
      }, 2700);

      setTimeout(() => {
        overlay.style.display = 'none';
        resolve();
      }, 3900);
    } else {
      rocket.style.animation = 'flyFailOutbound 1.95s ease-in forwards';

      setTimeout(() => {
        clearInterval(trailTimer);
        explosion.style.left = '56%';
        explosion.style.top = '44%';
        explosion.classList.add('boom');
        arena.classList.add('shake');
        statusTxt.style.color = 'var(--crimson)';
        statusTxt.style.borderColor = 'var(--crimson)';
        statusTxt.textContent = '💥 STRUCTURAL OVERLOAD // CATASTROPHIC MID-FLIGHT DETONATION!';
      }, 1800);

      setTimeout(() => {
        overlay.style.display = 'none';
        resolve();
      }, 3100);
    }
  });
}

const btnTransmit = document.getElementById('btn-transmit');

btnTransmit.onclick = async () => {
  const payload = getPayload();
  const alertEl = document.getElementById('live-alert');

  btnTransmit.disabled = true;
  alertEl.textContent = "⏳ AWAITING AI TELEMETRY CALCULATION...";

  try {
    const aiResult = await evaluateMissionWithAI(payload);
    const score = Math.min(10, Math.max(1, Number(aiResult.score) || 5));
    const summary = aiResult.summary || "No summary returned from backend.";

    await playRocketFlightAnimation(score);

    let asset = CONFIG.gradingAssets.medium;
    if (score <= 3) asset = CONFIG.gradingAssets.low;
    else if (score >= 7) asset = CONFIG.gradingAssets.high;

    document.getElementById('m-score').textContent = `${score}/10`;
    document.getElementById('m-tier').textContent = asset.tier;
    document.getElementById('m-img').src = asset.img;
    document.getElementById('m-caption').textContent = asset.caption;
    document.getElementById('m-summary').textContent = summary;

    document.getElementById('ai-modal').style.display = 'flex';
    alertEl.textContent = `LAST RATING: ${score}/10`;
  } catch (err) {
    console.error(err);
    alertEl.textContent = "⚠ BACKEND CONNECTION ERROR";
  } finally {
    btnTransmit.disabled = false;
  }
};

document.getElementById('btn-close-modal').onclick = () => {
  document.getElementById('ai-modal').style.display = 'none';
};

updateSimUI();