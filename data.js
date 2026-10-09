// GeoGuard AI - Dhanbad District Landslide & Slope Stability Monitoring Network

const INITIAL_STATIONS = [
  {
    id: "NODE-DHN-JHR01",
    name: "Jharia Overburden Dump Slope Sector-4",
    region: "Jharia Coalfield, Dhanbad",
    lat: 23.7441,
    lng: 86.4150,
    elevation: "245m",
    slopeAngle: 42, // degrees
    soilType: "Mine Spoil, Weathered Sandstone & Carbonaceous Shale",
    lastUpdated: new Date().toISOString(),
    sensors: {
      soilMoisture: 88.2, // % Volumetric Water Content
      rainfallRate: 52.4, // mm/hr
      rainfallAccum24h: 215.0, // mm in last 24h
      rainfallAccum72h: 360.0, // mm in last 72h
      tilt: {
        x: 4.85, // degrees
        y: -3.20,
        z: 84.1,
        rateOfChange: 0.95 // deg/hr
      },
      porePressure: 56.4, // kPa
      vibration: 4.2, // mm/s (blasting/micro-subsidence)
      temperature: 29.5, // °C
      humidity: 94 // %
    },
    lora: {
      frequency: "865.2 MHz",
      rssi: -92,
      snr: 6.4,
      batteryVoltage: 3.75,
      batteryPercent: 74,
      gateway: "GW-DHN-JHARIA-01",
      lastPacketSecAgo: 3,
      packetLoss: 1.2
    },
    settlement: {
      sectorName: "Baniahir & Kujama Basti Zone",
      populationAtRisk: 3450,
      nearestShelter: "Digwadih Central Relief Camp (1.2 km)",
      shelterCapacity: 1200,
      evacuationRoute: "Katras-Jharia Link Bypass High Ridge Road"
    },
    // Sub-sensor probes on detailed micro-sector map
    microLayout: {
      inclinometer: { lat: 23.7448, lng: 86.4144, label: "Borehole Inclinometer (15m)", type: "inclinometer" },
      moistureArray: { lat: 23.7436, lng: 86.4156, label: "Soil Moisture Array (1m & 3m)", type: "moisture" },
      rainGauge: { lat: 23.7446, lng: 86.4162, label: "Tipping Bucket Rain Tower", type: "rainfall" },
      loraGateway: { lat: 23.7432, lng: 86.4138, label: "LoRa Solar Repeater Mast", type: "lora" },
      dangerZone: [
        [23.7455, 86.4135],
        [23.7452, 86.4168],
        [23.7428, 86.4165],
        [23.7425, 86.4140]
      ],
      evacRoute: [
        [23.7438, 86.4148],
        [23.7422, 86.4130],
        [23.7405, 86.4112],
        [23.7385, 86.4100]
      ],
      shelterCoord: [23.7385, 86.4100]
    }
  },
  {
    id: "NODE-DHN-BST02",
    name: "Bastacolla Colliery Open-Cast Highwall",
    region: "Bastacolla, Dhanbad",
    lat: 23.7712,
    lng: 86.4285,
    elevation: "230m",
    slopeAngle: 45,
    soilType: "Fractured Barakar Sandstone & Sub-bituminous Coal Highwall",
    lastUpdated: new Date().toISOString(),
    sensors: {
      soilMoisture: 84.5,
      rainfallRate: 44.0,
      rainfallAccum24h: 182.0,
      rainfallAccum72h: 310.0,
      tilt: {
        x: 3.92,
        y: 2.15,
        z: 86.8,
        rateOfChange: 0.82
      },
      porePressure: 49.2,
      vibration: 3.8,
      temperature: 28.2,
      humidity: 92
    },
    lora: {
      frequency: "866.5 MHz",
      rssi: -86,
      snr: 8.8,
      batteryVoltage: 3.88,
      batteryPercent: 84,
      gateway: "GW-DHN-DHANSAR-02",
      lastPacketSecAgo: 2,
      packetLoss: 0.7
    },
    settlement: {
      sectorName: "Bastacolla Worker Enclave & Dhansar Cut",
      populationAtRisk: 2180,
      nearestShelter: "Dhansar Municipal Sports Complex (1.6 km)",
      shelterCapacity: 900,
      evacuationRoute: "NH-32 Dhanbad-Bokaro Elevated Flyover Corridor"
    },
    microLayout: {
      inclinometer: { lat: 23.7718, lng: 86.4278, label: "Highwall Inclinometer Sensor", type: "inclinometer" },
      moistureArray: { lat: 23.7708, lng: 86.4292, label: "Bench Moisture Probe Unit", type: "moisture" },
      rainGauge: { lat: 23.7720, lng: 86.4298, label: "Pit Top Precipitation Gauge", type: "rainfall" },
      loraGateway: { lat: 23.7702, lng: 86.4272, label: "BCCL LoRa Node Repeater", type: "lora" },
      dangerZone: [
        [23.7725, 86.4268],
        [23.7722, 86.4302],
        [23.7700, 86.4300],
        [23.7698, 86.4270]
      ],
      evacRoute: [
        [23.7705, 86.4285],
        [23.7688, 86.4295],
        [23.7665, 86.4312]
      ],
      shelterCoord: [23.7665, 86.4312]
    }
  },
  {
    id: "NODE-DHN-LDN03",
    name: "Lodna Quarry Escarpment & Subsidence Zone",
    region: "Lodna Area, Dhanbad",
    lat: 23.7225,
    lng: 86.4382,
    elevation: "215m",
    slopeAngle: 36,
    soilType: "Alluvial Sand & Clay over Voided Strata",
    lastUpdated: new Date().toISOString(),
    sensors: {
      soilMoisture: 58.2,
      rainfallRate: 18.5,
      rainfallAccum24h: 76.0,
      rainfallAccum72h: 125.0,
      tilt: {
        x: 1.65,
        y: 0.85,
        z: 88.8,
        rateOfChange: 0.22
      },
      porePressure: 26.5,
      vibration: 1.4,
      temperature: 30.1,
      humidity: 84
    },
    lora: {
      frequency: "865.8 MHz",
      rssi: -79,
      snr: 9.8,
      batteryVoltage: 4.02,
      batteryPercent: 92,
      gateway: "GW-DHN-LODNA-03",
      lastPacketSecAgo: 4,
      packetLoss: 0.3
    },
    settlement: {
      sectorName: "Tisra Village & Goluckdih Outskirts",
      populationAtRisk: 1890,
      nearestShelter: "Tisra Secondary School Gymnasium (0.9 km)",
      shelterCapacity: 750,
      evacuationRoute: "Tisra Link Road towards Bagdigi High Plain"
    },
    microLayout: {
      inclinometer: { lat: 23.7230, lng: 86.4375, label: "Escarpment Extensometer/Tilt", type: "inclinometer" },
      moistureArray: { lat: 23.7220, lng: 86.4388, label: "Sub-surface Moisture Station", type: "moisture" },
      rainGauge: { lat: 23.7232, lng: 86.4392, label: "Optical Rain Sensor", type: "rainfall" },
      loraGateway: { lat: 23.7218, lng: 86.4370, label: "Solar LoRa Station", type: "lora" },
      dangerZone: [
        [23.7238, 86.4365],
        [23.7235, 86.4398],
        [23.7212, 86.4395],
        [23.7210, 86.4368]
      ],
      evacRoute: [
        [23.7222, 86.4380],
        [23.7210, 86.4402],
        [23.7190, 86.4425]
      ],
      shelterCoord: [23.7190, 86.4425]
    }
  },
  {
    id: "NODE-DHN-TOP04",
    name: "Topchanchi Lake Hill Catchment Slope",
    region: "Topchanchi, Dhanbad",
    lat: 23.9015,
    lng: 86.2085,
    elevation: "380m",
    slopeAngle: 38,
    soilType: "Quartzite & Gneiss Weathered Mountain Talus",
    lastUpdated: new Date().toISOString(),
    sensors: {
      soilMoisture: 48.0,
      rainfallRate: 14.2,
      rainfallAccum24h: 52.0,
      rainfallAccum72h: 90.0,
      tilt: {
        x: 1.15,
        y: -0.45,
        z: 89.2,
        rateOfChange: 0.10
      },
      porePressure: 19.8,
      vibration: 0.8,
      temperature: 26.4,
      humidity: 79
    },
    lora: {
      frequency: "867.1 MHz",
      rssi: -82,
      snr: 9.4,
      batteryVoltage: 3.95,
      batteryPercent: 88,
      gateway: "GW-DHN-TOPCHANCHI-04",
      lastPacketSecAgo: 5,
      packetLoss: 0.4
    },
    settlement: {
      sectorName: "Dholkatta & Lake Basin Hamlet",
      populationAtRisk: 940,
      nearestShelter: "Topchanchi High School Hall (1.4 km)",
      shelterCapacity: 500,
      evacuationRoute: "NH-19 (Old GT Road) High Crest Highway"
    },
    microLayout: {
      inclinometer: { lat: 23.9022, lng: 86.2078, label: "Catchment Inclinometer Sensor", type: "inclinometer" },
      moistureArray: { lat: 23.9010, lng: 86.2092, label: "Soil Saturation Sensor array", type: "moisture" },
      rainGauge: { lat: 23.9025, lng: 86.2096, label: "Meteorological Rain Gauge", type: "rainfall" },
      loraGateway: { lat: 23.9005, lng: 86.2072, label: "Hillcrest LoRa Node", type: "lora" },
      dangerZone: [
        [23.9030, 86.2068],
        [23.9028, 86.2105],
        [23.9002, 86.2100],
        [23.9000, 86.2070]
      ],
      evacRoute: [
        [23.9012, 86.2082],
        [23.8995, 86.2065],
        [23.8972, 86.2045]
      ],
      shelterCoord: [23.8972, 86.2045]
    }
  },
  {
    id: "NODE-DHN-MTH05",
    name: "Maithon Dam Reservoir Rock Cut Pass",
    region: "Maithon, Dhanbad",
    lat: 23.7842,
    lng: 86.8124,
    elevation: "195m",
    slopeAngle: 28,
    soilType: "Crystalline Charnockite Granite Bedrock",
    lastUpdated: new Date().toISOString(),
    sensors: {
      soilMoisture: 22.8,
      rainfallRate: 2.5,
      rainfallAccum24h: 8.5,
      rainfallAccum72h: 15.0,
      tilt: {
        x: 0.18,
        y: 0.12,
        z: 89.9,
        rateOfChange: 0.01
      },
      porePressure: 5.4,
      vibration: 0.3,
      temperature: 27.8,
      humidity: 65
    },
    lora: {
      frequency: "865.4 MHz",
      rssi: -72,
      snr: 12.0,
      batteryVoltage: 4.15,
      batteryPercent: 98,
      gateway: "GW-DHN-MAITHON-05",
      lastPacketSecAgo: 7,
      packetLoss: 0.1
    },
    settlement: {
      sectorName: "Kalyaneshwari Bypass & DVC Township",
      populationAtRisk: 650,
      nearestShelter: "DVC Community Hall Maithon (1.8 km)",
      shelterCapacity: 500,
      evacuationRoute: "Maithon Dam Crest Road towards Barakar"
    },
    microLayout: {
      inclinometer: { lat: 23.7848, lng: 86.8118, label: "Rock Joint Inclinometer", type: "inclinometer" },
      moistureArray: { lat: 23.7838, lng: 86.8130, label: "Bedrock Moisture Sensor", type: "moisture" },
      rainGauge: { lat: 23.7850, lng: 86.8135, label: "DVC Hydro-met Rain Gauge", type: "rainfall" },
      loraGateway: { lat: 23.7832, lng: 86.8110, label: "Dam Crest LoRa Repeater", type: "lora" },
      dangerZone: [
        [23.7855, 86.8108],
        [23.7852, 86.8142],
        [23.7830, 86.8140],
        [23.7828, 86.8112]
      ],
      evacRoute: [
        [23.7840, 86.8122],
        [23.7855, 86.8148],
        [23.7870, 86.8175]
      ],
      shelterCoord: [23.7870, 86.8175]
    }
  },
  {
    id: "NODE-DHN-TND06",
    name: "Tundi North Forest Ridge Escarpment",
    region: "Tundi, Dhanbad",
    lat: 23.9924,
    lng: 86.4518,
    elevation: "310m",
    slopeAngle: 32,
    soilType: "Lateritic Red Sandy Loam over Metamorphic Bedrock",
    lastUpdated: new Date().toISOString(),
    sensors: {
      soilMoisture: 28.4,
      rainfallRate: 3.8,
      rainfallAccum24h: 14.0,
      rainfallAccum72h: 28.0,
      tilt: {
        x: 0.32,
        y: 0.18,
        z: 89.7,
        rateOfChange: 0.02
      },
      porePressure: 7.8,
      vibration: 0.2,
      temperature: 27.1,
      humidity: 68
    },
    lora: {
      frequency: "865.6 MHz",
      rssi: -75,
      snr: 11.2,
      batteryVoltage: 4.10,
      batteryPercent: 95,
      gateway: "GW-DHN-TUNDI-06",
      lastPacketSecAgo: 6,
      packetLoss: 0.1
    },
    settlement: {
      sectorName: "Kattikund & Tundi Rural Cluster",
      populationAtRisk: 520,
      nearestShelter: "Tundi Block Emergency Center (2.0 km)",
      shelterCapacity: 450,
      evacuationRoute: "Govindpur-Tundi State Highway Crest"
    },
    microLayout: {
      inclinometer: { lat: 23.9930, lng: 86.4512, label: "Ridge Inclinometer", type: "inclinometer" },
      moistureArray: { lat: 23.9920, lng: 86.4524, label: "Root Zone Moisture Array", type: "moisture" },
      rainGauge: { lat: 23.9932, lng: 86.4528, label: "Forest Rain Station", type: "rainfall" },
      loraGateway: { lat: 23.9915, lng: 86.4505, label: "Tundi Hill LoRa Node", type: "lora" },
      dangerZone: [
        [23.9938, 86.4502],
        [23.9935, 86.4535],
        [23.9910, 86.4532],
        [23.9908, 86.4506]
      ],
      evacRoute: [
        [23.9922, 86.4516],
        [23.9905, 86.4530],
        [23.9880, 86.4550]
      ],
      shelterCoord: [23.9880, 86.4550]
    }
  }
];

