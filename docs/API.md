# 🚀 Vibe Coding Academy - API Documentation

## Student Learning Endpoints

### Learning Journey
- `GET /api/learning/start` - Begin your Elite development journey
- `GET /api/learning/progress` - Track your DORA metrics improvement

### Career Development
- `GET /api/career/skills` - View market demand and salary data
- `GET /api/career/progression` - $50k → $250k+ career pathways

### Security Fundamentals
- `GET /api/security/scan` - Educational security assessment simulation
- `GET /api/security/best-practices` - Industry security standards

### Performance Metrics
- `GET /api/metrics` - Your development performance dashboard
- `GET /api/health` - System status and availability

## Example Usage

```bash
# Start your learning journey
curl http://localhost:3000/api/learning/start

# Check career opportunities
curl http://localhost:3000/api/career/skills

# Run security assessment
curl http://localhost:3000/api/security/scan
```

## Response Formats

All endpoints return JSON with:
- `timestamp`: Request processing time
- `data`: Response payload
- `learningNote`: Educational context
- `nextSteps`: Suggested actions

Ready to build amazing APIs? Start with `npm start`!
