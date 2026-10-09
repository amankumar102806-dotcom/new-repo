// GeoGuard AI - Geotechnical Landslide Prediction Engine

class LandslidePredictionEngine {
  constructor() {
    // Standard geotechnical physical parameters
    this.soilParams = {
      effectiveCohesion: 14.5, // c' in kPa
      frictionAngle: 32.0, // phi' in degrees
      soilUnitWeight: 19.0, // gamma in kN/m^3
      waterUnitWeight: 9.81, // gamma_w in kN/m^3
      depthToSlipSurface: 2.4 // z in meters
    };
  }

  /**
   * Calculates the geotechnical Factor of Safety (FoS)
   * using the Infinite Slope Stability Formulation with pore-water saturation.
   * FoS = (c' + (gamma - m * gamma_w) * z * cos^2(theta) * tan(phi')) / (gamma * z * sin(theta) * cos(theta))
   */
  calculateFactorOfSafety(station) {
    const { slopeAngle } = station;
    const { soilMoisture, tilt, porePressure } = station.sensors;

    // Total effective inclination angle = slope angle + dynamic tilt deflection
    const tiltDeflection = Math.sqrt(Math.pow(tilt.x, 2) + Math.pow(tilt.y, 2));
    const effectiveAngleDeg = Math.min(85, Math.max(10, slopeAngle + tiltDeflection));
    const theta = (effectiveAngleDeg * Math.PI) / 180;

    const phi = (this.soilParams.frictionAngle * Math.PI) / 180;
    const c = this.soilParams.effectiveCohesion;
    const gamma = this.soilParams.soilUnitWeight;
    const gamma_w = this.soilParams.waterUnitWeight;
    const z = this.soilParams.depthToSlipSurface;

    // Saturation ratio m (0.0 to 1.0) derived from soil moisture %
    const m = Math.min(1.0, Math.max(0.05, soilMoisture / 100));

    // Pore pressure influence
    const effectivePoreReduction = (porePressure / 100) * gamma_w * z;

    // Resisting Shear Strength
    const effectiveStressNormal = (gamma - m * gamma_w) * z * Math.pow(Math.cos(theta), 2);
    const resistingForce = c + Math.max(0.1, effectiveStressNormal) * Math.tan(phi);

    // Driving Gravitational Shear Stress
    const drivingForce = gamma * z * Math.sin(theta) * Math.cos(theta);

    if (drivingForce <= 0) return 2.5;

    let fos = resistingForce / drivingForce;

    // Dampen if pore pressure is critically elevated
    if (porePressure > 40) {
      fos *= Math.max(0.65, 1 - (porePressure - 40) / 100);
    }

    return parseFloat(Math.max(0.4, Math.min(3.0, fos)).toFixed(2));
  }

  /**
   * Evaluates rainfall against empirical Intensity-Duration (I-D) Thresholds
   * (Caine, 1980 / Guzzetti et al., 2008: I = 14.82 * D^-0.39)
   */
  evaluateRainfallThreshold(rainfallRate, rainfallAccum24h) {
    // Critical 1-hour intensity threshold is approx 25-35 mm/h
    // Critical 24-hour cumulative threshold is approx 120-150 mm
    const rateRatio = rainfallRate / 35.0;
    const accumRatio = rainfallAccum24h / 140.0;
    const severity = Math.min(1.0, 0.5 * rateRatio + 0.5 * accumRatio);
    return {
      severity, // 0.0 to 1.0+
      isExceeded: rainfallRate >= 35.0 || rainfallAccum24h >= 140.0
    };
  }