function generateStationHistory(station, hours = 24) {
  const history = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const progress = (hours - i) / hours;
    
    let rainfallRate = Math.max(0, station.sensors.rainfallRate * (0.25 + 0.75 * Math.sin(progress * Math.PI) + (Math.random() * 0.15 - 0.07)));
    let soilMoisture = Math.min(99, Math.max(10, station.sensors.soilMoisture * (0.55 + 0.45 * progress) + (Math.random() * 1.5 - 0.75)));
    let tiltX = station.sensors.tilt.x * (0.15 + 0.85 * progress) + (Math.random() * 0.06 - 0.03);
    let tiltY = station.sensors.tilt.y * (0.15 + 0.85 * progress) + (Math.random() * 0.06 - 0.03);
    let porePressure = Math.max(2, station.sensors.porePressure * (0.45 + 0.55 * progress) + (Math.random() * 1.2 - 0.6));
    let rssi = station.lora.rssi + Math.floor(Math.random() * 3 - 1);
    let battery = Math.max(40, station.lora.batteryPercent + (i * 0.08));

    history.push({
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isoDate: timestamp.toISOString(),
      rainfallRate: parseFloat(rainfallRate.toFixed(1)),
      soilMoisture: parseFloat(soilMoisture.toFixed(1)),
      tiltX: parseFloat(tiltX.toFixed(2)),
      tiltY: parseFloat(tiltY.toFixed(2)),
      porePressure: parseFloat(porePressure.toFixed(1)),
      rssi: Math.round(rssi),
      battery: parseFloat(battery.toFixed(1))
    });
  }
  return history;
}

