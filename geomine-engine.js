// Geomine — Explainable Mine Safety Intelligence Engine
// Team: BHUMI VED | Observe Wider. Explain Risk. Prioritise Safety.
// Compatible with both Node.js (CommonJS) and Browser (window.geomineEngine)

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.geomineEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  // Default Baseline Rules & Thresholds (Can be overridden by rules.json)
  const DEFAULT_RULES = {
    version: 'v3.2-Explainable-Rules',
    thresholds: {
      losVelocityCriticalMmPerYear: 15.0,
      losVelocityModerateMmPerYear: 5.0,
      rainfall24hCriticalMm: 120.0,
      rainfall24hModerateMm: 50.0,
      rainfall72hCriticalMm: 220.0,
      slopeAngleHighwallCriticalDeg: 45.0,
      slopeAngleDumpCriticalDeg: 35.0,
      coherenceMinimumThreshold: 0.25,
      crackWidthCriticalMm: 20.0,
      crackWidthModerateMm: 5.0
    },
    weights: {
      groundMovement: 0.35,
      weather: 0.25,
      terrain: 0.20,
      fieldEvidence: 0.20
    },
    categoryCutoffs: {
      priorityInspectionScore: 75,
      reviewRecommendedScore: 45
    }
  };

  class GeomineSafetyEngine {
    constructor(customRules = null) {
      this.rules = customRules || JSON.parse(JSON.stringify(DEFAULT_RULES));
    }

    setRules(newRules) {
      this.rules = Object.assign({}, this.rules, newRules);
    }

    /**
     * 1. DATA CONFIDENCE & BLIND SPOT EVALUATION
     * Evaluates whether available observations are reliable, noisy, or missing.
     */
    evaluateDataConfidence(zone) {
      const reasons = [];
      const missingInputs = [];
      let status = 'GOOD';
      let label = 'Good Data Coverage';
      let confidenceScore = 90;

      const sar = zone.sarData || {};
      const weather = zone.weatherData || {};
      const field = zone.fieldData || {};

      // Check InSAR Coherence
      const coherence = sar.radarCoherence != null ? sar.radarCoherence : (sar.hasCoverage ? 0.6 : 0.1);
      if (sar.hasCoverage === false || coherence < this.rules.thresholds.coherenceMinimumThreshold) {
        status = 'INSUFFICIENT';
        label = 'Insufficient Evidence — Field Assessment Required';
        confidenceScore = 15;
        reasons.push(`Radar phase decorrelation (coherence γ=${coherence.toFixed(2)} < ${this.rules.thresholds.coherenceMinimumThreshold}) caused by water/vegetation.`);
        missingInputs.push('InSAR displacement signal (decorrelated)');
      } else if (coherence < 0.45) {
        if (status !== 'INSUFFICIENT') {
          status = 'LIMITED';
          label = 'Limited Data';
          confidenceScore = Math.min(confidenceScore, 55);
        }
        reasons.push(`Moderate radar phase noise (coherence γ=${coherence.toFixed(2)}); elevated displacement uncertainty.`);
      }

      // Check SAR Recency
      if (sar.lastAcquisitionDate) {
        const daysAgo = Math.floor((Date.now() - new Date(sar.lastAcquisitionDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysAgo > 18) {
          reasons.push(`Last satellite pass was ${daysAgo} days ago (exceeds Sentinel-1 12-day standard revisit).`);
          confidenceScore -= 15;
          if (status === 'GOOD') {
            status = 'LIMITED';
            label = 'Limited Data';
          }
        }
      } else {
        missingInputs.push('Satellite acquisition catalogue record');
      }

      // Check Weather Data
      if (weather.accum24hMm == null) {
        missingInputs.push('24h precipitation telemetry');
        reasons.push('Precipitation telemetry is missing; using regional historical baseline.');
        confidenceScore -= 15;
      }

      // Check Field Verification Recency
      if (field.lastInspectionDate) {
        const daysSinceField = Math.floor((Date.now() - new Date(field.lastInspectionDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceField > 30) {
          reasons.push(`Field verification is ${daysSinceField} days overdue during active operations.`);
          confidenceScore -= 20;
          if (status === 'GOOD') {
            status = 'LIMITED';
            label = 'Limited Data';
          }
        }
      } else {
        missingInputs.push('Historical field inspection record');
      }

      if (missingInputs.length >= 2 && status !== 'INSUFFICIENT') {
        status = 'POOR';
        label = 'Poor Data Quality';
        confidenceScore = Math.max(25, confidenceScore);
      }

      return {
        status,
        label,
        confidenceScore: Math.max(10, Math.min(100, Math.round(confidenceScore))),
        coherenceIndex: coherence,
        reasons,
        missingInputs,
        requiresFieldVerification: status === 'INSUFFICIENT' || status === 'POOR'
      };
    }

    /**
     * 2. MULTI-EVIDENCE RISK SCREENING
     * Evaluates Ground Movement, Weather, Terrain & Field Evidence separately.
     */
    evaluateZoneScreening(zone) {
      const dataConfidence = this.evaluateDataConfidence(zone);
      const sar = zone.sarData || {};
      const weather = zone.weatherData || {};
      const field = zone.fieldData || {};
      const t = this.rules.thresholds;
      const w = this.rules.weights;

      // Group A: Ground Movement
      let gmScore = 20;
      let gmSeverity = 'LOW';
      let gmDesc = 'Ground movement is within baseline limits.';
      const losVel = sar.losVelocityMmPerYear;
      const absVel = losVel != null ? Math.abs(losVel) : 0;

      if (!sar.hasCoverage || sar.radarCoherence < t.coherenceMinimumThreshold) {
        gmScore = 100; // Triggers Insufficient Evidence flag
        gmSeverity = 'CRITICAL';
        gmDesc = 'InSAR signal is completely decorrelated or unavailable. Motion is unknown.';
      } else if (absVel >= t.losVelocityCriticalMmPerYear) {
        gmScore = 88 + Math.min(12, (absVel - t.losVelocityCriticalMmPerYear) * 2);
        gmSeverity = 'CRITICAL';
        gmDesc = `LOS velocity (${losVel.toFixed(1)} mm/yr) exceeds critical threshold (${t.losVelocityCriticalMmPerYear} mm/yr) with accelerating slope crest deflection.`;
      } else if (absVel >= t.losVelocityModerateMmPerYear) {
        gmScore = 55 + ((absVel - t.losVelocityModerateMmPerYear) / (t.losVelocityCriticalMmPerYear - t.losVelocityModerateMmPerYear)) * 25;
        gmSeverity = 'MODERATE';
        gmDesc = `LOS velocity (${losVel.toFixed(1)} mm/yr) shows moderate settlement above baseline.`;
      } else {
        gmScore = Math.max(10, absVel * 4);
        gmSeverity = 'LOW';
        gmDesc = `LOS velocity (${losVel.toFixed(1)} mm/yr) is within normal elastic and seasonal deformation range.`;
      }

      // Group B: Weather
      let wScore = 20;
      let wSeverity = 'LOW';
      let wDesc = 'Antecedent precipitation is nominal.';
      const r24 = weather.accum24hMm != null ? weather.accum24hMm : 0;
      const r72 = weather.accum72hMm != null ? weather.accum72hMm : 0;

      if (r24 >= t.rainfall24hCriticalMm || r72 >= t.rainfall72hCriticalMm) {
        wScore = 92;
        wSeverity = 'CRITICAL';
        wDesc = `24h rainfall (${r24.toFixed(1)} mm) exceeds critical saturation threshold (${t.rainfall24hCriticalMm} mm). Hydrostatic pore pressure is elevated.`;
      } else if (r24 >= t.rainfall24hModerateMm) {
        wScore = 55 + ((r24 - t.rainfall24hModerateMm) / (t.rainfall24hCriticalMm - t.rainfall24hModerateMm)) * 30;
        wSeverity = 'MODERATE';
        wDesc = `24h rainfall (${r24.toFixed(1)} mm) is elevated; watch for delayed toe drainage saturation.`;
      } else {
        wScore = Math.max(12, r24 * 0.5);
        wSeverity = 'LOW';
        wDesc = `Precipitation (${r24.toFixed(1)} mm / 24h) is within manageable catchment drainage capacity.`;
      }

      // Group C: Terrain & Mine Geometry
      let terScore = 25;
      let terSeverity = 'LOW';
      let terDesc = 'Terrain geometry is favorable to stability.';
      const slope = zone.slopeAngle || 30;
      const zoneType = zone.zoneType || 'BENCH';

      if (zoneType === 'HIGHWALL') {
        if (slope >= t.slopeAngleHighwallCriticalDeg) {
          terScore = 82;
          terSeverity = 'HIGH';
          terDesc = `Highwall slope angle (${slope}°) exceeds standard safe design angle (${t.slopeAngleHighwallCriticalDeg}°).`;
        } else {
          terScore = 45;
          terSeverity = 'MODERATE';
          terDesc = `Highwall slope angle (${slope}°) is within standard pre-split design tolerance.`;
        }
      } else if (zoneType === 'OVERBURDEN_DUMP') {
        if (slope >= t.slopeAngleDumpCriticalDeg) {
          terScore = 75;
          terSeverity = 'HIGH';
          terDesc = `Dump slope (${slope}°) nears or exceeds loose spoil angle of repose (~37°), sensitive to liquefaction.`;
        } else {
          terScore = 38;
          terSeverity = 'LOW';
          terDesc = `Dump slope (${slope}°) is benched and graded below loose spoil critical angle.`;
        }
      } else if (zoneType === 'TAILINGS_EMBANKMENT') {
        terScore = 70;
        terSeverity = 'HIGH';
        terDesc = `Water-retaining tailings perimeter bund requiring high factor of safety due to downstream consequence.`;
      } else {
        terScore = Math.min(60, slope * 1.5);
        terSeverity = slope > 25 ? 'MODERATE' : 'LOW';
        terDesc = `Working bench road gradient (${slope}°) complies with haulage standards.`;
      }

      // Group D: Field Evidence
      let fldScore = 15;
      let fldSeverity = 'LOW';
      let fldDesc = 'No recent structural fissures or open non-conformances on record.';
      const crackWidth = field.crackWidthMm || 0;
      const crackObserved = field.crackObserved === true;

      if (crackObserved && crackWidth >= t.crackWidthCriticalMm) {
        fldScore = 90;
        fldSeverity = 'CRITICAL';
        fldDesc = `Physical inspection confirmed tension crack widening to ${crackWidth} mm with active crest dilation.`;
      } else if (crackObserved && crackWidth >= t.crackWidthModerateMm) {
        fldScore = 60;
        fldSeverity = 'MODERATE';
        fldDesc = `Physical inspection confirmed minor tension fissure (${crackWidth} mm) under monitoring.`;
      } else if (field.waterSeepage && field.waterSeepage.includes('ACTIVE')) {
        fldScore = 70;
        fldSeverity = 'HIGH';
        fldDesc = 'Active water seepage reported at toe, indicating elevated pore pressure.';
      } else if (dataConfidence.status === 'INSUFFICIENT' && (!field.lastInspectionDate || (Date.now() - new Date(field.lastInspectionDate).getTime()) > 30 * 86400000)) {
        fldScore = 95;
        fldSeverity = 'CRITICAL';
        fldDesc = 'Field inspection is overdue during heavy rainfall, exacerbating data blind spot.';
      }

      // Composite Screening Score Calculation
      const compositeScore = Math.round(
        (gmScore * w.groundMovement +
         wScore * w.weather +
         terScore * w.terrain +
         fldScore * w.fieldEvidence) * 10
      ) / 10;

      // Determine Operational Priority Category
      let category = 'Routine Monitoring';
      let recommendedAction = 'Maintain scheduled periodic surveillance and sensor health checks.';

      if (dataConfidence.status === 'INSUFFICIENT') {
        category = 'Insufficient Evidence';
        recommendedAction = 'PRIORITY MANUAL DISPATCH REQUIRED: Blind spot detected. Satellite radar is decorrelated and in-situ evidence is missing. Dispatch field geotechnical officer immediately.';
      } else if (compositeScore >= this.rules.categoryCutoffs.priorityInspectionScore || gmSeverity === 'CRITICAL' || (fldSeverity === 'CRITICAL' && wSeverity === 'CRITICAL')) {
        category = 'Priority Inspection';
        recommendedAction = 'Immediate geotechnical field dispatch required. Restrict heavy haul truck movement on lower bench. Verify crack extensometers and toe drainage.';
      } else if (compositeScore >= this.rules.categoryCutoffs.reviewRecommendedScore || gmSeverity === 'MODERATE' || wSeverity === 'CRITICAL') {
        category = 'Review Recommended';
        recommendedAction = 'Conduct detailed geotechnical review or drone photogrammetry walkover. Inspect drainage ditches and maintain heightened watch.';
      }

      // Detect Conflicts
      const conflicts = [];
      if (dataConfidence.status === 'INSUFFICIENT') {
        conflicts.push('CRITICAL BLIND SPOT: Missing or decorrelated radar data must NEVER be interpreted as slope stability. Manual field verification is mandatory.');
      }
      if (sar.radarCoherence != null && sar.radarCoherence < 0.45 && absVel > 12) {
        conflicts.push('Radar coherence is marginal; InSAR displacement estimate has elevated phase noise. Verify via borehole inclinometer or total station.');
      }
      if (wSeverity === 'CRITICAL' && gmSeverity === 'LOW') {
        conflicts.push('Extreme antecedent precipitation recorded, but InSAR displacement remains low. Delayed pore pressure dissipation may manifest in subsequent passes.');
      }
      if (fldSeverity === 'CRITICAL' && gmSeverity === 'LOW') {
        conflicts.push('Field inspection identified tension cracks, but satellite InSAR did not show significant LOS movement. Likely localized shallow scarp or satellite pass geometry blind angle.');
      }

      const contributingFactors = [
        {
          group: 'Ground Movement',
          factor: 'LOS Velocity & Trend',
          value: sar.hasCoverage ? `${losVel != null ? losVel.toFixed(1) : 0} mm/yr (coherence γ=${sar.radarCoherence != null ? sar.radarCoherence.toFixed(2) : 'N/A'})` : 'Unavailable (Decorrelated)',
          severity: gmSeverity,
          weight: w.groundMovement,
          score: Math.round(gmScore),
          description: gmDesc
        },
        {
          group: 'Weather',
          factor: 'Antecedent Precipitation',
          value: `${r24.toFixed(1)} mm / 24h (${r72.toFixed(1)} mm / 72h)`,
          severity: wSeverity,
          weight: w.weather,
          score: Math.round(wScore),
          description: wDesc
        },
        {
          group: 'Terrain & Geometry',
          factor: 'DEM Slope Angle & Structure',
          value: `${slope}° (${zoneType})`,
          severity: terSeverity,
          weight: w.terrain,
          score: Math.round(terScore),
          description: terDesc
        },
        {
          group: 'Field Evidence',
          factor: 'Inspections & Fissures',
          value: crackObserved ? `${crackWidth}mm tension crack` : (field.lastInspectionDate ? 'Visual check passed' : 'Overdue'),
          severity: fldSeverity,
          weight: w.fieldEvidence,
          score: Math.round(fldScore),
          description: fldDesc
        }
      ];

      return {
        category,
        compositeScore,
        dataConfidence,
        contributingFactors,
        conflicts,
        recommendedAction,
        screenedAt: new Date().toISOString(),
        engineVersion: this.rules.version
      };
    }

    /**
     * 3. COUNTERFACTUAL / SCENARIO LAB
     * Evaluates hypothetical changes on a cloned zone without mutating real records.
     */
    evaluateHypotheticalScenario(baseZone, scenarioInputs) {
      // Deep clone to prevent mutating live records
      const clonedZone = JSON.parse(JSON.stringify(baseZone));

      // Apply hypothetical scenario adjustments
      if (scenarioInputs.rainfall24hMm != null) {
        clonedZone.weatherData.accum24hMm = scenarioInputs.rainfall24hMm;
      }
      if (scenarioInputs.losVelocityMmPerYear != null) {
        clonedZone.sarData.losVelocityMmPerYear = scenarioInputs.losVelocityMmPerYear;
      }
      if (scenarioInputs.radarCoherence != null) {
        clonedZone.sarData.radarCoherence = scenarioInputs.radarCoherence;
        if (scenarioInputs.radarCoherence < this.rules.thresholds.coherenceMinimumThreshold) {
          clonedZone.sarData.hasCoverage = false;
        } else {
          clonedZone.sarData.hasCoverage = true;
        }
      }
      if (scenarioInputs.crackObserved != null) {
        clonedZone.fieldData.crackObserved = scenarioInputs.crackObserved;
        clonedZone.fieldData.crackWidthMm = scenarioInputs.crackWidthMm || (scenarioInputs.crackObserved ? 30 : 0);
      }
      if (scenarioInputs.slopeAngle != null) {
        clonedZone.slopeAngle = scenarioInputs.slopeAngle;
      }

      const baselineEval = this.evaluateZoneScreening(baseZone);
      const hypotheticalEval = this.evaluateZoneScreening(clonedZone);

      // Analyze What Changed / Sensitivity Explanation
      const differences = [];
      if (baselineEval.category !== hypotheticalEval.category) {
        differences.push(`Screening category shifted from "${baselineEval.category}" to "${hypotheticalEval.category}".`);
      } else {
        differences.push(`Screening category remained "${baselineEval.category}".`);
      }

      const scoreDelta = Math.round((hypotheticalEval.compositeScore - baselineEval.compositeScore) * 10) / 10;
      differences.push(`Composite screening score shifted by ${scoreDelta > 0 ? '+' : ''}${scoreDelta} points (${baselineEval.compositeScore} -> ${hypotheticalEval.compositeScore}).`);

      return {
        isHypothetical: true,
        watermark: 'HYPOTHETICAL SCENARIO — NOT A REAL-WORLD SAFETY PREDICTION',
        zoneId: baseZone.id,
        baseline: baselineEval,
        hypothetical: hypotheticalEval,
        scoreDelta,
        explanationDiff: differences.join(' '),
        inputsTested: scenarioInputs
      };
    }

    /**
     * 4. MODEL EVALUATION & VALIDATION ENGINE
     * Evaluates recorded historical field inspection cases against system flags.
     */
    evaluateHistoricalPerformance(inspections, assessments = []) {
      const completed = inspections.filter(i => i.fieldFindings && i.fieldFindings.concernOutcome);
      
      if (completed.length < 3) {
        return {
          hasEnoughData: false,
          message: 'Insufficient verified data for model evaluation (minimum 3 completed field cases required).',
          totalInspections: inspections.length,
          completedCount: completed.length
        };
      }

      let confirmedCount = 0;
      let notObservedCount = 0;
      let inconclusiveCount = 0;
      let priorityFlagsConfirmed = 0;
      let priorityFlagsBenign = 0; // False alarms

      const zoneTypeStats = {
        HIGHWALL: { total: 0, confirmed: 0 },
        OVERBURDEN_DUMP: { total: 0, confirmed: 0 },
        BENCH: { total: 0, confirmed: 0 },
        TAILINGS_EMBANKMENT: { total: 0, confirmed: 0 }
      };

      completed.forEach(c => {
        const outcome = c.fieldFindings.concernOutcome;
        const prio = c.inspectionPriority;
        const zType = c.zoneType || (c.zoneId.startsWith('HW') ? 'HIGHWALL' : c.zoneId.startsWith('OBD') ? 'OVERBURDEN_DUMP' : c.zoneId.startsWith('BN') ? 'BENCH' : 'TAILINGS_EMBANKMENT');

        if (zoneTypeStats[zType]) {
          zoneTypeStats[zType].total++;
        }

        if (outcome === 'CONFIRMED') {
          confirmedCount++;
          if (prio === 'HIGH') priorityFlagsConfirmed++;
          if (zoneTypeStats[zType]) zoneTypeStats[zType].confirmed++;
        } else if (outcome === 'NOT_OBSERVED') {
          notObservedCount++;
          if (prio === 'HIGH') priorityFlagsBenign++;
        } else {
          inconclusiveCount++;
        }
      });

      const precisionDenominator = (priorityFlagsConfirmed + priorityFlagsBenign);
      const empiricalPrecision = precisionDenominator > 0 ? (priorityFlagsConfirmed / precisionDenominator) : null;

      return {
        hasEnoughData: true,
        totalCases: inspections.length,
        completedInspections: completed.length,
        confirmedConcerns: confirmedCount,
        notObservedConcerns: notObservedCount,
        inconclusiveConcerns: inconclusiveCount,
        highPriorityTruePositives: priorityFlagsConfirmed,
        highPriorityFalseAlarms: priorityFlagsBenign,
        empiricalVerificationRatePercent: empiricalPrecision != null ? Math.round(empiricalPrecision * 100) : 100,
        zoneTypeBreakdown: zoneTypeStats,
        missingDataFrequencyPercent: Math.round((inspections.filter(i => i.flagReason && i.flagReason.includes('BLIND SPOT')).length / inspections.length) * 100),
        methodologyNotes: 'Empirical verification rate computes the ratio of High Priority screening flags confirmed by field geotechnical inspection. Continuous improvement loop informs threshold calibration without unverified automatic self-training.'
      };
    }
  }

  return {
    GeomineSafetyEngine,
    DEFAULT_RULES,
    engineInstance: new GeomineSafetyEngine()
  };
});
