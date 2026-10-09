// GeoGuard AI - Dhanbad District Slope Stability & Early Warning System

document.addEventListener('DOMContentLoaded', () => {
  // Base API URL (Relative path ensures compatibility with any hostname, LAN IP, or port)
  const API_BASE = window.location.origin;

  // Global State
  const state = {
    stations: JSON.parse(JSON.stringify(INITIAL_STATIONS)),
    activeStationId: null,
    stationHistories: {},
    activeFilter: 'ALL',
    searchQuery: '',
    sirenEnabled: true,
    audioContext: null,
    isSirenPlaying: false,
    markers: {},
    hazardCircles: {},
    primaryMap: null,
    detailMap: null,
    detailMapLayers: {
      sat: null,
      topo: null,
      activeLayer: 'sat'
    },
    detailMapElements: [],
    charts: {
      moistureRain: null,
      tilt: null,
      fos: null
    },
    evacuationRoutes: (typeof EVACUATION_ROUTES !== 'undefined') ? JSON.parse(JSON.stringify(EVACUATION_ROUTES)) : [],
    medicalCentres: (typeof MEDICAL_CENTRES !== 'undefined') ? JSON.parse(JSON.stringify(MEDICAL_CENTRES)) : [],
    reliefCentres: (typeof RELIEF_CENTRES !== 'undefined') ? JSON.parse(JSON.stringify(RELIEF_CENTRES)) : [],
    weatherForecasts: (typeof WEATHER_FORECASTS !== 'undefined') ? WEATHER_FORECASTS : {},
    incidentReports: [],
    missingPersons: [],
    dem3dViewer: null,
    weatherHourlyChart: null,
    gisRouteLayers: [],
    gisShelterMarkers: []
  };

  // Pre-evaluate risk for all Dhanbad stations
  state.stations.forEach(station => {
    station.risk = predictionEngine.evaluateStationRisk(station);
    state.stationHistories[station.id] = generateStationHistory(station, 24);
  });

  // Default active station is Jharia Overburden Dump
  const defaultHigh = state.stations.find(s => s.risk.riskLevel === 'HIGH') || state.stations[0];
  state.activeStationId = defaultHigh.id;

  // Initialize Modules
  initAudioSystem();
  initPrimaryMap();
  initDetailMap();
  initHelplinesModal();
  initBroadcastModal();
  initSitrepModal();
  initSearchAndFilter();
  initSimulatorControls();
  initHeaderControls();
  updateHeaderStats();
  startTelemetryLiveStream();

  // Initialize New Advanced Authority Tactical Modules
  initDem3DModal();
  initMedicalAlertModal();
  initCasualtyDeskModal();
  initMissingRegistryModal();
  initRouteManagerModal();
  initWeatherModal();
  fetchBackendDynamicData();

  // ==================== 1. PRIMARY MAP (DHANBAD OVERVIEW) ====================
  function initPrimaryMap() {
    // Centered on Dhanbad District: 23.7957° N, 86.4304° E
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([23.7957, 86.4304], 11);

    // Dark tactical map layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    state.primaryMap = map;
    renderStationMarkers();
  }

  function renderStationMarkers() {
    Object.values(state.markers).forEach(m => state.primaryMap.removeLayer(m));
    Object.values(state.hazardCircles).forEach(c => state.primaryMap.removeLayer(c));
    state.markers = {};
    state.hazardCircles = {};

    const filtered = getFilteredStations();

    filtered.forEach(station => {
      const { riskLevel, color } = station.risk;
      let pinClass = 'pin-safe';
      if (riskLevel === 'HIGH') pinClass = 'pin-high';
      else if (riskLevel === 'MODERATE') pinClass = 'pin-moderate';

      const customIcon = L.divIcon({
        className: 'custom-pin-wrapper',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        html: `
          <div class="custom-pin-container ${pinClass}">
            <div class="radar-ring"></div>
            <div class="pin-anchor">
              <i class="fa-solid fa-triangle-exclamation" style="font-size: 13px;"></i>
            </div>
            <div class="pin-label-badge" style="border-color: ${color};">
              ${station.name.split(' ')[0]}
            </div>
          </div>
        `
      });

      const marker = L.marker([station.lat, station.lng], { icon: customIcon }).addTo(state.primaryMap);

      marker.on('click', () => {
        selectStation(station.id);
      });

      state.markers[station.id] = marker;

      // Hazard buffer circle for High Risk stations (2.5 km radius)
      if (riskLevel === 'HIGH') {
        const hazardCircle = L.circle([station.lat, station.lng], {
          radius: 2500,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: '4, 8'
        }).addTo(state.primaryMap);
        hazardCircle.bindTooltip(`Hazard Zone: ${station.settlement.sectorName}`, { permanent: false });
        state.hazardCircles[station.id] = hazardCircle;
      }
    });

    // Render Damaged Routes, Alternate Safe Corridors & Relief Shelters on GIS Map
    renderMapRoutesAndShelters();
  }

  // ==================== 2. DETAILED MICRO-SECTOR MAP ====================
  function initDetailMap() {
    const detailMap = L.map('detail-map', {
      zoomControl: true,
      attributionControl: false
    }).setView([23.7441, 86.4150], 16);

    // High-Resolution Satellite Layer (Esri World Imagery)
    const satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19
    });

    // Topographic Terrain Layer
    const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17
    });

    satLayer.addTo(detailMap);
    state.detailMapLayers.sat = satLayer;
    state.detailMapLayers.topo = topoLayer;
    state.detailMap = detailMap;

    // Toggle layer buttons
    const btnSat = document.getElementById('btn-layer-sat');
    const btnTopo = document.getElementById('btn-layer-topo');

    btnSat.addEventListener('click', () => {
      btnSat.classList.add('active');
      btnTopo.classList.remove('active');
      detailMap.removeLayer(state.detailMapLayers.topo);
      state.detailMapLayers.sat.addTo(detailMap);
      state.detailMapLayers.activeLayer = 'sat';
    });

    btnTopo.addEventListener('click', () => {
      btnTopo.classList.add('active');
      btnSat.classList.remove('active');
      detailMap.removeLayer(state.detailMapLayers.sat);
      state.detailMapLayers.topo.addTo(detailMap);
      state.detailMapLayers.activeLayer = 'topo';
    });
  }

  function renderMicroSectorMap(station) {
    if (!state.detailMap) return;

    // Center micro map on the station at zoom 16
    state.detailMap.setView([station.lat, station.lng], 16);

    // Update coordinates badge
    const coordsEl = document.getElementById('micro-map-coords');
    if (coordsEl) {
      coordsEl.innerHTML = `<i class="fa-solid fa-crosshairs"></i> Lat: ${station.lat.toFixed(4)}° N | Lng: ${station.lng.toFixed(4)}° E | ${station.elevation}`;
    }

    // Clear previous micro map elements
    state.detailMapElements.forEach(el => state.detailMap.removeLayer(el));
    state.detailMapElements = [];

    const layout = station.microLayout;
    if (!layout) return;

    // 1. Danger Zone Slip Perimeter Polygon
    if (layout.dangerZone) {
      const dangerPoly = L.polygon(layout.dangerZone, {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.25,
        weight: 2,
        dashArray: '5, 5'
      }).addTo(state.detailMap);
      dangerPoly.bindTooltip(`<strong>Critical Slide Boundary</strong><br>${station.name}`, { permanent: false });
      state.detailMapElements.push(dangerPoly);
    }

    // 2. Safe Evacuation Path Polyline
    if (layout.evacRoute) {
      const routeLine = L.polyline(layout.evacRoute, {
        color: '#10b981',
        weight: 3.5,
        dashArray: '6, 6'
      }).addTo(state.detailMap);
      routeLine.bindTooltip(`<strong>Designated Evacuation Corridor</strong><br>${station.settlement.evacuationRoute}`, { permanent: false });
      state.detailMapElements.push(routeLine);
    }

    // Helper to create micro probe icons
    function createProbeIcon(iconClass, bgColor, borderColor = '#ffffff') {
      return L.divIcon({
        className: 'probe-div-icon',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        html: `
          <div class="probe-marker-icon" style="background: ${bgColor}; border-color: ${borderColor};">
            <i class="fa-solid ${iconClass}" style="color: white; font-size: 11px;"></i>
          </div>
        `
      });
    }

    // 3. Borehole Inclinometer Probe
    if (layout.inclinometer) {
      const incMarker = L.marker([layout.inclinometer.lat, layout.inclinometer.lng], {
        icon: createProbeIcon('fa-circle-dot', '#0284c7', '#38bdf8')
      }).addTo(state.detailMap);
      incMarker.bindPopup(`
        <div style="font-size: 12px; color: #0f172a;">
          <strong>${layout.inclinometer.label}</strong><br>
          Depth: 15m Borehole<br>
          Tilt Angle: ${station.sensors.tilt.x}° X | ${station.sensors.tilt.y}° Y<br>
          Velocity: ${station.sensors.tilt.rateOfChange}°/hr
        </div>
      `);
      state.detailMapElements.push(incMarker);
    }

    // 4. Soil Moisture Sensor Array
    if (layout.moistureArray) {
      const moistMarker = L.marker([layout.moistureArray.lat, layout.moistureArray.lng], {
        icon: createProbeIcon('fa-droplet', '#2563eb', '#60a5fa')
      }).addTo(state.detailMap);
      moistMarker.bindPopup(`
        <div style="font-size: 12px; color: #0f172a;">
          <strong>${layout.moistureArray.label}</strong><br>
          VWC: ${station.sensors.soilMoisture.toFixed(1)}% Saturation<br>
          Pore Pressure: ${station.sensors.porePressure.toFixed(1)} kPa
        </div>
      `);
      state.detailMapElements.push(moistMarker);
    }

    // 5. Rain Gauge Tower
    if (layout.rainGauge) {
      const rainMarker = L.marker([layout.rainGauge.lat, layout.rainGauge.lng], {
        icon: createProbeIcon('fa-cloud-showers-heavy', '#1d4ed8', '#93c5fd')
      }).addTo(state.detailMap);
      rainMarker.bindPopup(`
        <div style="font-size: 12px; color: #0f172a;">
          <strong>${layout.rainGauge.label}</strong><br>
          Intensity: ${station.sensors.rainfallRate.toFixed(1)} mm/h<br>
          24h Accumulation: ${station.sensors.rainfallAccum24h.toFixed(1)} mm
        </div>
      `);
      state.detailMapElements.push(rainMarker);
    }

    // 6. LoRa Solar Repeater Mast
    if (layout.loraGateway) {
      const loraMarker = L.marker([layout.loraGateway.lat, layout.loraGateway.lng], {
        icon: createProbeIcon('fa-tower-broadcast', '#7c3aed', '#c084fc')
      }).addTo(state.detailMap);
      loraMarker.bindPopup(`
        <div style="font-size: 12px; color: #0f172a;">
          <strong>${layout.loraGateway.label}</strong><br>
          Frequency: ${station.lora.frequency}<br>
          Signal RSSI: ${station.lora.rssi} dBm | SNR: ${station.lora.snr} dB<br>
          Solar Battery: ${station.lora.batteryPercent}% (${station.lora.batteryVoltage}V)
        </div>
      `);
      state.detailMapElements.push(loraMarker);
    }

    // 7. Safe Relief Shelter
    if (layout.shelterCoord) {
      const shelterMarker = L.marker(layout.shelterCoord, {
        icon: createProbeIcon('fa-person-shelter', '#059669', '#34d399')
      }).addTo(state.detailMap);
      shelterMarker.bindPopup(`
        <div style="font-size: 12px; color: #0f172a;">
          <strong>Safe Emergency Assembly Center</strong><br>
          Shelter: ${station.settlement.nearestShelter}<br>
          Capacity: ${station.settlement.shelterCapacity} Persons
        </div>
      `);
      state.detailMapElements.push(shelterMarker);
    }

    // Smoothly invalidate size so tiles render immediately
    setTimeout(() => {
      state.detailMap.invalidateSize();
    }, 250);
  }

  // ==================== SELECT & OPEN STATION DETAILS ====================
  function selectStation(stationId) {
    state.activeStationId = stationId;
    const station = state.stations.find(s => s.id === stationId);
    if (!station) return;

    // Pan primary map smoothly to chosen Dhanbad station
    state.primaryMap.flyTo([station.lat, station.lng], 13, { duration: 1.2 });

    // Populate drawer UI & render the secondary detailed micro-map
    renderStationDrawer(station);

    // Open drawer
    const drawer = document.getElementById('tech-drawer');
    drawer.classList.add('drawer-open');

    // Trigger siren audio if High Risk
    if (station.risk.riskLevel === 'HIGH' && state.sirenEnabled) {
      playEmergencySirenAlert(station);
    }
  }

  function renderStationDrawer(station) {
    const { risk } = station;
    
    // Header details
    document.getElementById('drawer-station-name').textContent = station.name;
    document.getElementById('drawer-station-region').textContent = station.region;
    document.getElementById('drawer-lora-id').textContent = `LoRa: ${station.id}`;
    
    // Risk badge
    const badge = document.getElementById('drawer-risk-badge');
    badge.className = 'badge-risk';
    if (risk.riskLevel === 'HIGH') {
      badge.classList.add('risk-high');
      badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> HIGH RISK: EVACUATION';
    } else if (risk.riskLevel === 'MODERATE') {
      badge.classList.add('risk-moderate');
      badge.innerHTML = '<i class="fa-solid fa-bell"></i> MODERATE WATCH';
    } else {
      badge.classList.add('risk-safe');
      badge.innerHTML = '<i class="fa-solid fa-shield-check"></i> SAFE STABILITY';
    }

    // Render Detailed Micro-Sector Map
    renderMicroSectorMap(station);

    // Update sensor metric cards
    const { sensors, lora } = station;
    
    // Moisture
    document.getElementById('val-moisture').textContent = sensors.soilMoisture.toFixed(1);
    const barMoisture = document.getElementById('bar-moisture');
    barMoisture.style.width = `${Math.min(100, sensors.soilMoisture)}%`;
    barMoisture.style.background = sensors.soilMoisture > 75 ? '#ef4444' : sensors.soilMoisture > 50 ? '#f59e0b' : '#38bdf8';
    document.getElementById('sub-moisture-sat').textContent = sensors.soilMoisture > 80 ? 'Critical' : sensors.soilMoisture > 50 ? 'Elevated' : 'Normal';

    // Rainfall
    document.getElementById('val-rainfall').textContent = sensors.rainfallRate.toFixed(1);
    document.getElementById('val-rainfall-24h').textContent = `${sensors.rainfallAccum24h.toFixed(1)} mm`;
    const barRain = document.getElementById('bar-rainfall');
    barRain.style.width = `${Math.min(100, (sensors.rainfallRate / 70) * 100)}%`;
    barRain.style.background = sensors.rainfallRate > 35 ? '#ef4444' : sensors.rainfallRate > 15 ? '#f59e0b' : '#3b82f6';

    // Tilt Inclinometer
    const tiltDeflection = Math.sqrt(Math.pow(sensors.tilt.x, 2) + Math.pow(sensors.tilt.y, 2)).toFixed(2);
    document.getElementById('val-tilt-deflection').textContent = tiltDeflection;
    document.getElementById('val-tilt-rate').textContent = `${sensors.tilt.rateOfChange.toFixed(2)} °/hr`;
    document.getElementById('val-tilt-x').textContent = sensors.tilt.x.toFixed(1);
    document.getElementById('val-tilt-y').textContent = sensors.tilt.y.toFixed(1);
    const barTilt = document.getElementById('bar-tilt');
    barTilt.style.width = `${Math.min(100, (tiltDeflection / 8) * 100)}%`;
    barTilt.style.background = tiltDeflection > 4.0 ? '#ef4444' : tiltDeflection > 1.5 ? '#f59e0b' : '#10b981';

    // Factor of Safety (FoS)
    document.getElementById('val-fos').textContent = risk.factorOfSafety.toFixed(2);
    document.getElementById('val-failure-prob').textContent = `${risk.failureProbability}%`;
    const barFos = document.getElementById('bar-fos');
    barFos.style.width = `${Math.min(100, (risk.factorOfSafety / 2.0) * 100)}%`;
    barFos.style.background = risk.factorOfSafety < 1.0 ? '#ef4444' : risk.factorOfSafety < 1.3 ? '#f59e0b' : '#10b981';

    // Pore Pressure
    document.getElementById('val-pore').textContent = sensors.porePressure.toFixed(1);
    document.getElementById('val-vibration').textContent = `${sensors.vibration.toFixed(1)} mm/s`;
    document.getElementById('bar-pore').style.width = `${Math.min(100, (sensors.porePressure / 80) * 100)}%`;

    // LoRa Telemetry
    document.getElementById('val-lora-battery').textContent = lora.batteryPercent;
    document.getElementById('val-lora-rssi').textContent = `${lora.rssi} dBm`;
    document.getElementById('val-lora-snr').textContent = `${lora.snr} dB`;
    document.getElementById('bar-battery').style.width = `${lora.batteryPercent}%`;

    // Geotechnical mining context
    document.getElementById('geo-slope-elev').textContent = `${station.slopeAngle}° • ${station.elevation}`;
    document.getElementById('geo-soil').textContent = station.soilType;
    document.getElementById('geo-failure-time').textContent = risk.timeToPotentialFailure;
    document.getElementById('geo-route').textContent = station.settlement.evacuationRoute;
    document.getElementById('geo-shelter').textContent = station.settlement.nearestShelter;

    // Synchronize simulator sliders
    document.getElementById('sim-slider-rain').value = Math.round(sensors.rainfallRate);
    document.getElementById('sim-val-rain').textContent = `${sensors.rainfallRate.toFixed(1)} mm/h`;
    
    document.getElementById('sim-slider-moisture').value = Math.round(sensors.soilMoisture);
    document.getElementById('sim-val-moisture').textContent = `${sensors.soilMoisture.toFixed(1)} %`;

    document.getElementById('sim-slider-tilt').value = tiltDeflection;
    document.getElementById('sim-val-tilt').textContent = `${tiltDeflection} °`;

    // Render Charts
    renderStationCharts(station);

    // Render LoRa Packet
    appendLoraPacket(station);

    // Update Extended Cards: Weather Forecast, Alternate Evacuation Route, Medical Pre-Alert, and Relief Shelter
    updateDrawerExtendedCards(station);
  }

  // ==================== TIME-SERIES CHARTS (CHART.JS) ====================
  function renderStationCharts(station) {
    const history = state.stationHistories[station.id] || [];
    const labels = history.map(h => h.time);

    // 1. Chart: Moisture vs Rainfall
    const ctx1 = document.getElementById('chart-moisture-rain').getContext('2d');
    if (state.charts.moistureRain) state.charts.moistureRain.destroy();

    state.charts.moistureRain = new Chart(ctx1, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Soil Moisture (%)',
            data: history.map(h => h.soilMoisture),
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            yAxisID: 'yMoisture',
            tension: 0.3,
            fill: true,
            pointRadius: 2
          },
          {
            label: 'Rainfall Rate (mm/h)',
            data: history.map(h => h.rainfallRate),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            yAxisID: 'yRainfall',
            type: 'bar',
            barPercentage: 0.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 10 } } }
        },
        scales: {
          x: { ticks: { color: '#64748b', maxTicksLimit: 6, font: { size: 9 } }, grid: { color: '#1e293b' } },
          yMoisture: { position: 'left', min: 0, max: 100, ticks: { color: '#38bdf8', font: { size: 9 } }, grid: { color: '#1e293b' } },
          yRainfall: { position: 'right', min: 0, max: 80, ticks: { color: '#ef4444', font: { size: 9 } }, grid: { drawOnChartArea: false } }
        }
      }
    });

    // 2. Chart: Tilt Trajectory X & Y
    const ctx2 = document.getElementById('chart-tilt').getContext('2d');
    if (state.charts.tilt) state.charts.tilt.destroy();

    state.charts.tilt = new Chart(ctx2, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Tilt X Axis (°)',
            data: history.map(h => h.tiltX),
            borderColor: '#f59e0b',
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 0
          },
          {
            label: 'Tilt Y Axis (°)',
            data: history.map(h => h.tiltY),
            borderColor: '#a855f7',
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10 } } } },
        scales: {
          x: { ticks: { color: '#64748b', maxTicksLimit: 6, font: { size: 9 } }, grid: { color: '#1e293b' } },
          y: { ticks: { color: '#f59e0b', font: { size: 9 } }, grid: { color: '#1e293b' } }
        }
      }
    });

    // 3. Chart: Factor of Safety (FoS) Trajectory
    const ctx3 = document.getElementById('chart-fos').getContext('2d');
    if (state.charts.fos) state.charts.fos.destroy();

    const fosValues = history.map(h => {
      const mockStation = {
        slopeAngle: station.slopeAngle,
        sensors: {
          soilMoisture: h.soilMoisture,
          rainfallRate: h.rainfallRate,
          rainfallAccum24h: h.rainfallRate * 4,
          tilt: { x: h.tiltX, y: h.tiltY },
          porePressure: h.porePressure
        }
      };
      return predictionEngine.calculateFactorOfSafety(mockStation);
    });

    state.charts.fos = new Chart(ctx3, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Factor of Safety (FoS)',
            data: fosValues,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            fill: true,
            tension: 0.3,
            pointRadius: 2
          },
          {
            label: 'Critical Failure Baseline (1.0)',
            data: labels.map(() => 1.0),
            borderColor: '#ef4444',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10 } } } },
        scales: {
          x: { ticks: { color: '#64748b', maxTicksLimit: 6, font: { size: 9 } }, grid: { color: '#1e293b' } },
          y: { min: 0.4, max: 2.4, ticks: { color: '#10b981', font: { size: 9 } }, grid: { color: '#1e293b' } }
        }
      }
    });
  }

  // ==================== LORA PACKET STREAM INSPECTOR ====================
  function appendLoraPacket(station) {
    const terminal = document.getElementById('lora-terminal-log');
    if (!terminal) return;
    const time = new Date().toLocaleTimeString();
    const hexPayload = Math.random().toString(16).substring(2, 10).toUpperCase();

    const line = document.createElement('div');
    line.className = 'lora-line';
    line.innerHTML = `
      <span class="lora-time">[${time}]</span>
      <span>[${station.lora.gateway}]</span>
      <span class="lora-payload">PAYLOAD: 0x${hexPayload} | VWC:${station.sensors.soilMoisture.toFixed(1)}% | RAIN:${station.sensors.rainfallRate.toFixed(1)}mm/h | TILT:${station.sensors.tilt.x.toFixed(1)}° | RSSI:${station.lora.rssi}dBm</span>
    `;

    terminal.insertBefore(line, terminal.firstChild);
    while (terminal.children.length > 20) {
      terminal.removeChild(terminal.lastChild);
    }
  }

  // ==================== SENSOR WHAT-IF SIMULATOR ====================
  function initSimulatorControls() {
    const rainSlider = document.getElementById('sim-slider-rain');
    const moistureSlider = document.getElementById('sim-slider-moisture');
    const tiltSlider = document.getElementById('sim-slider-tilt');
    const btnReset = document.getElementById('btn-reset-simulator');

    function updateSimulation() {
      const station = state.stations.find(s => s.id === state.activeStationId);
      if (!station) return;

      const rainVal = parseFloat(rainSlider.value);
      const moistureVal = parseFloat(moistureSlider.value);
      const tiltVal = parseFloat(tiltSlider.value);

      document.getElementById('sim-val-rain').textContent = `${rainVal.toFixed(1)} mm/h`;
      document.getElementById('sim-val-moisture').textContent = `${moistureVal.toFixed(1)} %`;
      document.getElementById('sim-val-tilt').textContent = `${tiltVal.toFixed(1)} °`;

      station.sensors.rainfallRate = rainVal;
      station.sensors.soilMoisture = moistureVal;
      station.sensors.tilt.x = tiltVal * 0.75;
      station.sensors.tilt.y = tiltVal * 0.65;
      station.sensors.tilt.rateOfChange = tiltVal > 3 ? (tiltVal * 0.2) : 0.05;
      station.sensors.porePressure = moistureVal * 0.7;

      station.risk = predictionEngine.evaluateStationRisk(station);

      renderStationDrawer(station);
      renderStationMarkers();
      updateHeaderStats();

      if (station.risk.riskLevel === 'HIGH') {
        showToast(`⚠️ ESCALATION: ${station.name} transitioned to HIGH RISK! Push warning alert recommended.`, 'danger');
      }
    }

    rainSlider.addEventListener('input', updateSimulation);
    moistureSlider.addEventListener('input', updateSimulation);
    tiltSlider.addEventListener('input', updateSimulation);

    btnReset.addEventListener('click', () => {
      const original = INITIAL_STATIONS.find(s => s.id === state.activeStationId);
      const station = state.stations.find(s => s.id === state.activeStationId);
      if (!original || !station) return;

      station.sensors = JSON.parse(JSON.stringify(original.sensors));
      station.risk = predictionEngine.evaluateStationRisk(station);

      renderStationDrawer(station);
      renderStationMarkers();
      updateHeaderStats();
      showToast('Simulator values reset to Dhanbad field telemetry baseline.', 'success');
    });
  }

  // ==================== REAL-TIME TELEMETRY STREAM ====================
  function startTelemetryLiveStream() {
    setInterval(() => {
      state.stations.forEach(station => {
        station.sensors.soilMoisture = Math.min(99, Math.max(10, station.sensors.soilMoisture + (Math.random() * 0.4 - 0.2)));
        station.lora.rssi = Math.round(station.lora.rssi + (Math.random() * 2 - 1));
        station.lora.lastPacketSecAgo = Math.floor(Math.random() * 5);
        station.risk = predictionEngine.evaluateStationRisk(station);
      });

      const activeStation = state.stations.find(s => s.id === state.activeStationId);
      if (activeStation) {
        appendLoraPacket(activeStation);
      }

      updateHeaderStats();
    }, 4000);
  }

  // ==================== AUDIO SIREN & SYNTHESIZER ====================
  function initAudioSystem() {
    const sirenBtn = document.getElementById('btn-siren-toggle');
    const sirenText = document.getElementById('siren-status-text');

    sirenBtn.addEventListener('click', () => {
      state.sirenEnabled = !state.sirenEnabled;
      if (state.sirenEnabled) {
        sirenText.textContent = 'Audio Siren [ON]';
        sirenBtn.classList.remove('btn-siren-active');
        showToast('Emergency audio alert siren enabled.', 'success');
      } else {
        sirenText.textContent = 'Audio Siren [MUTED]';
        sirenBtn.classList.remove('btn-siren-active');
        stopSiren();
        showToast('Emergency audio alert siren muted.', 'warning');
      }
    });
  }

  function playEmergencySirenAlert(station) {
    if (!state.sirenEnabled) return;
    
    try {
      if (!state.audioContext) {
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (state.audioContext.state === 'suspended') {
        state.audioContext.resume();
      }

      const osc = state.audioContext.createOscillator();
      const gain = state.audioContext.createGain();
      osc.type = 'sawtooth';
      
      const now = state.audioContext.currentTime;
      osc.frequency.setValueAtTime(770, now);
      osc.frequency.linearRampToValueAtTime(960, now + 0.3);
      osc.frequency.linearRampToValueAtTime(770, now + 0.6);
      osc.frequency.linearRampToValueAtTime(960, now + 0.9);
      osc.frequency.linearRampToValueAtTime(770, now + 1.2);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      osc.connect(gain);
      gain.connect(state.audioContext.destination);

      osc.start(now);
      osc.stop(now + 1.4);
    } catch (e) {
      console.warn('Audio synthesis error:', e);
    }

    if ('speechSynthesis' in window) {
      try {
        const msg = new SpeechSynthesisUtterance(
          `Attention: Critical slope instability warning at ${station.name} Dhanbad. Evacuation advisory active.`
        );
        msg.rate = 1.0;
        msg.pitch = 1.1;
        window.speechSynthesis.speak(msg);
      } catch (e) {
        console.warn('Speech synthesis error:', e);
      }
    }
  }

  function stopSiren() {
    if (state.audioContext) {
      state.audioContext.suspend();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // ==================== EMERGENCY MESSAGE PUSH MODAL ====================
  function initBroadcastModal() {
    const modal = document.getElementById('modal-broadcast');
    const btnOpen = document.getElementById('btn-quick-broadcast');
    const btnDrawerOpen = document.getElementById('btn-drawer-broadcast');
    const btnClose = document.getElementById('btn-close-broadcast-modal');
    const btnCancel = document.getElementById('btn-cancel-broadcast');
    const btnExecute = document.getElementById('btn-execute-broadcast');
    const tierSelect = document.getElementById('broadcast-tier-select');
    const subjectInput = document.getElementById('broadcast-subject');
    const bodyText = document.getElementById('broadcast-body');

    function openModal() {
      const station = state.stations.find(s => s.id === state.activeStationId) || state.stations[0];
      
      document.getElementById('modal-broadcast-target-station').textContent = `Target: ${station.settlement.sectorName}`;
      document.getElementById('modal-broadcast-population').textContent = `At Risk: ~${station.settlement.populationAtRisk.toLocaleString()} Residents & Miners`;
      document.getElementById('modal-broadcast-shelter').textContent = station.settlement.nearestShelter;

      const tierKey = station.risk.riskLevel === 'HIGH' ? 'highRisk' : station.risk.riskLevel === 'MODERATE' ? 'moderateRisk' : 'allClear';
      tierSelect.value = tierKey;
      populateTemplate(station, tierKey);

      modal.classList.add('modal-active');
    }

    function populateTemplate(station, tierKey) {
      const template = ALERT_TEMPLATES[tierKey];
      subjectInput.value = template.subject;
      
      let text = template.body
        .replace(/[STATION_NAME]/g, station.name)
        .replace(/[SECTOR]/g, station.settlement.sectorName)
        .replace(/[RAIN_RATE]/g, station.sensors.rainfallRate.toFixed(1))
        .replace(/[MOISTURE]/g, station.sensors.soilMoisture.toFixed(1))
        .replace(/[ROUTE]/g, station.settlement.evacuationRoute)
        .replace(/[SHELTER]/g, station.settlement.nearestShelter);

      bodyText.value = text;
    }

    tierSelect.addEventListener('change', () => {
      const station = state.stations.find(s => s.id === state.activeStationId) || state.stations[0];
      populateTemplate(station, tierSelect.value);
    });

    btnOpen.addEventListener('click', openModal);
    btnDrawerOpen.addEventListener('click', openModal);
    btnClose.addEventListener('click', () => modal.classList.remove('modal-active'));
    btnCancel.addEventListener('click', () => modal.classList.remove('modal-active'));

    btnExecute.addEventListener('click', () => {
      const station = state.stations.find(s => s.id === state.activeStationId) || state.stations[0];
      const channels = [];
      if (document.getElementById('chan-sms').checked) channels.push('Cell Broadcast/SMS');
      if (document.getElementById('chan-lora-siren').checked) channels.push('BCCL Mine Sirens');
      if (document.getElementById('chan-pa').checked) channels.push('Public Address');
      if (document.getElementById('chan-ndrf').checked) channels.push('NDRF Radio');

      modal.classList.remove('modal-active');

      playEmergencySirenAlert(station);

      showToast(
        `🚨 DHANBAD SECTOR BROADCAST: Alert dispatched to ${station.settlement.populationAtRisk} citizens in ${station.settlement.sectorName} via ${channels.join(', ')}!`,
        'danger'
      );
    });
  }

  // ==================== EMERGENCY HELPLINES MODAL ====================
  function initHelplinesModal() {
    const modal = document.getElementById('modal-helplines');
    const btnOpen = document.getElementById('btn-open-helplines');
    const btnDrawerOpen = document.getElementById('btn-drawer-helpline');
    const btnClose = document.getElementById('btn-close-helplines-modal');
    const btnCloseBottom = document.getElementById('btn-close-helplines-bottom');
    const container = document.getElementById('helplines-grid-container');
    const sopContainer = document.getElementById('sop-container');

    container.innerHTML = '';
    EMERGENCY_HELPLINES.forEach(h => {
      const card = document.createElement('div');
      card.className = 'helpline-card';
      card.innerHTML = `
        <span class="helpline-badge">${h.badge}</span>
        <div class="helpline-name">${h.agency}</div>
        <div class="helpline-desc">${h.description}</div>
        <div class="helpline-actions">
          <span class="helpline-number">${h.number}</span>
          <div style="display: flex; gap: 6px;">
            <a href="tel:${h.number}" class="btn-dial"><i class="fa-solid fa-phone"></i> Call</a>
            <button class="btn-copy" data-number="${h.number}" title="Copy number"><i class="fa-solid fa-copy"></i></button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    sopContainer.innerHTML = '';
    SOP_GUIDELINES.forEach(sop => {
      const box = document.createElement('div');
      box.style.background = 'var(--bg-card)';
      box.style.border = '1px solid var(--border-color)';
      box.style.borderRadius = '8px';
      box.style.padding = '12px';

      const stepsHtml = sop.steps.map(s => `<li style="margin-bottom: 4px; color: var(--text-muted); font-size: 0.78rem;">${s}</li>`).join('');

      box.innerHTML = `
        <div style="font-weight: 700; color: #38bdf8; font-size: 0.82rem; margin-bottom: 6px;">
          ${sop.phase}
        </div>
        <ul style="padding-left: 18px; margin: 0;">
          ${stepsHtml}
        </ul>
      `;
      sopContainer.appendChild(box);
    });

    container.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('.btn-copy');
      if (copyBtn) {
        const num = copyBtn.dataset.number;
        navigator.clipboard.writeText(num);
        showToast(`Copied ${num} to clipboard!`, 'success');
      }
    });

    btnOpen.addEventListener('click', () => modal.classList.add('modal-active'));
    btnDrawerOpen.addEventListener('click', () => modal.classList.add('modal-active'));
    btnClose.addEventListener('click', () => modal.classList.remove('modal-active'));
    btnCloseBottom.addEventListener('click', () => modal.classList.remove('modal-active'));
  }

  // ==================== SITREP REPORT MODAL ====================
  function initSitrepModal() {
    const modal = document.getElementById('modal-sitrep');
    const btnOpen = document.getElementById('btn-export-sitrep');
    const btnDrawerOpen = document.getElementById('btn-drawer-sitrep');
    const btnClose = document.getElementById('btn-close-sitrep-modal');
    const btnCloseBottom = document.getElementById('btn-close-sitrep-bottom');
    const btnPrint = document.getElementById('btn-print-sitrep');
    const content = document.getElementById('sitrep-content');

    function openSitrep() {
      const now = new Date();
      const highStations = state.stations.filter(s => s.risk.riskLevel === 'HIGH');
      const modStations = state.stations.filter(s => s.risk.riskLevel === 'MODERATE');

      let stationTableHtml = state.stations.map(s => `
        <tr style="border-bottom: 1px solid #334155;">
          <td style="padding: 8px 6px; font-weight: bold; color: ${s.risk.color};">${s.id}</td>
          <td style="padding: 8px 6px;">${s.name}</td>
          <td style="padding: 8px 6px; font-family: monospace;">${s.sensors.soilMoisture.toFixed(1)}%</td>
          <td style="padding: 8px 6px; font-family: monospace;">${s.sensors.rainfallRate.toFixed(1)} mm/h</td>
          <td style="padding: 8px 6px; font-family: monospace;">${s.sensors.tilt.rateOfChange.toFixed(2)} °/h</td>
          <td style="padding: 8px 6px; font-family: monospace; font-weight: bold; color: ${s.risk.color};">${s.risk.factorOfSafety.toFixed(2)}</td>
          <td style="padding: 8px 6px; font-weight: bold; color: ${s.risk.color};">${s.risk.riskLevel}</td>
        </tr>
      `).join('');

      content.innerHTML = `
        <div style="border-bottom: 2px solid #334155; padding-bottom: 12px; margin-bottom: 14px;">
          <h2 style="color: white; font-size: 1.25rem;">DHANBAD DISTRICT SLOPE &amp; MINE STABILITY SITREP</h2>
          <div style="color: #94a3b8; font-size: 0.76rem;">
            Generated: ${now.toLocaleString()} • Classification: OFFICIAL USE ONLY • BCCL / DEOC LoRa Network
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;">
          <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 6px; padding: 10px;">
            <div style="color: #ef4444; font-weight: bold;">CRITICAL HIGHWALLS / OB DUMPS</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: white;">${highStations.length}</div>
            <div style="font-size: 0.7rem; color: #fca5a5;">Immediate Evacuation Ordered</div>
          </div>
          <div style="background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; border-radius: 6px; padding: 10px;">
            <div style="color: #f59e0b; font-weight: bold;">WATCH SECTORS (YELLOW)</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: white;">${modStations.length}</div>
            <div style="font-size: 0.7rem; color: #fde68a;">Elevated Monitoring Active</div>
          </div>
          <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; border-radius: 6px; padding: 10px;">
            <div style="color: #10b981; font-weight: bold;">STABLE ROCK SECTORS (GREEN)</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: white;">${state.stations.length - highStations.length - modStations.length}</div>
            <div style="font-size: 0.7rem; color: #6ee7b7;">FoS Above Safety Baseline</div>
          </div>
        </div>

        <h4 style="color: #38bdf8; margin-bottom: 8px;">Dhanbad Telemetry Matrix</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem; text-align: left; margin-bottom: 16px;">
          <thead>
            <tr style="background: #1e293b; color: #94a3b8;">
              <th style="padding: 6px;">Node ID</th>
              <th style="padding: 6px;">Sector / Location</th>
              <th style="padding: 6px;">Moisture</th>
              <th style="padding: 6px;">Rain Rate</th>
              <th style="padding: 6px;">Tilt Rate</th>
              <th style="padding: 6px;">FoS</th>
              <th style="padding: 6px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${stationTableHtml}
          </tbody>
        </table>

        <div style="background: #1e293b; border-radius: 6px; padding: 12px; font-size: 0.75rem;">
          <strong style="color: #f87171;">Directives for BCCL Colliery Managers &amp; District Magistrate:</strong>
          <ol style="margin-top: 6px; padding-left: 18px; color: #cbd5e1; line-height: 1.5;">
            <li>Immediately cease heavy dump-truck and shovel operations near Jharia Sector-4 and Bastacolla Highwall.</li>
            <li>Maintain continuous LoRaWAN gateway telemetry pings at 865.2 MHz.</li>
            <li>Coordinate with BCCL Central Mine Rescue Station (0326-2202244) and Dhanbad DEOC (1077).</li>
          </ol>
        </div>
      `;

      modal.classList.add('modal-active');
    }

    btnOpen.addEventListener('click', openSitrep);
    btnDrawerOpen.addEventListener('click', openSitrep);
    btnClose.addEventListener('click', () => modal.classList.remove('modal-active'));
    btnCloseBottom.addEventListener('click', () => modal.classList.remove('modal-active'));
    btnPrint.addEventListener('click', () => window.print());
  }

  // ==================== SEARCH & FILTERS ====================
  function initSearchAndFilter() {
    const searchInput = document.getElementById('station-search');
    const filterPills = document.querySelectorAll('.filter-pill[data-filter]');

    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      renderStationMarkers();
    });

    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.activeFilter = pill.dataset.filter;
        renderStationMarkers();
      });
    });
  }

  function getFilteredStations() {
    return state.stations.filter(station => {
      if (state.activeFilter !== 'ALL' && station.risk.riskLevel !== state.activeFilter) {
        return false;
      }
      if (state.searchQuery) {
        const text = `${station.name} ${station.region} ${station.settlement.sectorName} ${station.id}`.toLowerCase();
        if (!text.includes(state.searchQuery)) return false;
      }
      return true;
    });
  }

  // ==================== HEADER CONTROLS & STATS ====================
  function initHeaderControls() {
    const btnCloseDrawer = document.getElementById('btn-close-drawer');
    btnCloseDrawer.addEventListener('click', () => {
      document.getElementById('tech-drawer').classList.remove('drawer-open');
    });
  }

  function updateHeaderStats() {
    let high = 0, mod = 0, safe = 0;
    state.stations.forEach(s => {
      if (s.risk.riskLevel === 'HIGH') high++;
      else if (s.risk.riskLevel === 'MODERATE') mod++;
      else safe++;
    });

    document.getElementById('count-high').textContent = high;
    document.getElementById('count-mod').textContent = mod;
    document.getElementById('count-safe').textContent = safe;
    document.getElementById('total-nodes').textContent = state.stations.length;
  }

  // ==================== TOAST SYSTEM ====================
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-circle-check';
    if (type === 'danger') icon = 'fa-triangle-exclamation';
    else if (type === 'warning') icon = 'fa-bell';

    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <span style="flex: 1;">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // ==================== GIS EVACUATION ROUTES & RELIEF SHELTERS LAYER ====================
  function renderMapRoutesAndShelters() {
    if (!state.primaryMap) return;

    // Clear previous GIS layers
    state.gisRouteLayers.forEach(l => state.primaryMap.removeLayer(l));
    state.gisShelterMarkers.forEach(m => state.primaryMap.removeLayer(m));
    state.gisRouteLayers = [];
    state.gisShelterMarkers = [];

    // 1. Render Evacuation Routes (Damaged vs Safe Alternate)
    state.evacuationRoutes.forEach(route => {
      const isDamaged = route.status === 'DAMAGED_BLOCKED';
      const polyline = L.polyline(route.coordinates, {
        color: isDamaged ? '#ef4444' : '#06b6d4',
        weight: isDamaged ? 5 : 4,
        opacity: isDamaged ? 0.95 : 0.85,
        dashArray: isDamaged ? '8, 10' : null
      }).addTo(state.primaryMap);

      polyline.bindPopup(`
        <div style="font-family: inherit; font-size: 0.82rem; color: #0b132b; min-width: 220px;">
          <div style="font-weight: 800; color: ${isDamaged ? '#dc2626' : '#0284c7'}; margin-bottom: 4px;">
            ${isDamaged ? '⚠️ ROAD DAMAGED / BLOCKED' : '✅ SAFE ALTERNATE DETOUR'}
          </div>
          <div style="font-weight: 700; margin-bottom: 2px;">${route.name}</div>
          <div style="font-size: 0.74rem; color: #475569;">
            ${isDamaged ? `<strong>Hazard:</strong> ${route.hazardType}<br><strong>Clearance ETA:</strong> ${route.clearanceETA}` : `<strong>Advantage:</strong> ${route.safetyAdvantage}`}
          </div>
        </div>
      `);

      state.gisRouteLayers.push(polyline);

      // Add hazard block marker if damaged
      if (isDamaged && route.blockedSegmentCoords) {
        const blockIcon = L.divIcon({
          className: 'custom-hazard-block',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          html: `<div style="background:#ef4444; color:white; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 0 12px #ef4444; font-size:14px;"><i class="fa-solid fa-road-barrier"></i></div>`
        });
        const blockMarker = L.marker(route.blockedSegmentCoords, { icon: blockIcon }).addTo(state.primaryMap);
        blockMarker.bindTooltip(`ROAD BLOCKED: ${route.name}`, { permanent: false });
        state.gisRouteLayers.push(blockMarker);
      }
    });

    // 2. Render Relief Shelters on GIS Map
    state.reliefCentres.forEach(shelter => {
      const shelterIcon = L.divIcon({
        className: 'custom-shelter-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        html: `
          <div style="background:#0284c7; color:white; border-radius:10px; width:34px; height:34px; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 0 10px rgba(0,0,0,0.5); font-size:16px;">
            <i class="fa-solid fa-person-shelter"></i>
          </div>
        `
      });

      const shelterMarker = L.marker([shelter.lat, shelter.lng], { icon: shelterIcon }).addTo(state.primaryMap);
      shelterMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 0.82rem; color: #0b132b; min-width: 240px;">
          <div style="font-weight: 800; color: #0284c7; margin-bottom: 2px;">🏕️ RELIEF HAVEN SHELTER</div>
          <div style="font-weight: 700; font-size: 0.9rem;">${shelter.name}</div>
          <div style="font-size: 0.75rem; color: #475569; margin: 4px 0;">
            Capacity: <strong>${shelter.occupied} / ${shelter.capacity}</strong> (${shelter.availableSpace} beds free)
          </div>
          <div style="font-size: 0.74rem; color: #334155;">Commander: <strong>${shelter.officerInCharge}</strong></div>
          <div style="margin-top: 6px;">
            <a href="tel:${shelter.directPhone}" style="display:inline-block; background:#10b981; color:white; padding:4px 10px; border-radius:4px; text-decoration:none; font-weight:700; font-size:0.75rem;">
              📞 Call ${shelter.directPhone}
            </a>
          </div>
        </div>
      `);

      state.gisShelterMarkers.push(shelterMarker);
    });
  }

  // ==================== EXTENDED DRAWER CARDS ====================
  function updateDrawerExtendedCards(station) {
    // 1. Weather Forecast Card
    const weather = state.weatherForecasts[station.id] || state.weatherForecasts['NODE-DHN-JHR01'];
    if (weather) {
      const condEl = document.getElementById('drawer-weather-cond');
      const flashEl = document.getElementById('drawer-flash-alert');
      const dbzEl = document.getElementById('drawer-radar-dbz');
      const baroEl = document.getElementById('drawer-baro-drop');
      const expEl = document.getElementById('drawer-exp-24h');
      const windEl = document.getElementById('drawer-wind-gust');

      if (condEl) condEl.textContent = weather.condition;
      if (flashEl) flashEl.textContent = weather.flashFloodAlert.split(' - ')[0];
      if (dbzEl) dbzEl.textContent = weather.radarReflectivity.split(' ')[0] + ' dBZ';
      if (baroEl) baroEl.textContent = weather.barometricPressure.includes('(') ? weather.barometricPressure.split('(')[1].replace(')', '') : '-1.5 hPa/h';
      if (expEl) expEl.textContent = weather.precipitation24hExp;
      if (windEl) windEl.textContent = weather.windSpeed;
    }

    // 2. Alternate Evacuation Corridor Card
    const primaryRoute = state.evacuationRoutes.find(r => r.stationId === station.id && r.type === 'primary');
    const altRoute = state.evacuationRoutes.find(r => r.stationId === station.id && r.type === 'alternate');

    const priNameEl = document.getElementById('drawer-primary-route-name');
    const priHazEl = document.getElementById('drawer-primary-route-hazard');
    const altNameEl = document.getElementById('drawer-alternate-route-name');
    const priBox = document.getElementById('drawer-route-primary-status');

    if (primaryRoute) {
      if (priNameEl) priNameEl.textContent = primaryRoute.name;
      if (priHazEl) priHazEl.textContent = `Status: ${primaryRoute.status} • Hazard: ${primaryRoute.hazardType || 'None'} • Clearance: ${primaryRoute.clearanceETA}`;
      if (priBox) {
        priBox.style.background = (primaryRoute.status === 'DAMAGED_BLOCKED') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';
        priBox.style.borderColor = (primaryRoute.status === 'DAMAGED_BLOCKED') ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)';
      }
    }

    if (altRoute && altNameEl) {
      altNameEl.textContent = `${altRoute.name} (${altRoute.lengthKm} km) — ${altRoute.safetyAdvantage}`;
    }

    const btnToggle = document.getElementById('btn-toggle-active-route');
    if (btnToggle && primaryRoute) {
      btnToggle.onclick = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/routes/${primaryRoute.id}/toggle`, { method: 'POST' });
          const d = await res.json();
          if (d.success) {
            primaryRoute.status = d.route.status;
            renderMapRoutesAndShelters();
            updateDrawerExtendedCards(station);
            showToast(`Route ${primaryRoute.name} status updated to ${primaryRoute.status}`);
          }
        } catch (e) {
          primaryRoute.status = primaryRoute.status === 'DAMAGED_BLOCKED' ? 'CLEAR_OPEN' : 'DAMAGED_BLOCKED';
          renderMapRoutesAndShelters();
          updateDrawerExtendedCards(station);
          showToast(`Toggled route status locally to ${primaryRoute.status}`);
        }
      };
    }

    // 3. Medical Pre-Alert Card
    const medCenter = state.medicalCentres[0] || {};
    const medNameEl = document.getElementById('drawer-med-name');
    const medBadgeEl = document.getElementById('drawer-med-badge');
    const medAmbEl = document.getElementById('drawer-med-amb');
    const medBedsEl = document.getElementById('drawer-med-beds');
    const medProtoEl = document.getElementById('drawer-med-protocol');
    const linkDialHosp = document.getElementById('link-dial-hospital');
    const btnPreAlert = document.getElementById('btn-trigger-hospital-alert');

    if (medNameEl && medCenter.name) medNameEl.textContent = medCenter.name;
    if (medBadgeEl && medCenter.alertnessLevel) {
      medBadgeEl.textContent = medCenter.alertnessLevel === 'MASS_CASUALTY_CODE_RED' ? 'Code Red' : medCenter.alertnessLevel === 'PRE_ALERT_STANDBY' ? 'Amber Standby' : 'Routine';
      medBadgeEl.style.background = medCenter.alertnessLevel === 'MASS_CASUALTY_CODE_RED' ? '#ef4444' : medCenter.alertnessLevel === 'PRE_ALERT_STANDBY' ? '#f59e0b' : '#10b981';
    }
    if (medAmbEl && medCenter.ambulances) medAmbEl.textContent = `${medCenter.ambulances.available} active`;
    if (medBedsEl && medCenter.beds) medBedsEl.textContent = `${medCenter.beds.available} beds`;
    if (medProtoEl && medCenter.antiStampedeProtocol) medProtoEl.textContent = `Anti-Stampede: ${medCenter.antiStampedeProtocol.status}`;
    if (linkDialHosp && medCenter.emergencyPhone) linkDialHosp.href = `tel:${medCenter.emergencyPhone}`;

    if (btnPreAlert) {
      btnPreAlert.onclick = () => setGlobalMedicalStage('PRE_ALERT_STANDBY');
    }

    // 4. Relief Shelter Card
    const shelter = state.reliefCentres.find(s => station.settlement.nearestShelter.includes(s.name.split(' ')[0])) || state.reliefCentres[0];
    if (shelter) {
      const shNameEl = document.getElementById('drawer-shelter-name');
      const shSpaceEl = document.getElementById('drawer-shelter-space');
      const shDistEl = document.getElementById('drawer-shelter-dist');
      const shOfficerEl = document.getElementById('drawer-shelter-officer');
      const linkDialSh = document.getElementById('link-dial-shelter');

      if (shNameEl) shNameEl.textContent = shelter.name;
      if (shSpaceEl) shSpaceEl.textContent = `${shelter.availableSpace} Free Beds`;
      if (shDistEl) shDistEl.textContent = `${shelter.primaryRoute ? shelter.primaryRoute.distanceKm : 1.2} km (Detour: ${shelter.alternateRoute ? shelter.alternateRoute.distanceKm : 2.1} km)`;
      if (shOfficerEl) shOfficerEl.textContent = shelter.officerInCharge;
      if (linkDialSh) linkDialSh.href = `tel:${shelter.directPhone}`;
    }
  }

  // ==================== 1. 3D TOPOGRAPHY DEM MODAL ====================
  function initDem3DModal() {
    const btnOpen = document.getElementById('btn-open-dem3d');
    const modal = document.getElementById('modal-dem3d');
    const btnClose = document.getElementById('btn-close-dem3d-modal');
    const btnCloseBottom = document.getElementById('btn-close-dem3d-bottom');

    if (!modal) return;

    if (btnOpen) {
      btnOpen.addEventListener('click', () => {
        modal.classList.add('modal-active');
        if (!state.dem3dViewer && window.DEM3DViewer) {
          state.dem3dViewer = new DEM3DViewer('dem3d-canvas-container');
        } else if (state.dem3dViewer) {
          state.dem3dViewer.onWindowResize();
        }
      });
    }

    if (btnClose) btnClose.addEventListener('click', () => modal.classList.remove('modal-active'));
    if (btnCloseBottom) btnCloseBottom.addEventListener('click', () => modal.classList.remove('modal-active'));

    // Mode Buttons
    const btnHeat = document.getElementById('btn-dem-mode-heat');
    const btnContour = document.getElementById('btn-dem-mode-contour');
    const btnSat = document.getElementById('btn-dem-mode-sat');
    const btnSimStart = document.getElementById('btn-dem-sim-start');
    const btnSimReset = document.getElementById('btn-dem-sim-reset');
    const btnViewTop = document.getElementById('btn-dem-view-top');

    if (btnHeat) {
      btnHeat.addEventListener('click', () => {
        document.querySelectorAll('.dem-tool-btn').forEach(b => b.classList.remove('active'));
        btnHeat.classList.add('active');
        if (state.dem3dViewer) state.dem3dViewer.setRenderMode('heatmap');
      });
    }

    if (btnContour) {
      btnContour.addEventListener('click', () => {
        document.querySelectorAll('.dem-tool-btn').forEach(b => b.classList.remove('active'));
        btnContour.classList.add('active');
        if (state.dem3dViewer) state.dem3dViewer.setRenderMode('contours');
      });
    }

    if (btnSat) {
      btnSat.addEventListener('click', () => {
        document.querySelectorAll('.dem-tool-btn').forEach(b => b.classList.remove('active'));
        btnSat.classList.add('active');
        if (state.dem3dViewer) state.dem3dViewer.setRenderMode('satellite');
      });
    }

    if (btnSimStart) {
      btnSimStart.addEventListener('click', () => {
        if (!state.dem3dViewer) return;
        state.dem3dViewer.startRunoutSimulation((sec) => {
          const timerEl = document.getElementById('dem-sim-timer');
          const headlineEl = document.getElementById('dem-sim-headline');
          const detailsEl = document.getElementById('dem-sim-details');

          if (timerEl) timerEl.textContent = `T + ${sec < 10 ? '0' + sec : sec}s`;

          if (sec < 40) {
            if (headlineEl) headlineEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="color:#ef4444;"></i> Rapid Mass Wasting: Overburden chute moving at 16.5 m/s...`;
            if (detailsEl) detailsEl.textContent = `Debris avalanche descending upper bench toward Katras Link Bypass.`;
          } else if (sec >= 40 && sec < 75) {
            if (headlineEl) headlineEl.innerHTML = `🚨 <span style="color:#ef4444;">ROAD SEVERED!</span> Katras-Jharia Link Bypass Inundated (T+42s)`;
            if (detailsEl) detailsEl.textContent = `Primary artery impassable. Traffic diversion to High Ridge Bypass enforced!`;
          } else {
            if (headlineEl) headlineEl.innerHTML = `⚠️ <span style="color:#f59e0b;">VILLAGE INUNDATION WARNING:</span> Baniahir Basti direct debris fan impact (T+75s)`;
            if (detailsEl) detailsEl.textContent = `Debris deposition fan reaching 240m MSL valley floor. Evacuation corridor critical!`;
          }
        });
        showToast('3D Debris Runout Avalanche Simulation Started', 'warning');
      });
    }

    if (btnSimReset) {
      btnSimReset.addEventListener('click', () => {
        if (state.dem3dViewer) {
          state.dem3dViewer.stopRunoutSimulation();
          state.dem3dViewer.resetCamera();
          document.getElementById('dem-sim-timer').textContent = 'T + 00s';
          document.getElementById('dem-sim-headline').innerHTML = '<i class="fa-solid fa-circle-dot"></i> 3D Topography Reset • Slope: 42.5°';
        }
      });
    }

    if (btnViewTop) {
      btnViewTop.addEventListener('click', () => {
        if (state.dem3dViewer) state.dem3dViewer.setTopView();
      });
    }
  }

  // ==================== 2. MEDICAL ALERTNESS & ANTI-STAMPEDE MODAL ====================
  function initMedicalAlertModal() {
    const btnOpen = document.getElementById('btn-open-medical');
    const modal = document.getElementById('modal-medical');
    const btnClose = document.getElementById('btn-close-medical-modal');
    const btnCloseBottom = document.getElementById('btn-close-medical-bottom');

    if (!modal) return;

    if (btnOpen) {
      btnOpen.addEventListener('click', () => {
        renderMedicalBoard();
        modal.classList.add('modal-active');
      });
    }

    if (btnClose) btnClose.addEventListener('click', () => modal.classList.remove('modal-active'));
    if (btnCloseBottom) btnCloseBottom.addEventListener('click', () => modal.classList.remove('modal-active'));

    window.setGlobalMedicalStage = async function(stage) {
      try {
        const res = await fetch(`${API_BASE}/api/medical-centres/alert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: stage })
        });
        const d = await res.json();
        if (d.success) {
          state.medicalCentres = d.data;
          renderMedicalBoard();
          updateHeaderMedStage(stage);
          showToast(`Medical network escalated to ${stage}! Local centres alerted to prevent stampede.`, 'warning');
        }
      } catch (e) {
        state.medicalCentres.forEach(m => m.alertnessLevel = stage);
        renderMedicalBoard();
        updateHeaderMedStage(stage);
        showToast(`Locally updated medical readiness to ${stage}`, 'warning');
      }
    };
  }

  function renderMedicalBoard() {
    const container = document.getElementById('medical-board-container');
    if (!container) return;

    container.innerHTML = state.medicalCentres.map(med => `
      <div class="medical-board-card">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
            <div>
              <div style="font-weight: 700; font-size: 0.95rem;">${med.name}</div>
              <div style="font-size: 0.72rem; color: #38bdf8;">${med.type}</div>
            </div>
            <span style="font-size: 0.7rem; font-weight: 800; padding: 3px 8px; border-radius: 4px; background: ${med.alertnessLevel === 'MASS_CASUALTY_CODE_RED' ? '#ef4444' : med.alertnessLevel === 'PRE_ALERT_STANDBY' ? '#f59e0b' : '#10b981'}; color: white;">
              ${med.alertnessLevel === 'MASS_CASUALTY_CODE_RED' ? 'CODE RED' : med.alertnessLevel === 'PRE_ALERT_STANDBY' ? 'AMBER STANDBY' : 'ROUTINE'}
            </span>
          </div>

          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 8px;">
            <i class="fa-solid fa-location-dot"></i> ${med.location} • In-Charge: <strong>${med.doctorInCharge.split('(')[0]}</strong>
          </div>

          <div style="display: flex; gap: 12px; font-size: 0.76rem; margin-bottom: 10px;">
            <span><i class="fa-solid fa-truck-medical" style="color: #38bdf8;"></i> <strong>${med.ambulances.available}</strong> / ${med.ambulances.total} Ambulances</span>
            <span><i class="fa-solid fa-bed-pulse" style="color: #34d399;"></i> <strong>${med.beds.available}</strong> Beds Free</span>
          </div>

          <div style="background: rgba(0, 0, 0, 0.25); border-radius: 6px; padding: 8px 10px; font-size: 0.72rem; color: #cbd5e1; margin-bottom: 12px;">
            <strong>Anti-Stampede Triage Staging:</strong> ${med.antiStampedeProtocol.status}<br>
            <span style="color: #94a3b8;">${med.antiStampedeProtocol.crowdControl}</span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
          <div style="font-size: 0.75rem; color: var(--text-muted);">Hotline: <strong style="color:white;">${med.emergencyPhone}</strong></div>
          <a href="tel:${med.emergencyPhone}" class="btn-dial-officer" style="background: #ef4444;">
            <i class="fa-solid fa-phone"></i> Dial 24x7
          </a>
        </div>
      </div>
    `).join('');
  }

  function updateHeaderMedStage(stage) {
    const chip = document.getElementById('val-med-stage');
    if (!chip) return;
    chip.textContent = stage === 'MASS_CASUALTY_CODE_RED' ? 'Code Red Active' : stage === 'PRE_ALERT_STANDBY' ? 'Amber Standby' : 'Routine Safe';
    const parent = document.getElementById('chip-medical-alert');
    if (parent) {
      parent.className = `stat-chip ${stage === 'MASS_CASUALTY_CODE_RED' ? 'chip-red' : stage === 'PRE_ALERT_STANDBY' ? 'chip-yellow' : 'chip-green'}`;
    }
  }

  // ==================== 3. CITIZEN CASUALTY MEDIA DESK MODAL ====================
  function initCasualtyDeskModal() {
    const btnOpen = document.getElementById('btn-open-casualty-desk');
    const modal = document.getElementById('modal-casualty-desk');
    const btnClose = document.getElementById('btn-close-casualty-desk-modal');
    const btnCloseBottom = document.getElementById('btn-close-casualty-bottom');

    if (!modal) return;

    if (btnOpen) {
      btnOpen.addEventListener('click', async () => {
        await fetchIncidentReports();
        renderCasualtyDesk();
        modal.classList.add('modal-active');
      });
    }

    if (btnClose) btnClose.addEventListener('click', () => modal.classList.remove('modal-active'));
    if (btnCloseBottom) btnCloseBottom.addEventListener('click', () => modal.classList.remove('modal-active'));
  }

  async function fetchIncidentReports() {
    try {
      const res = await fetch(`${API_BASE}/api/citizen/incidents`);
      const d = await res.json();
      if (d.success) {
        state.incidentReports = d.data;
        const countSpan = document.getElementById('count-citizen-reports');
        if (countSpan) countSpan.textContent = state.incidentReports.length;
      }
    } catch (e) {}
  }

  function renderCasualtyDesk() {
    const container = document.getElementById('casualty-desk-container');
    if (!container) return;

    container.innerHTML = state.incidentReports.map(inc => `
      <div class="casualty-report-card">
        <div class="report-media-header">
          ${inc.mediaType === 'video' ? `<video src="${inc.mediaUrl}" controls></video>` : `<img src="${inc.mediaUrl}" alt="Casualty Ground Photo">`}
          <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); padding: 4px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; color: #f87171;">
            ${inc.category.replace(/_/g, ' ')}
          </div>
          <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); padding: 4px 8px; border-radius: 4px; font-size: 0.72rem; color: #38bdf8;">
            GPS: ${inc.lat.toFixed(4)}, ${inc.lng.toFixed(4)}
          </div>
        </div>

        <div style="padding: 14px; flex: 1;">
          <div style="font-weight: 700; font-size: 0.92rem; margin-bottom: 4px;">${inc.locationName}</div>
          <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 10px;">
            ${inc.description}
          </p>

          <div style="display: flex; gap: 10px; font-size: 0.74rem; color: #fca5a5; margin-bottom: 12px;">
            <span>Injured: <strong>${inc.casualtiesEstimated}</strong></span>
            <span>Trapped: <strong>${inc.trappedEstimated}</strong></span>
            <span>Time: <strong>${new Date(inc.timestamp).toLocaleTimeString()}</strong></span>
          </div>

          <!-- Reporter Contact Details Card for Live SITREP Call -->
          <div class="report-reporter-box">
            <div>
              <div style="font-size: 0.72rem; color: #38bdf8; font-weight: 700;"><i class="fa-solid fa-headset"></i> FIELD REPORTER CONTACT</div>
              <div style="font-weight: 700; font-size: 0.85rem; color: white;">${inc.reporterName}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Phone: ${inc.reporterPhone}</div>
            </div>
            <div style="display: flex; gap: 6px;">
              <a href="tel:${inc.reporterPhone}" class="btn-call-reporter" title="Call Reporter directly">
                <i class="fa-solid fa-phone"></i> Call Live
              </a>
              <a href="https://wa.me/${inc.reporterPhone.replace(/[^0-9]/g, '')}" target="_blank" class="btn-call-reporter" style="background: #22c55e;" title="WhatsApp live message">
                <i class="fa-brands fa-whatsapp"></i> Chat
              </a>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // ==================== 4. MISSING PERSONS LEGAL REGISTRY MODAL ====================
  function initMissingRegistryModal() {
    const btnOpen = document.getElementById('btn-open-missing-desk');
    const modal = document.getElementById('modal-missing-desk');
    const btnClose = document.getElementById('btn-close-missing-modal');
    const btnCloseBottom = document.getElementById('btn-close-missing-bottom');
    const searchInput = document.getElementById('missing-search-input');

    if (!modal) return;

    if (btnOpen) {
      btnOpen.addEventListener('click', async () => {
        await fetchMissingPersons();
        renderMissingTable(state.missingPersons);
        modal.classList.add('modal-active');
      });
    }

    if (btnClose) btnClose.addEventListener('click', () => modal.classList.remove('modal-active'));
    if (btnCloseBottom) btnCloseBottom.addEventListener('click', () => modal.classList.remove('modal-active'));

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        const filtered = state.missingPersons.filter(mp => 
          mp.fullName.toLowerCase().includes(q) || 
          mp.aadhaarNumber.toLowerCase().includes(q) || 
          mp.lastSeenLocation.toLowerCase().includes(q)
        );
        renderMissingTable(filtered);
      });
    }
  }

  async function fetchMissingPersons() {
    try {
      const res = await fetch(`${API_BASE}/api/citizen/missing-persons`);
      const d = await res.json();
      if (d.success) {
        state.missingPersons = d.data;
        const countSpan = document.getElementById('count-missing-firs');
        if (countSpan) countSpan.textContent = state.missingPersons.length;
      }
    } catch (e) {}
  }

  function renderMissingTable(list) {
    const tbody = document.getElementById('missing-table-body');
    if (!tbody) return;

    tbody.innerHTML = list.map(mp => `
      <tr>
        <td><img src="${mp.photoUrl}" class="missing-photo-thumb" alt="${mp.fullName}"></td>
        <td>
          <strong>${mp.fullName}</strong><br>
          <span style="font-size: 0.72rem; color: var(--text-muted);">${mp.age} Yrs • ${mp.gender} • DOB: ${mp.dob}</span>
        </td>
        <td><span style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #38bdf8;">${mp.aadhaarNumber}</span></td>
        <td>
          <span>${mp.lastSeenLocation}</span><br>
          <span style="font-size: 0.72rem; color: var(--text-dim);">${mp.lastSeenTime}</span>
        </td>
        <td>
          <strong>${mp.complainantName}</strong> (${mp.complainantRelation})<br>
          <a href="tel:${mp.complainantPhone}" style="color: #34d399; text-decoration: none; font-weight: 700;">📞 ${mp.complainantPhone}</a>
        </td>
        <td>
          <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5;">
            <i class="fa-solid fa-scale-balanced"></i> Law Verified (5yr/₹10L Declaration)
          </span>
        </td>
        <td>
          <span style="font-size: 0.7rem; font-weight: 800; padding: 3px 8px; border-radius: 4px; background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid #f59e0b;">
            ${mp.sarStatus || 'ACTIVE_SEARCH'}
          </span>
        </td>
      </tr>
    `).join('');
  }

  // ==================== 5. ALTERNATE EVACUATION ROUTES MODAL ====================
  function initRouteManagerModal() {
    const btnOpen = document.getElementById('btn-open-routes');
    const modal = document.getElementById('modal-routes');
    const btnClose = document.getElementById('btn-close-routes-modal');
    const btnCloseBottom = document.getElementById('btn-close-routes-bottom');

    if (!modal) return;

    if (btnOpen) {
      btnOpen.addEventListener('click', () => {
        renderRoutesManager();
        modal.classList.add('modal-active');
      });
    }

    if (btnClose) btnClose.addEventListener('click', () => modal.classList.remove('modal-active'));
    if (btnCloseBottom) btnCloseBottom.addEventListener('click', () => modal.classList.remove('modal-active'));
  }

  function renderRoutesManager() {
    const container = document.getElementById('routes-manager-container');
    if (!container) return;

    container.innerHTML = state.evacuationRoutes.map(route => {
      const isDamaged = route.status === 'DAMAGED_BLOCKED';
      return `
        <div class="route-manager-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <div style="font-weight: 700; font-size: 0.95rem;">${route.name}</div>
              <div style="font-size: 0.72rem; color: #38bdf8;">Length: ${route.lengthKm} km • Type: ${route.type.toUpperCase()}</div>
            </div>
            <span style="font-size: 0.7rem; font-weight: 800; padding: 3px 8px; border-radius: 4px; background: ${isDamaged ? '#ef4444' : '#10b981'}; color: white;">
              ${isDamaged ? 'DAMAGED / BLOCKED' : 'CLEAR / PASSABLE'}
            </span>
          </div>

          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 12px;">
            ${isDamaged ? `<strong>Hazard Description:</strong> ${route.hazardType}<br><strong>Clearance ETA:</strong> ${route.clearanceETA}` : `<strong>Safety Note:</strong> ${route.safetyAdvantage || 'Safe passable route'}`}
          </div>

          <button class="btn-toggle-route ${isDamaged ? 'mark-clear' : 'mark-damaged'}" onclick="toggleRouteStatus('${route.id}')">
            <i class="fa-solid ${isDamaged ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i>
            <span>${isDamaged ? 'Mark as Cleared & Re-open' : 'Mark as Damaged by Landslide'}</span>
          </button>
        </div>
      `;
    }).join('');
  }

  window.toggleRouteStatus = async function(routeId) {
    try {
      const res = await fetch(`${API_BASE}/api/routes/${routeId}/toggle`, { method: 'POST' });
      const d = await res.json();
      if (d.success) {
        const route = state.evacuationRoutes.find(r => r.id === routeId);
        if (route) route.status = d.route.status;
        renderRoutesManager();
        renderMapRoutesAndShelters();
        updateDrawerExtendedCards(state.stations.find(s => s.id === state.activeStationId));
        showToast(`Route ${routeId} status toggled to ${d.route.status}!`);
      }
    } catch (e) {
      const route = state.evacuationRoutes.find(r => r.id === routeId);
      if (route) {
        route.status = route.status === 'DAMAGED_BLOCKED' ? 'CLEAR_OPEN' : 'DAMAGED_BLOCKED';
        renderRoutesManager();
        renderMapRoutesAndShelters();
        updateDrawerExtendedCards(state.stations.find(s => s.id === state.activeStationId));
        showToast(`Locally updated route ${routeId} to ${route.status}`);
      }
    }
  };

  // ==================== 6. METEOROLOGICAL WEATHER RADAR MODAL ====================
  function initWeatherModal() {
    const btnOpenHeader = document.getElementById('btn-open-weather');
    const btnOpenDrawer = document.getElementById('btn-view-weather-modal');
    const modal = document.getElementById('modal-weather');
    const btnClose = document.getElementById('btn-close-weather-modal');
    const btnCloseBottom = document.getElementById('btn-close-weather-bottom');

    if (!modal) return;

    const openWeather = () => {
      renderWeatherModalDetails();
      modal.classList.add('modal-active');
    };

    if (btnOpenHeader) btnOpenHeader.addEventListener('click', openWeather);
    if (btnOpenDrawer) btnOpenDrawer.addEventListener('click', openWeather);
    if (btnClose) btnClose.addEventListener('click', () => modal.classList.remove('modal-active'));
    if (btnCloseBottom) btnCloseBottom.addEventListener('click', () => modal.classList.remove('modal-active'));
  }

  function renderWeatherModalDetails() {
    const station = state.stations.find(s => s.id === state.activeStationId) || state.stations[0];
    const weather = state.weatherForecasts[station.id] || state.weatherForecasts['NODE-DHN-JHR01'];

    document.getElementById('weather-modal-station-name').textContent = `${station.name} (${station.region})`;
    document.getElementById('weather-modal-flash-badge').textContent = weather.flashFloodAlert;
    document.getElementById('wm-baro').textContent = weather.barometricPressure;
    document.getElementById('wm-wind').textContent = weather.windSpeed;
    document.getElementById('wm-hum').textContent = weather.humidity;
    document.getElementById('wm-radar').textContent = weather.radarReflectivity;

    // Render 6-Hour Precipitation Chart
    const ctx = document.getElementById('weather-hourly-chart').getContext('2d');
    if (state.weatherHourlyChart) state.weatherHourlyChart.destroy();

    const hours = weather.hourlyTrend.map(h => h.hour);
    const rain = weather.hourlyTrend.map(h => h.rain);

    state.weatherHourlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: hours,
        datasets: [{
          label: 'Hourly Rainfall Forecast (mm/h)',
          data: rain,
          backgroundColor: rain.map(r => r > 40 ? '#ef4444' : r > 20 ? '#f59e0b' : '#38bdf8'),
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: {
          x: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } },
          y: { ticks: { color: '#38bdf8' }, grid: { color: '#1e293b' } }
        }
      }
    });
  }

  // ==================== FETCH BACKEND DYNAMIC DATA ====================
  async function fetchBackendDynamicData() {
    try {
      const resR = await fetch(`${API_BASE}/api/routes`);
      if (resR.ok) {
        const d = await resR.json();
        if (d.data) {
          state.evacuationRoutes = d.data;
          renderMapRoutesAndShelters();
        }
      }
    } catch (e) {}

    try {
      const resM = await fetch(`${API_BASE}/api/medical-centres`);
      if (resM.ok) {
        const d = await resM.json();
        if (d.data) {
          state.medicalCentres = d.data;
          const highMed = state.medicalCentres.find(m => m.alertnessLevel === 'MASS_CASUALTY_CODE_RED' || m.alertnessLevel === 'PRE_ALERT_STANDBY');
          if (highMed) updateHeaderMedStage(highMed.alertnessLevel);
        }
      }
    } catch (e) {}

    try {
      const resSh = await fetch(`${API_BASE}/api/relief-centres`);
      if (resSh.ok) {
        const d = await resSh.json();
        if (d.data) {
          state.reliefCentres = d.data;
          renderMapRoutesAndShelters();
        }
      }
    } catch (e) {}

    fetchIncidentReports();
    fetchMissingPersons();
  }

  // Auto-select initial default station
  setTimeout(() => {
    selectStation(state.activeStationId);
  }, 600);
});