// Emergency Contacts & Helplines for Dhanbad District
const EMERGENCY_HELPLINES = [
  {
    agency: "District Emergency Operations Center (DEOC) Dhanbad",
    description: "Dhanbad District Collectorate 24/7 Disaster Control Room",
    number: "1077",
    altNumber: "0326-2311217",
    email: "dm-dhanbad@nic.in",
    badge: "Dhanbad District Command",
    type: "local"
  },
  {
    agency: "BCCL Central Mine Rescue Station (CMR Station Dhanbad)",
    description: "Specialized rapid response force for mine slope failure, subsidence & void collapse",
    number: "0326-2202244",
    altNumber: "0326-2202245",
    email: "rescue.bccl@coalindia.in",
    badge: "Mine Rescue & Slope Safety",
    type: "rescue"
  },
  {
    agency: "Directorate General of Mines Safety (DGMS) Dhanbad",
    description: "National regulatory authority for highwall stability and geotechnical slope audits",
    number: "0326-2221200",
    altNumber: "0326-2221201",
    email: "dgms.hq@nic.in",
    badge: "Geotechnical Mine Authority",
    type: "geotechnical"
  },
  {
    agency: "NDRF 2nd Battalion (Eastern Command Response)",
    description: "National specialized disaster response force for mass evacuation and search ops",
    number: "1078",
    altNumber: "+91-33-25870130",
    email: "hq02-ndrf@nic.in",
    badge: "24/7 National Emergency",
    type: "rescue"
  },
  {
    agency: "SNMMCH Medical College & Trauma Emergency (Dhanbad)",
    description: "Shaheed Nirmal Mahto Medical College Hospital (PMCH) Trauma Emergency",
    number: "108",
    altNumber: "0326-2230465",
    email: "snmmch.dhanbad@gov.in",
    badge: "Trauma & Ambulance 108",
    type: "medical"
  },
  {
    agency: "Dhanbad District Police Control Room",
    description: "Emergency perimeter cordon and evacuation road management",
    number: "112",
    altNumber: "0326-2311200",
    email: "sp-dhanbad@jhpolice.gov.in",
    badge: "Police Emergency 112",
    type: "police"
  }
];

const ALERT_TEMPLATES = {
  highRisk: {
    level: "HIGH RISK / CRITICAL EVACUATION",
    subject: "🚨 URGENT: Mandatory Slope Evacuation Order - Dhanbad",
    body: "CRITICAL ALERT: Sensor station [STATION_NAME] has detected severe slope destabilization due to intense rainfall ([RAIN_RATE] mm/h) and extreme soil saturation ([MOISTURE]%). Slope failure / overburden slide is imminent within 30-90 minutes.\n\nACTION REQUIRED: All residents and colliery personnel in [SECTOR] must evacuate immediately via [ROUTE] to [SHELTER]. Stay away from quarry benches and dump toes. Emergency line: 1077 or 0326-2311217.",
    color: "#ef4444"
  },
  moderateRisk: {
    level: "MODERATE RISK / HIGH ALERT WATCH",
    subject: "⚠️ ADVISORY: Slope Instability Watch - Dhanbad",
    body: "MONITORING ALERT: Soil moisture at [STATION_NAME] has reached [MOISTURE]% with persistent rainfall ([RAIN_RATE] mm/h). Ground tilt sensors indicate initial displacement.\n\nACTION REQUIRED: Stay alert, pack emergency bags, avoid highwall cuts, and stay tuned for evacuation orders. The nearest shelter is [SHELTER].",
    color: "#f59e0b"
  },
  allClear: {
    level: "ALL CLEAR / NORMAL CONDITIONS",
    subject: "🟢 UPDATE: Dhanbad Slope Stability Normalized",
    body: "STATUS UPDATE: Weather and soil pore pressures at [STATION_NAME] have stabilized into the safe margin. Tilt sensors confirm slope stability. Normal activity may resume with standard caution.",
    color: "#10b981"
  }
};

