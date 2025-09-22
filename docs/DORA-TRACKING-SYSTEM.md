# 📊 DORA Metrics Tracking System for Students

## 🎯 Overview

This system provides measurable, trackable DORA metrics for the 30-day curriculum, focusing on **realistic improvement targets** rather than "elite" status achievement.

## 📈 DORA Metrics Framework

### 1. Deployment Frequency
**Definition**: How often code is deployed to production (or production-like environment)

#### Measurement Formula
```javascript
deployment_frequency = total_deployments / time_period_days
```

#### Tracking Implementation
```bash
# Copy-paste tracking script
cat > scripts/track-deployments.sh << 'EOF'
#!/bin/bash

DEPLOY_LOG=".dora-metrics/deployments.log"
mkdir -p .dora-metrics

# Log deployment
echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ"),deployment,$(git rev-parse --short HEAD),$(git log -1 --format="%s")" >> $DEPLOY_LOG

# Calculate frequency
if [ -f "$DEPLOY_LOG" ]; then
    DAYS_TRACKED=$(( ($(date +%s) - $(head -1 $DEPLOY_LOG | cut -d',' -f1 | xargs -I {} date -d {} +%s)) / 86400 ))
    TOTAL_DEPLOYMENTS=$(wc -l < $DEPLOY_LOG)

    if [ $DAYS_TRACKED -gt 0 ]; then
        FREQUENCY=$(echo "scale=2; $TOTAL_DEPLOYMENTS / $DAYS_TRACKED" | bc)
        echo "Deployment Frequency: $FREQUENCY deployments/day"
    fi
fi
EOF

chmod +x scripts/track-deployments.sh
```

#### Student Targets
- **Day 3 Baseline**: Measure initial deployment capability
- **Week 1**: 0.5+ deployments/day (1 every 2 days)
- **Week 2**: 1+ deployments/day
- **Week 3**: 1.5+ deployments/day
- **Day 30**: 50% improvement from baseline

### 2. Lead Time for Changes
**Definition**: Time from code commit to production deployment

#### Measurement Formula
```javascript
lead_time = deployment_timestamp - commit_timestamp
```

#### Tracking Implementation
```bash
# Copy-paste lead time tracker
cat > scripts/track-lead-time.sh << 'EOF'
#!/bin/bash

LEAD_TIME_LOG=".dora-metrics/lead-time.log"
mkdir -p .dora-metrics

# Get commit timestamp
COMMIT_TIME=$(git log -1 --format="%ct")
DEPLOY_TIME=$(date +%s)
LEAD_TIME_SECONDS=$((DEPLOY_TIME - COMMIT_TIME))
LEAD_TIME_MINUTES=$((LEAD_TIME_SECONDS / 60))

# Log lead time
echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ"),$LEAD_TIME_MINUTES,$(git rev-parse --short HEAD)" >> $LEAD_TIME_LOG

# Calculate average
if [ -f "$LEAD_TIME_LOG" ]; then
    AVG_LEAD_TIME=$(awk -F',' '{sum+=$2; count++} END {printf "%.2f", sum/count}' $LEAD_TIME_LOG)
    echo "Average Lead Time: $AVG_LEAD_TIME minutes"
fi
EOF

chmod +x scripts/track-lead-time.sh
```

#### Student Targets
- **Day 3 Baseline**: Measure initial commit-to-deploy time
- **Week 1**: < 120 minutes (2 hours)
- **Week 2**: < 60 minutes (1 hour)
- **Week 3**: < 30 minutes
- **Day 30**: 50% reduction from baseline

### 3. Mean Time to Recovery (MTTR)
**Definition**: Time to recover from a production failure

#### Measurement Formula
```javascript
mttr = sum(recovery_times) / number_of_incidents
```

#### Tracking Implementation
```bash
# Copy-paste MTTR tracker
cat > scripts/track-recovery.sh << 'EOF'
#!/bin/bash

RECOVERY_LOG=".dora-metrics/recovery.log"
mkdir -p .dora-metrics

INCIDENT_TYPE=${1:-"general"}
INCIDENT_START=${2:-$(date +%s)}
RECOVERY_TIME=$(date +%s)
RECOVERY_DURATION=$(( (RECOVERY_TIME - INCIDENT_START) / 60 ))

# Log recovery
echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ"),$INCIDENT_TYPE,$RECOVERY_DURATION" >> $RECOVERY_LOG

# Calculate MTTR
if [ -f "$RECOVERY_LOG" ]; then
    MTTR=$(awk -F',' '{sum+=$3; count++} END {printf "%.2f", sum/count}' $RECOVERY_LOG)
    echo "Mean Time to Recovery: $MTTR minutes"
fi

echo "Usage: $0 [incident_type] [start_timestamp]"
echo "Example: $0 \"test_failure\" 1645123456"
EOF

chmod +x scripts/track-recovery.sh
```