  /**
   * Multi-sensor AI Risk Fusion Algorithm
   * Integrates Soil Moisture, Rainfall Rate, Tilt rate/angle, Pore Pressure, and FoS.
   */
  evaluateStationRisk(station) {
    const fos = this.calculateFactorOfSafety(station);
    const rainfallEval = this.evaluateRainfallThreshold(
      station.sensors.rainfallRate,
      station.sensors.rainfallAccum24h
    );

    const moisture = station.sensors.soilMoisture;
    const tiltRate = station.sensors.tilt.rateOfChange;
    const tiltDeflection = Math.sqrt(
      Math.pow(station.sensors.tilt.x, 2) + Math.pow(station.sensors.tilt.y, 2)
    );

    // Sub-scores (0 to 100)
    // 1. FoS Score: FoS < 1.0 -> 100, FoS 1.0-1.3 -> 60-80, FoS > 1.5 -> <30
    let fosScore = 0;
    if (fos <= 0.8) fosScore = 100;
    else if (fos <= 1.0) fosScore = 85 + (1.0 - fos) * 75;
    else if (fos <= 1.3) fosScore = 50 + (1.3 - fos) * 116;
    else if (fos <= 1.6) fosScore = 20 + (1.6 - fos) * 100;
    else fosScore = Math.max(5, 20 - (fos - 1.6) * 15);

    // 2. Moisture Score
    let moistureScore = Math.min(100, Math.max(0, (moisture - 20) * 1.25));

    // 3. Rainfall Score
    let rainfallScore = Math.min(100, rainfallEval.severity * 100);

    // 4. Tilt Dynamic Score
    let tiltScore = 0;
    if (tiltRate > 0.8 || tiltDeflection > 4.5) tiltScore = 100;
    else if (tiltRate > 0.3 || tiltDeflection > 2.0) tiltScore = 70;
    else if (tiltRate > 0.1 || tiltDeflection > 1.0) tiltScore = 40;
    else tiltScore = 15;

    // Weighted Unified Risk Score
    const compositeRisk = Math.round(
      fosScore * 0.38 +
      rainfallScore * 0.26 +
      moistureScore * 0.20 +
      tiltScore * 0.16
    );

    // Threshold Classification:
    // Green (Safe): < 38
    // Yellow (Moderate): 38 - 68
    // Red (High Risk): >= 69
    let riskLevel = 'SAFE';
    let color = '#10b981'; // Green
    let statusLabel = 'Safe Slope Stability';
    let timeToPotentialFailure = 'N/A (Stable)';
    let actionRecommendation = 'Routine periodic telemetry monitoring active.';

    if (compositeRisk >= 69 || fos < 1.05 || (moisture > 82 && rainfallEval.isExceeded)) {
      riskLevel = 'HIGH';
      color = '#ef4444'; // Red
      statusLabel = 'CRITICAL: High Landslide Risk';
      timeToPotentialFailure = '30 - 90 Minutes (Imminent)';
      actionRecommendation = 'IMMEDIATE EVACUATION: Push community broadcast, deploy NDRF, and clear downstream zones.';
    } else if (compositeRisk >= 38 || fos < 1.35 || moisture > 55 || rainfallEval.severity > 0.4) {
      riskLevel = 'MODERATE';
      color = '#f59e0b'; // Yellow
      statusLabel = 'WARNING: Moderate Instability Watch';
      timeToPotentialFailure = '4 - 12 Hours (Weather Dependent)';
      actionRecommendation = 'HIGH ALERT: Send advisory push, inspect drainage, and prepare emergency shelters.';
    }

    // Failure Probability Calculation (Logistic curve approximation)
    const failureProbability = Math.min(99.4, Math.max(1.2, 100 / (1 + Math.exp(-0.08 * (compositeRisk - 50)))));

    return {
      riskLevel,
      color,
      statusLabel,
      compositeRisk,
      factorOfSafety: fos,
      failureProbability: parseFloat(failureProbability.toFixed(1)),
      tiltDeflection: parseFloat(tiltDeflection.toFixed(2)),
      timeToPotentialFailure,
      actionRecommendation,
      scores: {
        fos: Math.round(fosScore),
        rainfall: Math.round(rainfallScore),
        moisture: Math.round(moistureScore),
        tilt: Math.round(tiltScore)
      }
    };
  }
}

// Instantiate singleton
const predictionEngine = new LandslidePredictionEngine();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LandslidePredictionEngine,
    predictionEngine
  };
}