const SOP_GUIDELINES = [
  {
    phase: "Pre-Event / Monitoring Phase (Safe / Moderate)",
    steps: [
      "Continuously monitor LoRa packet health, soil moisture (>60% threshold), and tilt drift (>0.2°/hr) on BCCL highwalls and OB dumps.",
      "Inspect catch-water drains along mine slopes to prevent runoff accumulation in fissures.",
      "Maintain radio contact on 865.2 MHz between Dhanbad DEOC and Colliery Safety Officers.",
      "Inspect backup power and food supplies at designated relief shelters in Digwadih and Dhansar."
    ]
  },
  {
    phase: "Trigger Phase / Active Warning (High Risk)",
    steps: [
      "Trigger geofenced Cell Broadcast and SMS warnings to all residents and miners within the 2.5km hazard radius.",
      "Activate BCCL field sirens (3 continuous blasts repeated every 2 minutes).",
      "Halt all heavy earthmoving machinery (HEMM) and vehicular movement near dump toes and highwalls.",
      "Evacuate vulnerable populations immediately along designated crest routes to emergency shelters."
    ]
  },
  {
    phase: "Post-Event / Rescue Phase (Slope Failure / Subsidence)",
    steps: [
      "Maintain a strict perimeter cordon; beware of secondary slips and methane/coaldust releases.",
      "Deploy BCCL Central Mine Rescue Station and NDRF units with ground-penetrating radar (GPR) and thermal sensors.",
      "Establish emergency triage at SNMMCH Dhanbad and provide clean drinking water and medical aid."
    ]
  }
];

// ==================== MEDICAL CENTRES & DISPENSARIES NETWORK ====================
// 24x7 Ambulance & Automated Anti-Stampede Alertness
const MEDICAL_CENTRES = [
  {
    id: "MED-01",
    name: "Shaheed Nirmal Mahto Medical College & Hospital (SNMMCH)",
    type: "Tertiary Trauma Hospital & Medical College",
    location: "Saraidhela, Dhanbad",
    lat: 23.8115,
    lng: 86.4385,
    emergencyPhone: "108",
    altPhone: "0326-2230465",
    doctorInCharge: "Dr. A. K. Barnwal (Chief Trauma Superintendent)",
    doctorContact: "+91-94311-20101",
    ambulances: {
      total: 18,
      available: 14,
      onMission: 4,
      icuEquipped: 6,
      dispatchPhone: "108 / 0326-2230465"
    },
    beds: {
      totalEmergency: 450,
      occupied: 280,
      available: 170,
      icuTrauma: 60
    },
    alertnessLevel: "PRE_ALERT_STANDBY", // NORMAL, PRE_ALERT_STANDBY, MASS_CASUALTY_CODE_RED
    antiStampedeProtocol: {
      status: "Active Staging Barrier Initialized",
      triageZone: "OPD Front Grounds Triage Tent (Red/Yellow/Green priority lanes)",
      crowdControl: "Police barricade at main gate; One-way transit corridors to prevent crowding and stampede.",
      diversionPlan: "Non-critical casualties routed to Jharia CHC and Bastacolla Dispensary."
    }
  },
  {
    id: "MED-02",
    name: "BCCL Central Hospital",
    type: "Specialized Mine Trauma & Occupational Injury Hospital",
    location: "Jagjiwan Nagar, Dhanbad",
    lat: 23.8202,
    lng: 86.4420,
    emergencyPhone: "0326-2224250",
    altPhone: "0326-2224251",
    doctorInCharge: "Dr. S. K. Sengupta (Chief Medical Officer)",
    doctorContact: "+91-94311-20102",
    ambulances: {
      total: 10,
      available: 8,
      onMission: 2,
      icuEquipped: 4,
      dispatchPhone: "0326-2224250"
    },
    beds: {
      totalEmergency: 250,
      occupied: 140,
      available: 110,
      icuTrauma: 35
    },
    alertnessLevel: "PRE_ALERT_STANDBY",
    antiStampedeProtocol: {
      status: "Mine Rescue Triage Bay Open",
      triageZone: "Ambulance Bay Ramp Staging Area",
      crowdControl: "CISF perimeter security controlling worker and family crowd flow.",
      diversionPlan: "Burn & blast cases given priority corridor."
    }
  },
  {
    id: "MED-03",
    name: "Jharia Community Health Centre (CHC) & 24x7 Dispensary",
    type: "Sub-Divisional Primary Health Centre & 24x7 Dispensary",
    location: "Jharia Main Road, Dhanbad",
    lat: 23.7410,
    lng: 86.4180,
    emergencyPhone: "0326-2460233",
    altPhone: "+91-94311-20103",
    doctorInCharge: "Dr. Rekha Kumari (In-Charge Medical Officer)",
    doctorContact: "+91-94311-20103",
    ambulances: {
      total: 4,
      available: 3,
      onMission: 1,
      icuEquipped: 1,
      dispatchPhone: "0326-2460233"
    },
    beds: {
      totalEmergency: 60,
      occupied: 32,
      available: 28,
      icuTrauma: 5
    },
    alertnessLevel: "PRE_ALERT_STANDBY",
    antiStampedeProtocol: {
      status: "Forward Emergency Stabilization Post Active",
      triageZone: "Courtyard Pre-Hospital Triage",
      crowdControl: "Queue ropes & numbered triage tokens issued to prevent rush and stampede.",
      diversionPlan: "Immediate ambulance shuttle to SNMMCH for critical poly-trauma."
    }
  },
  {
    id: "MED-04",
    name: "Bastacolla Colliery First-Aid & Trauma Station",
    type: "Colliery Emergency Dispensary & Trauma Unit",
    location: "Bastacolla Colliery, Dhanbad",
    lat: 23.7680,
    lng: 86.4250,
    emergencyPhone: "0326-2290114",
    altPhone: "+91-94311-20104",
    doctorInCharge: "Dr. P. K. Singh (Colliery Medical Officer)",
    doctorContact: "+91-94311-20104",
    ambulances: {
      total: 2,
      available: 2,
      onMission: 0,
      icuEquipped: 0,
      dispatchPhone: "0326-2290114"
    },
    beds: {
      totalEmergency: 20,
      occupied: 8,
      available: 12,
      icuTrauma: 0
    },
    alertnessLevel: "PRE_ALERT_STANDBY",
    antiStampedeProtocol: {
      status: "First-Aid Ready",
      triageZone: "Stretcher Bay",
      crowdControl: "Colliery safety volunteers stationed at door.",
      diversionPlan: "Transfer directly to BCCL Central Hospital."
    }
  },
  {
    id: "MED-05",
    name: "Tisra Emergency Health Post & Dispensary",
    type: "Colliery Dispensary & Emergency Dressing Post",
    location: "Tisra Goluckdih, Dhanbad",
    lat: 23.7210,
    lng: 86.4410,
    emergencyPhone: "0326-2470125",
    altPhone: "+91-94311-20105",
    doctorInCharge: "Dr. N. Murmu (Medical Officer)",
    doctorContact: "+91-94311-20105",
    ambulances: {
      total: 2,
      available: 2,
      onMission: 0,
      icuEquipped: 0,
      dispatchPhone: "0326-2470125"
    },
    beds: {
      totalEmergency: 15,
      occupied: 4,
      available: 11,
      icuTrauma: 0
    },
    alertnessLevel: "NORMAL",
    antiStampedeProtocol: {
      status: "Routine Readiness",
      triageZone: "Emergency OPD",
      crowdControl: "Local village defense volunteer support.",
      diversionPlan: "Escalation to Jharia CHC."
    }
  },
  {
    id: "MED-06",
    name: "Topchanchi Rural Primary Community Health Centre (CHC)",
    type: "Highway Emergency & Primary Community Health Centre",
    location: "Old GT Road, Topchanchi, Dhanbad",
    lat: 23.8980,
    lng: 86.2050,
    emergencyPhone: "0326-2840222",
    altPhone: "108",
    doctorInCharge: "Dr. Sunil Hembrom (Block Medical Officer)",
    doctorContact: "+91-94311-20106",
    ambulances: {
      total: 3,
      available: 3,
      onMission: 0,
      icuEquipped: 1,
      dispatchPhone: "0326-2840222 / 108"
    },
    beds: {
      totalEmergency: 45,
      occupied: 12,
      available: 33,
      icuTrauma: 4
    },
    alertnessLevel: "NORMAL",
    antiStampedeProtocol: {
      status: "Highway Emergency Standby",
      triageZone: "Main Corridor Reception",
      crowdControl: "Tollway patrol coordinator on site.",
      diversionPlan: "High trauma transfers to SNMMCH via NH-19."
    }
  }
];