#### Student Targets
- **Day 3 Baseline**: Simulate and measure initial recovery capability
- **Week 1**: < 240 minutes (4 hours)
- **Week 2**: < 120 minutes (2 hours)
- **Week 3**: < 60 minutes (1 hour)
- **Day 30**: 50% reduction from baseline

### 4. Change Failure Rate
**Definition**: Percentage of deployments that result in degraded service

#### Measurement Formula
```javascript
failure_rate = (failed_deployments / total_deployments) * 100
```

#### Tracking Implementation
```bash
# Copy-paste failure rate tracker
cat > scripts/track-failures.sh << 'EOF'
#!/bin/bash

FAILURE_LOG=".dora-metrics/failures.log"
DEPLOY_LOG=".dora-metrics/deployments.log"
mkdir -p .dora-metrics

RESULT=${1:-"success"} # success or failure
COMMIT_HASH=$(git rev-parse --short HEAD)

# Log result
echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ"),$RESULT,$COMMIT_HASH" >> $FAILURE_LOG

# Calculate failure rate
if [ -f "$FAILURE_LOG" ] && [ -f "$DEPLOY_LOG" ]; then
    TOTAL_DEPLOYMENTS=$(wc -l < $DEPLOY_LOG)
    FAILED_DEPLOYMENTS=$(grep "failure" $FAILURE_LOG | wc -l)

    if [ $TOTAL_DEPLOYMENTS -gt 0 ]; then
        FAILURE_RATE=$(echo "scale=2; ($FAILED_DEPLOYMENTS / $TOTAL_DEPLOYMENTS) * 100" | bc)
        echo "Change Failure Rate: $FAILURE_RATE%"
    fi
fi

echo "Usage: $0 [success|failure]"
EOF

chmod +x scripts/track-failures.sh
```

#### Student Targets
- **Day 3 Baseline**: Measure initial deployment success rate
- **Week 1**: < 30%
- **Week 2**: < 20%
- **Week 3**: < 15%
- **Day 30**: 50% reduction from baseline

## 🎯 Daily Measurement Workflow

### Day 3: Baseline Establishment
```bash
# Copy-paste baseline measurement
cat > scripts/establish-baseline.sh << 'EOF'
#!/bin/bash

echo "🔄 Establishing DORA Baseline Measurements..."

# Create measurement directory
mkdir -p .dora-metrics

# Baseline deployment (first measurement)
./scripts/track-deployments.sh
./scripts/track-lead-time.sh

# Simulate incident for MTTR baseline
echo "⚠️  Simulating test failure for MTTR baseline..."
INCIDENT_START=$(date +%s)
echo "Press ENTER when you've 'recovered' from the simulated failure..."
read
./scripts/track-recovery.sh "baseline_test" $INCIDENT_START

# Initial success for failure rate
./scripts/track-failures.sh "success"

echo "✅ Baseline established! Check .dora-metrics/ for initial measurements."
EOF

chmod +x scripts/establish-baseline.sh
```

### Daily Tracking Routine
```bash
# Copy-paste daily tracking
cat > scripts/daily-dora-check.sh << 'EOF'
#!/bin/bash

echo "📊 Daily DORA Metrics Check - $(date)"
echo "=================================="

# Check if metrics exist
if [ ! -d ".dora-metrics" ]; then
    echo "❌ No metrics found. Run ./scripts/establish-baseline.sh first"
    exit 1
fi

echo "📈 Current DORA Metrics:"

# Deployment Frequency
if [ -f ".dora-metrics/deployments.log" ]; then
    DAYS_TRACKED=$(( ($(date +%s) - $(head -1 .dora-metrics/deployments.log | cut -d',' -f1 | xargs -I {} date -d {} +%s)) / 86400 ))
    TOTAL_DEPLOYMENTS=$(wc -l < .dora-metrics/deployments.log)
    if [ $DAYS_TRACKED -gt 0 ]; then
        FREQUENCY=$(echo "scale=2; $TOTAL_DEPLOYMENTS / $DAYS_TRACKED" | bc)
        echo "🚀 Deployment Frequency: $FREQUENCY/day"
    fi
fi

# Lead Time
if [ -f ".dora-metrics/lead-time.log" ]; then
    AVG_LEAD_TIME=$(awk -F',' '{sum+=$2; count++} END {printf "%.2f", sum/count}' .dora-metrics/lead-time.log)
    echo "⏱️  Average Lead Time: $AVG_LEAD_TIME minutes"
fi

# Recovery Time
if [ -f ".dora-metrics/recovery.log" ]; then
    MTTR=$(awk -F',' '{sum+=$3; count++} END {printf "%.2f", sum/count}' .dora-metrics/recovery.log)
    echo "🔧 Mean Time to Recovery: $MTTR minutes"
fi

# Failure Rate
if [ -f ".dora-metrics/failures.log" ] && [ -f ".dora-metrics/deployments.log" ]; then
    TOTAL_DEPLOYMENTS=$(wc -l < .dora-metrics/deployments.log)
    FAILED_DEPLOYMENTS=$(grep "failure" .dora-metrics/failures.log | wc -l)
    if [ $TOTAL_DEPLOYMENTS -gt 0 ]; then
        FAILURE_RATE=$(echo "scale=2; ($FAILED_DEPLOYMENTS / $TOTAL_DEPLOYMENTS) * 100" | bc)
        echo "❌ Change Failure Rate: $FAILURE_RATE%"
    fi
fi

echo "=================================="
echo "💡 Tip: Update your README.md with these metrics!"
EOF

chmod +x scripts/daily-dora-check.sh
```