// ==================== RELIEF CENTRES ====================
// Capacity, Occupancy, Distance, Alternate Route & Authority Phone
const RELIEF_CENTRES = [
  {
    id: "RELIEF-01",
    name: "Digwadih Central Relief Camp",
    sector: "Jharia / Digwadih Mining Belt",
    lat: 23.7385,
    lng: 86.4100,
    capacity: 1200,
    occupied: 380,
    availableSpace: 820,
    officerInCharge: "Rajesh Kumar Sinha (Sub-Divisional Magistrate / Relief Commander)",
    directPhone: "+91-94311-20411",
    altPhone: "0326-2460111",
    primaryRoute: {
      name: "Katras-Jharia Link Bypass Road",
      distanceKm: 1.2,
      estMinutes: 4,
      status: "DAMAGED_BLOCKED", // DAMAGED_BLOCKED or CLEAR_OPEN
      hazardDetails: "Overburden landslide debris blocking km 1.4 near Kujama pit. Unsafe for all vehicles.",
      clearanceETA: "6 to 8 hours (Heavy earthmoving machinery deployed)"
    },
    alternateRoute: {
      name: "High Ridge Bypass via Shanker Colliery Crest",
      distanceKm: 2.1,
      estMinutes: 8,
      status: "CLEAR_OPEN",
      safetyNote: "Elevated rocky terrain unaffected by slope wash. 100% accessible for buses, ambulances & foot traffic.",
      waypoints: [
        [23.7441, 86.4150],
        [23.7438, 86.4148],
        [23.7422, 86.4130],
        [23.7405, 86.4112],
        [23.7385, 86.4100]
      ]
    },
    resources: {
      foodStockDays: 14,
      waterPurifiedLiters: 50000,
      powerBackup: "Diesel GenSet 75 kVA + Rooftop Solar",
      medicalBay: "4 Doctors + 8 Nurses on 24x7 rotation"
    }
  },
  {
    id: "RELIEF-02",
    name: "Dhansar Municipal Sports Complex Shelter",
    sector: "Bastacolla / Dhansar Sector",
    lat: 23.7665,
    lng: 86.4312,
    capacity: 900,
    occupied: 150,
    availableSpace: 750,
    officerInCharge: "Smt. Sunita Murmu (District Relief & Rehabilitation Officer)",
    directPhone: "+91-94311-20422",
    altPhone: "0326-2290222",
    primaryRoute: {
      name: "NH-32 Dhanbad-Bokaro Direct Cut",
      distanceKm: 1.6,
      estMinutes: 5,
      status: "DAMAGED_BLOCKED",
      hazardDetails: "Subsidence fissure across pavement with falling gravel from highwall bench. Closed by police.",
      clearanceETA: "12 hours (Geotechnical structural inspection pending)"
    },
    alternateRoute: {
      name: "Dhansar Elevated Flyover Bypass Corridor",
      distanceKm: 2.8,
      estMinutes: 9,
      status: "CLEAR_OPEN",
      safetyNote: "Reinforced bridge viaduct clear of mine fissures. Direct access to stadium gate.",
      waypoints: [
        [23.7712, 86.4285],
        [23.7705, 86.4285],
        [23.7688, 86.4295],
        [23.7665, 86.4312]
      ]
    },
    resources: {
      foodStockDays: 10,
      waterPurifiedLiters: 30000,
      powerBackup: "Municipal Dual Line + Generator",
      medicalBay: "Dispensary team + 2 Ambulances stationed"
    }
  },
  {
    id: "RELIEF-03",
    name: "Tisra Secondary School Emergency Gymnasium",
    sector: "Lodna / Tisra Sector",
    lat: 23.7190,
    lng: 86.4425,
    capacity: 750,
    occupied: 80,
    availableSpace: 670,
    officerInCharge: "Amit Verma (Block Development Officer)",
    directPhone: "+91-94311-20433",
    altPhone: "0326-2470111",
    primaryRoute: {
      name: "Tisra Link Road towards Bagdigi",
      distanceKm: 0.9,
      estMinutes: 3,
      status: "CLEAR_OPEN",
      hazardDetails: "Pavement dry, light drizzle, clear passage.",
      clearanceETA: "Active & Passable"
    },
    alternateRoute: {
      name: "Bagdigi High Plain Bypass",
      distanceKm: 1.7,
      estMinutes: 6,
      status: "CLEAR_OPEN",
      safetyNote: "Secondary safe route through stable bedrock.",
      waypoints: [
        [23.7225, 86.4382],
        [23.7222, 86.4380],
        [23.7210, 86.4402],
        [23.7190, 86.4425]
      ]
    },
    resources: {
      foodStockDays: 7,
      waterPurifiedLiters: 20000,
      powerBackup: "Solar Inverter 10 kW",
      medicalBay: "Community Health Nurse on duty"
    }
  },
  {
    id: "RELIEF-04",
    name: "Topchanchi High School Multi-Purpose Hall",
    sector: "Topchanchi Hill Sector",
    lat: 23.8972,
    lng: 86.2045,
    capacity: 500,
    occupied: 35,
    availableSpace: 465,
    officerInCharge: "Dr. B. N. Singh (Zonal Relief Director)",
    directPhone: "+91-94311-20444",
    altPhone: "0326-2840111",
    primaryRoute: {
      name: "Lake Basin Road",
      distanceKm: 1.4,
      estMinutes: 4,
      status: "CLEAR_OPEN",
      hazardDetails: "All clear.",
      clearanceETA: "Active & Passable"
    },
    alternateRoute: {
      name: "NH-19 (Old GT Road) High Crest Highway",
      distanceKm: 2.2,
      estMinutes: 7,
      status: "CLEAR_OPEN",
      safetyNote: "Four-lane national highway corridor.",
      waypoints: [
        [23.9015, 86.2085],
        [23.9012, 86.2082],
        [23.8995, 86.2065],
        [23.8972, 86.2045]
      ]
    },
    resources: {
      foodStockDays: 12,
      waterPurifiedLiters: 25000,
      powerBackup: "Diesel GenSet 25 kVA",
      medicalBay: "CHC Topchanchi mobile unit"
    }
  },
  {
    id: "RELIEF-05",
    name: "Maithon DVC Community Center",
    sector: "Maithon Dam Sector",
    lat: 23.7870,
    lng: 86.8175,
    capacity: 500,
    occupied: 20,
    availableSpace: 480,
    officerInCharge: "K. K. Sharma (DVC Safety Officer)",
    directPhone: "+91-94311-20455",
    altPhone: "0326-2580111",
    primaryRoute: {
      name: "Maithon Dam Crest Road",
      distanceKm: 1.8,
      estMinutes: 5,
      status: "CLEAR_OPEN",
      hazardDetails: "Open and monitored by hydel security.",
      clearanceETA: "Active & Passable"
    },
    alternateRoute: {
      name: "Barakar Bypass Road",
      distanceKm: 2.5,
      estMinutes: 8,
      status: "CLEAR_OPEN",
      safetyNote: "Clear paved highway route.",
      waypoints: [
        [23.7842, 86.8124],
        [23.7840, 86.8122],
        [23.7855, 86.8148],
        [23.7870, 86.8175]
      ]
    },
    resources: {
      foodStockDays: 15,
      waterPurifiedLiters: 40000,
      powerBackup: "DVC Grid + Hydel Backup",
      medicalBay: "DVC Hospital team"
    }
  },
  {
    id: "RELIEF-06",
    name: "Tundi Block Emergency Camp",
    sector: "Tundi Forest Ridge Sector",
    lat: 23.9880,
    lng: 86.4550,
    capacity: 450,
    occupied: 10,
    availableSpace: 440,
    officerInCharge: "Manoj Soren (Circle Officer Tundi)",
    directPhone: "+91-94311-20466",
    altPhone: "0326-2910111",
    primaryRoute: {
      name: "Tundi Main Arterial Road",
      distanceKm: 2.0,
      estMinutes: 6,
      status: "CLEAR_OPEN",
      hazardDetails: "Clear passage through forest valley.",
      clearanceETA: "Active & Passable"
    },
    alternateRoute: {
      name: "Govindpur-Tundi State Highway Crest",
      distanceKm: 3.1,
      estMinutes: 9,
      status: "CLEAR_OPEN",
      safetyNote: "High elevation state highway.",
      waypoints: [
        [23.9924, 86.4518],
        [23.9922, 86.4516],
        [23.9905, 86.4530],
        [23.9880, 86.4550]
      ]
    },
    resources: {
      foodStockDays: 8,
      waterPurifiedLiters: 18000,
      powerBackup: "Forest Department GenSet",
      medicalBay: "Mobile PHC unit"
    }
  }
];

// ==================== EVACUATION ROUTES & ROAD DAMAGE ENGINE ====================
const EVACUATION_ROUTES = [
  {
    id: "ROUTE-JHR-01-PRI",
    stationId: "NODE-DHN-JHR01",
    name: "Katras-Jharia Link Bypass Road (Primary)",
    status: "DAMAGED_BLOCKED",
    type: "primary",
    lengthKm: 1.2,
    hazardType: "Massive Overburden Rockfall & Mudslide",
    blockedSegmentCoords: [23.7438, 86.4148],
    affectedVillages: ["Baniahir Basti", "Kujama Pit Hamlet"],
    clearanceETA: "6-8 Hours",
    coordinates: [
      [23.7441, 86.4150],
      [23.7435, 86.4142],
      [23.7420, 86.4125],
      [23.7385, 86.4100]
    ]
  },
  {
    id: "ROUTE-JHR-01-ALT",
    stationId: "NODE-DHN-JHR01",
    name: "High Ridge Bypass via Shanker Colliery (Alternate Safe Corridor)",
    status: "CLEAR_OPEN",
    type: "alternate",
    lengthKm: 2.1,
    hazardType: "None - Elevated Sandstone Crest",
    safetyAdvantage: "Follows stable Barakar sandstone ridge, 35m above flood debris cone. Safe for all vehicles.",
    clearanceETA: "Immediately Passable",
    coordinates: [
      [23.7441, 86.4150],
      [23.7448, 86.4165],
      [23.7432, 86.4180],
      [23.7400, 86.4160],
      [23.7385, 86.4100]
    ]
  },
  {
    id: "ROUTE-BST-02-PRI",
    stationId: "NODE-DHN-BST02",
    name: "NH-32 Direct Cut (Primary)",
    status: "DAMAGED_BLOCKED",
    type: "primary",
    lengthKm: 1.6,
    hazardType: "Highwall Fissure Fracture & Sub-bench Soil Slump",
    blockedSegmentCoords: [23.7705, 86.4285],
    affectedVillages: ["Dhansar Cut Worker Colony"],
    clearanceETA: "12 Hours",
    coordinates: [
      [23.7712, 86.4285],
      [23.7700, 86.4280],
      [23.7680, 86.4290],
      [23.7665, 86.4312]
    ]
  },
  {
    id: "ROUTE-BST-02-ALT",
    stationId: "NODE-DHN-BST02",
    name: "Dhansar Elevated Flyover Bypass (Alternate Safe Corridor)",
    status: "CLEAR_OPEN",
    type: "alternate",
    lengthKm: 2.8,
    hazardType: "None - Reinforced Grade Separation",
    safetyAdvantage: "Pillar-supported elevated corridor immune to ground subsidence fissures.",
    clearanceETA: "Immediately Passable",
    coordinates: [
      [23.7712, 86.4285],
      [23.7730, 86.4310],
      [23.7710, 86.4335],
      [23.7675, 86.4328],
      [23.7665, 86.4312]
    ]
  },
  {
    id: "ROUTE-LDN-03-PRI",
    stationId: "NODE-DHN-LDN03",
    name: "Tisra Link Access Road",
    status: "CLEAR_OPEN",
    type: "primary",
    lengthKm: 0.9,
    hazardType: "None",
    safetyAdvantage: "Direct access route to school gymnasium.",
    clearanceETA: "Passable",
    coordinates: [
      [23.7225, 86.4382],
      [23.7215, 86.4400],
      [23.7190, 86.4425]
    ]
  },
  {
    id: "ROUTE-TOP-04-PRI",
    stationId: "NODE-DHN-TOP04",
    name: "Topchanchi Lake Hillcrest Highway",
    status: "CLEAR_OPEN",
    type: "primary",
    lengthKm: 1.4,
    hazardType: "None",
    safetyAdvantage: "Metalled road above high-water mark.",
    clearanceETA: "Passable",
    coordinates: [
      [23.9015, 86.2085],
      [23.8995, 86.2065],
      [23.8972, 86.2045]
    ]
  }
];