## 📊 Student Progress Dashboard

### Weekly Report Template
```markdown
## Week X DORA Progress Report

### 📈 Metrics Comparison

| Metric | Baseline (Day 3) | Current | Target | Progress |
|--------|------------------|---------|---------|----------|
| Deployment Frequency | X.XX/day | X.XX/day | X.XX/day | ±XX% |
| Lead Time | XXX min | XXX min | XXX min | ±XX% |
| Recovery Time | XXX min | XXX min | XXX min | ±XX% |
| Failure Rate | XX% | XX% | XX% | ±XX% |

### 🎯 Goal Achievement
- [ ] Deployment Frequency Target Met
- [ ] Lead Time Target Met
- [ ] Recovery Time Target Met
- [ ] Failure Rate Target Met

### 📊 Overall DORA Score
**Week X Score**: ___/100
- Deployment Frequency: ___/25
- Lead Time: ___/25
- Recovery Time: ___/25
- Failure Rate: ___/25

### 🔍 Analysis
**Best Performing Metric**: ___
**Needs Most Improvement**: ___
**Key Insights**: ___

### 📅 Next Week Focus
1. ___
2. ___
3. ___
```

### GitHub Actions Integration
```yaml
# Copy-paste into .github/workflows/dora-tracking.yml
name: DORA Metrics Tracking

on:
  push:
    branches: [ main ]
  deployment_status:

jobs:
  track-metrics:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Track Deployment
      run: |
        mkdir -p .dora-metrics
        echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ"),deployment,${GITHUB_SHA:0:7},${GITHUB_REF}" >> .dora-metrics/deployments.log

    - name: Calculate Lead Time
      run: |
        COMMIT_TIME=$(git log -1 --format="%ct")
        DEPLOY_TIME=$(date +%s)
        LEAD_TIME_MINUTES=$(( (DEPLOY_TIME - COMMIT_TIME) / 60 ))
        echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ"),$LEAD_TIME_MINUTES,${GITHUB_SHA:0:7}" >> .dora-metrics/lead-time.log

    - name: Update README with Metrics
      run: |
        if [ -f "scripts/daily-dora-check.sh" ]; then
          chmod +x scripts/daily-dora-check.sh
          ./scripts/daily-dora-check.sh
        fi
```

## 🏆 Certification Levels (Revised)

### Bronze: Foundation (Week 1)
- **Requirement**: All 4 DORA metrics being tracked
- **Target**: 25% improvement from baseline
- **Evidence**: Measurement scripts working, data being collected

### Silver: Improvement (Week 2)
- **Requirement**: 35% improvement in at least 3 metrics
- **Target**: Consistent daily measurements
- **Evidence**: Automated tracking, trend improvement

### Gold: Proficiency (Week 3)
- **Requirement**: 45% improvement in all 4 metrics
- **Target**: Predictable, measurable performance
- **Evidence**: Sustained improvement, process documentation

### Platinum: Mastery (Week 4)
- **Requirement**: 50%+ improvement in all 4 metrics
- **Target**: Teaching others, knowledge transfer
- **Evidence**: Portfolio demonstration, peer mentoring

## 🎯 Success Criteria Framework

### Individual Assessment
```yaml
student_success:
  baseline_establishment:
    - "all_four_metrics_measured"
    - "realistic_baseline_values"
    - "measurement_scripts_working"

  week_1_progress:
    - "consistent_daily_tracking"
    - "at_least_25_percent_improvement"
    - "documentation_updated"

  week_4_achievement:
    - "fifty_percent_improvement_target"
    - "sustainable_process_established"
    - "knowledge_transfer_demonstrated"
```

### Program Effectiveness
```yaml
curriculum_success:
  completion_rate: "target_80_percent"
  improvement_rate: "target_75_percent_achieve_goals"
  satisfaction_score: "target_8_plus_out_of_10"
  methodology_adoption: "target_90_percent_continue_practices"
```

---

**🎓 This DORA tracking system provides measurable, achievable targets for student development progress over 30 days.**

*Focus: Realistic improvement targets, not "elite" status achievement*
*Measurement: Data-driven, automated tracking*
*Success: 50% improvement across all DORA metrics*