// ==================== WEATHER FORECASTS & RADAR SIMULATION ====================
const WEATHER_FORECASTS = {
  "NODE-DHN-JHR01": {
    stationName: "Jharia Overburden Dump",
    condition: "Violent Thunderstorm & Torrential Rain",
    radarReflectivity: "54 dBZ (Severe Cloud Burst)",
    currentRainRate: "52.4 mm/h",
    precipitation24hExp: "215.0 mm",
    precipitation72hExp: "360.0 mm",
    barometricPressure: "994.2 hPa (Sharp drop -2.8 hPa/h)",
    windSpeed: "48 km/h (Gusts to 68 km/h)",
    humidity: "96%",
    cloudCover: "100% Cumulonimbus",
    flashFloodAlert: "CRITICAL RED - Surface saturation 98%",
    hourlyTrend: [
      { hour: "14:00", rain: 52.4, pop: 100 },
      { hour: "15:00", rain: 58.0, pop: 100 },
      { hour: "16:00", rain: 45.2, pop: 95 },
      { hour: "17:00", rain: 38.0, pop: 85 },
      { hour: "18:00", rain: 26.5, pop: 70 },
      { hour: "19:00", rain: 15.0, pop: 50 }
    ]
  },
  "NODE-DHN-BST02": {
    stationName: "Bastacolla Open-Cast",
    condition: "Heavy Monsoon Downpour",
    radarReflectivity: "48 dBZ (High Storm Cell)",
    currentRainRate: "44.0 mm/h",
    precipitation24hExp: "182.0 mm",
    precipitation72hExp: "310.0 mm",
    barometricPressure: "996.0 hPa (-1.9 hPa/h)",
    windSpeed: "42 km/h",
    humidity: "94%",
    cloudCover: "98%",
    flashFloodAlert: "HIGH ORANGE - Highwall surcharge risk",
    hourlyTrend: [
      { hour: "14:00", rain: 44.0, pop: 95 },
      { hour: "15:00", rain: 48.5, pop: 95 },
      { hour: "16:00", rain: 39.0, pop: 90 },
      { hour: "17:00", rain: 30.2, pop: 75 },
      { hour: "18:00", rain: 20.0, pop: 60 },
      { hour: "19:00", rain: 12.0, pop: 45 }
    ]
  },
  "NODE-DHN-LDN03": {
    stationName: "Lodna Quarry",
    condition: "Moderate Steady Rain",
    radarReflectivity: "36 dBZ (Moderate)",
    currentRainRate: "18.5 mm/h",
    precipitation24hExp: "76.0 mm",
    precipitation72hExp: "125.0 mm",
    barometricPressure: "1001.5 hPa",
    windSpeed: "28 km/h",
    humidity: "86%",
    cloudCover: "85%",
    flashFloodAlert: "YELLOW WATCH - Infiltration monitoring active",
    hourlyTrend: [
      { hour: "14:00", rain: 18.5, pop: 80 },
      { hour: "15:00", rain: 21.0, pop: 80 },
      { hour: "16:00", rain: 17.5, pop: 70 },
      { hour: "17:00", rain: 14.0, pop: 60 },
      { hour: "18:00", rain: 10.0, pop: 50 },
      { hour: "19:00", rain: 6.0, pop: 30 }
    ]
  },
  "NODE-DHN-TOP04": {
    stationName: "Topchanchi Lake Catchment",
    condition: "Intermittent Showers",
    radarReflectivity: "30 dBZ",
    currentRainRate: "14.2 mm/h",
    precipitation24hExp: "52.0 mm",
    precipitation72hExp: "90.0 mm",
    barometricPressure: "1004.0 hPa",
    windSpeed: "22 km/h",
    humidity: "80%",
    cloudCover: "75%",
    flashFloodAlert: "GREEN NORMAL",
    hourlyTrend: [
      { hour: "14:00", rain: 14.2, pop: 65 },
      { hour: "15:00", rain: 12.0, pop: 60 },
      { hour: "16:00", rain: 9.5, pop: 50 },
      { hour: "17:00", rain: 6.0, pop: 40 },
      { hour: "18:00", rain: 3.0, pop: 25 },
      { hour: "19:00", rain: 1.0, pop: 15 }
    ]
  },
  "NODE-DHN-MTH05": {
    stationName: "Maithon Dam Cut",
    condition: "Overcast with Light Mist",
    radarReflectivity: "18 dBZ",
    currentRainRate: "2.5 mm/h",
    precipitation24hExp: "8.5 mm",
    precipitation72hExp: "15.0 mm",
    barometricPressure: "1007.8 hPa",
    windSpeed: "16 km/h",
    humidity: "68%",
    cloudCover: "60%",
    flashFloodAlert: "GREEN NORMAL",
    hourlyTrend: [
      { hour: "14:00", rain: 2.5, pop: 30 },
      { hour: "15:00", rain: 3.0, pop: 30 },
      { hour: "16:00", rain: 2.0, pop: 20 },
      { hour: "17:00", rain: 1.0, pop: 15 },
      { hour: "18:00", rain: 0.5, pop: 10 },
      { hour: "19:00", rain: 0.0, pop: 10 }
    ]
  },
  "NODE-DHN-TND06": {
    stationName: "Tundi Forest Ridge",
    condition: "Cloudy with Light Drizzle",
    radarReflectivity: "20 dBZ",
    currentRainRate: "3.8 mm/h",
    precipitation24hExp: "14.0 mm",
    precipitation72hExp: "28.0 mm",
    barometricPressure: "1006.2 hPa",
    windSpeed: "18 km/h",
    humidity: "70%",
    cloudCover: "65%",
    flashFloodAlert: "GREEN NORMAL",
    hourlyTrend: [
      { hour: "14:00", rain: 3.8, pop: 35 },
      { hour: "15:00", rain: 4.0, pop: 35 },
      { hour: "16:00", rain: 2.5, pop: 25 },
      { hour: "17:00", rain: 1.5, pop: 20 },
      { hour: "18:00", rain: 0.5, pop: 15 },
      { hour: "19:00", rain: 0.0, pop: 10 }
    ]
  }
};

// ==================== 3D TOPOGRAPHY DEM MODEL METADATA ====================
const DEM_PROFILES = {
  "NODE-DHN-JHR01": {
    sector: "Jharia Overburden Dump Sector-4",
    baseElevationMeters: 245,
    crestElevationMeters: 335,
    maxSlopeDeg: 42.5,
    soilCohesionKPa: 12.5,
    frictionAngleDeg: 28.0,
    criticalFailureScarp: [23.7450, 86.4145],
    runoutDebrisVolumeM3: 45000,
    flowPathTraverse: [
      { step: 0, lat: 23.7450, lng: 86.4145, elev: 330, speedMs: 0, feature: "Rupture Crown Scarp" },
      { step: 1, lat: 23.7442, lng: 86.4147, elev: 295, speedMs: 14.5, feature: "Mid-Slope High Velocity Chute" },
      { step: 2, lat: 23.7435, lng: 86.4148, elev: 260, speedMs: 18.2, feature: "Primary Road Breach (Katras Link Road Severed!)" },
      { step: 3, lat: 23.7428, lng: 86.4150, elev: 246, speedMs: 12.0, feature: "Direct Impact: Baniahir Basti Settlement" },
      { step: 4, lat: 23.7420, lng: 86.4152, elev: 240, speedMs: 4.5, feature: "Valley Fan Deposition & Debris Toe" }
    ],
    impactedInfrastructure: [
      { type: "ROAD", name: "Katras-Jharia Link Bypass Road (km 1.2)", impactTimeSec: 42, severity: "DESTROYED / IMPASSABLE" },
      { type: "VILLAGE", name: "Baniahir Basti (Lower Ward 4)", impactTimeSec: 75, severity: "DIRECT RUNOUT INUNDATION (~350 households at risk)" },
      { type: "FACILITY", name: "BCCL Substation Transformer #3", impactTimeSec: 90, severity: "STRUCTURAL HAZARD" }
    ]
  },
  "NODE-DHN-BST02": {
    sector: "Bastacolla Open-Cast Highwall",
    baseElevationMeters: 230,
    crestElevationMeters: 310,
    maxSlopeDeg: 45.0,
    soilCohesionKPa: 14.0,
    frictionAngleDeg: 31.0,
    criticalFailureScarp: [23.7718, 86.4280],
    runoutDebrisVolumeM3: 32000,
    flowPathTraverse: [
      { step: 0, lat: 23.7718, lng: 86.4280, elev: 310, speedMs: 0, feature: "Highwall Tension Crack" },
      { step: 1, lat: 23.7710, lng: 86.4282, elev: 275, speedMs: 16.0, feature: "Bench Topple Chute" },
      { step: 2, lat: 23.7702, lng: 86.4285, elev: 245, speedMs: 15.5, feature: "NH-32 Direct Cut Breach" },
      { step: 3, lat: 23.7690, lng: 86.4290, elev: 232, speedMs: 7.0, feature: "Dhansar Worker Colony Perimeter" }
    ],
    impactedInfrastructure: [
      { type: "ROAD", name: "NH-32 Dhanbad-Bokaro Direct Cut", impactTimeSec: 38, severity: "DEBRIS BLOCKAGE" },
      { type: "VILLAGE", name: "Dhansar Cut Worker Colony", impactTimeSec: 68, severity: "HIGH RISK EVACUATION ZONE" }
    ]
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    INITIAL_STATIONS,
    generateStationHistory,
    EMERGENCY_HELPLINES,
    ALERT_TEMPLATES,
    SOP_GUIDELINES,
    MEDICAL_CENTRES,
    RELIEF_CENTRES,
    EVACUATION_ROUTES,
    WEATHER_FORECASTS,
    DEM_PROFILES
  };
}
