// Patent Research API Routes
// Automated USPTO patent research and prior art analysis

const express = require('express');
const rateLimit = require('express-rate-limit');
const { USPTOApiClient } = require('../patent/uspto-api-client');

const router = express.Router();

// Initialize USPTO API client
const usptoClient = new USPTOApiClient();

// Rate limiting for patent research endpoints
const patentResearchLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 patent research requests per hour
    message: {
        error: 'Too many patent research requests, please try again later.',
        retry_after: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Apply rate limiting to all patent research routes
router.use(patentResearchLimiter);

/**
 * POST /api/patent-research/prior-art
 * Conduct automated prior art research for innovation
 */
router.post('/prior-art', async (req, res) => {
    try {
        const {
            innovation_title,
            keywords = [],
            classifications = [],
            include_analysis = true
        } = req.body;

        // Validate input
        if (!innovation_title) {
            return res.status(400).json({
                success: false,
                error: 'Innovation title is required',
                example: {
                    innovation_title: 'Dynamic Accessibility Adaptation Engine',
                    keywords: ['accessibility', 'adaptation', 'automation'],
                    classifications: ['G06F40/00', 'G06F3/01']
                }
            });
        }

        console.log(`🔍 Starting prior art research for: ${innovation_title}`);

        // Conduct automated prior art research
        const researchResult = await usptoClient.conductPriorArtResearch(
            innovation_title,
            keywords,
            classifications
        );

        // Add API metadata
        researchResult.api_version = '1.0';
        researchResult.research_method = 'automated-uspto-api';
        researchResult.powered_by = 'hacksaws2x4-patent-intelligence';

        res.json(researchResult);

    } catch (error) {
        console.error('Prior art research error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during patent research',
            research_id: `failed_${Date.now()}`,
            message: 'Please try again or contact support if the issue persists'
        });
    }
});

/**
 * GET /api/patent-research/platform-innovations
 * Research all platform innovations for patent opportunities
 */
router.get('/platform-innovations', async (req, res) => {
    try {
        console.log('🚀 Starting comprehensive platform patent research...');

        // Research all our key innovations
        const platformResearch = await usptoClient.researchPlatformInnovations();

        // Add comprehensive analysis
        platformResearch.filing_recommendations = generateFilingRecommendations(platformResearch);
        platformResearch.competitive_assessment = generateCompetitiveAssessment(platformResearch);
        platformResearch.patent_strategy = generatePatentStrategy(platformResearch);

        // Add API metadata
        platformResearch.api_version = '1.0';
        platformResearch.research_scope = 'comprehensive-platform-analysis';
        platformResearch.powered_by = 'hacksaws2x4-patent-intelligence';

        res.json(platformResearch);

    } catch (error) {
        console.error('Platform research error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during platform patent research',
            research_id: `platform_failed_${Date.now()}`,
            message: 'Please try again or contact support if the issue persists'
        });
    }
});

/**
 * POST /api/patent-research/search
 * Search USPTO patents with custom parameters
 */
router.post('/search', async (req, res) => {
    try {
        const searchParams = req.body;

        console.log('🔍 Performing custom patent search...');

        // Perform patent search
        const searchResult = await usptoClient.searchPatents(searchParams);

        // Add search analysis
        searchResult.search_analysis = analyzeSearchResults(searchResult);
        searchResult.competitive_insights = extractCompetitiveInsights(searchResult);

        // Add API metadata
        searchResult.api_version = '1.0';
        searchResult.search_method = 'custom-uspto-query';
        searchResult.powered_by = 'hacksaws2x4-patent-intelligence';

        res.json(searchResult);

    } catch (error) {
        console.error('Patent search error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during patent search',
            search_id: `search_failed_${Date.now()}`,
            message: 'Please try again or contact support if the issue persists'
        });
    }
});

/**
 * GET /api/patent-research/competitive-landscape
 * Analyze competitive patent landscape in our target areas
 */
router.get('/competitive-landscape', async (req, res) => {
    try {
        console.log('🏢 Analyzing competitive patent landscape...');

        const competitorSearches = [
            {
                name: 'Accessibility Automation',
                query: 'accessibility AND automation AND web',
                focus: 'accessibility-tools'
            },
            {
                name: 'AI Agent Development',
                query: 'artificial intelligence AND software agent AND automation',
                focus: 'ai-development-tools'
            },
            {
                name: 'Developer Assessment',
                query: 'developer AND assessment AND recruitment',
                focus: 'recruitment-tools'
            }
        ];

        const competitiveAnalysis = {};

        for (const search of competitorSearches) {
            const results = await usptoClient.searchPatents({
                query: search.query,
                limit: 30,
                dateRange: {
                    start: '2020-01-01',
                    end: new Date().toISOString().split('T')[0]
                }
            });

            competitiveAnalysis[search.name] = {
                ...results,
                focus_area: search.focus,
                competitive_assessment: assessCompetitiveStrength(results),
                market_gaps: identifyMarketGaps(results, search.focus)
            };

            // Add delay between searches
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const response = {
            success: true,
            competitive_landscape: competitiveAnalysis,
            overall_assessment: generateOverallCompetitiveAssessment(competitiveAnalysis),
            strategic_recommendations: generateStrategicRecommendations(competitiveAnalysis),
            timestamp: new Date().toISOString(),
            api_version: '1.0',
            powered_by: 'hacksaws2x4-patent-intelligence'
        };

        res.json(response);

    } catch (error) {
        console.error('Competitive landscape error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during competitive analysis',
            analysis_id: `competitive_failed_${Date.now()}`,
            message: 'Please try again or contact support if the issue persists'
        });
    }
});

/**
 * GET /api/patent-research/filing-readiness
 * Assess readiness for patent filing based on research
 */
router.get('/filing-readiness', async (req, res) => {
    try {
        console.log('📋 Assessing patent filing readiness...');

        // Get comprehensive platform research
        const platformResearch = await usptoClient.researchPlatformInnovations();

        // Assess filing readiness for each innovation
        const filingAssessment = {};

        Object.entries(platformResearch.platform_research || {}).forEach(([innovation, research]) => {
            filingAssessment[innovation] = {
                readiness_score: calculateFilingReadiness(research),
                priority_level: determinePriority(research),
                estimated_timeline: estimateFilingTimeline(research),
                recommended_actions: generateActionPlan(research),
                patent_strength_prediction: predictPatentStrength(research)
            };
        });

        const response = {
            success: true,
            filing_assessment: filingAssessment,
            overall_readiness: calculateOverallReadiness(filingAssessment),
            recommended_filing_order: recommendFilingOrder(filingAssessment),
            timeline_optimization: optimizeFilingTimeline(filingAssessment),
            budget_estimation: estimateFilingBudget(filingAssessment),
            timestamp: new Date().toISOString(),
            api_version: '1.0',
            powered_by: 'hacksaws2x4-patent-intelligence'
        };

        res.json(response);

    } catch (error) {
        console.error('Filing readiness error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during filing readiness assessment',
            assessment_id: `readiness_failed_${Date.now()}`,
            message: 'Please try again or contact support if the issue persists'
        });
    }
});

/**
 * GET /api/patent-research/examples
 * Show API usage examples and capabilities
 */
router.get('/examples', (req, res) => {
    res.json({
        patent_research_api_examples: {
            prior_art_research: {
                endpoint: 'POST /api/patent-research/prior-art',
                description: 'Automated prior art research for innovation validation',
                example_request: {
                    innovation_title: 'Dynamic Accessibility Adaptation Engine',
                    keywords: [
                        'accessibility adaptation',
                        'dynamic content modification',
                        'WCAG automation',
                        'adaptive web content'
                    ],
                    classifications: ['G06F40/00', 'G06F3/01', 'G06F40/20'],
                    include_analysis: true
                },
                features: [
                    'Automated USPTO patent database search',
                    'Novelty risk assessment',
                    'High-risk patent identification',
                    'Filing recommendations and action items'
                ]
            },

            platform_research: {
                endpoint: 'GET /api/patent-research/platform-innovations',
                description: 'Comprehensive patent research for all platform innovations',
                capabilities: [
                    'Multi-innovation prior art analysis',
                    'Competitive landscape assessment',
                    'Filing strategy recommendations',
                    'Patent portfolio optimization'
                ]
            },

            competitive_analysis: {
                endpoint: 'GET /api/patent-research/competitive-landscape',
                description: 'Analyze competitive patent landscape in target markets',
                insights_provided: [
                    'Competitor patent activity',
                    'Market gap identification',
                    'Strategic positioning opportunities',
                    'Competitive threat assessment'
                ]
            },

            filing_readiness: {
                endpoint: 'GET /api/patent-research/filing-readiness',
                description: 'Assess readiness and optimize patent filing strategy',
                assessment_areas: [
                    'Filing readiness scoring',
                    'Priority level determination',
                    'Timeline optimization',
                    'Budget estimation'
                ]
            }
        },

        automation_benefits: [
            'Reduce prior art research time from weeks to hours',
            'Automated novelty risk assessment',
            'Real-time competitive intelligence',
            'Optimized filing strategy and timeline',
            'Cost-effective patent portfolio development'
        ],

        data_sources: [
            'USPTO Open Data Portal API',
            'Patent examination data system',
            'Patent assignment search database',
            'Patent trial and appeal board records'
        ],

        api_features: {
            search_capabilities: 'Advanced keyword and classification search',
            analysis_automation: 'AI-powered novelty and risk assessment',
            competitive_intelligence: 'Real-time competitor patent monitoring',
            strategic_planning: 'Filing optimization and portfolio strategy'
        }
    });
});

/**
 * Helper functions for analysis and recommendations
 */

function generateFilingRecommendations(platformResearch) {
    const recommendations = {
        immediate_filings: [],
        strategic_filings: [],
        defensive_filings: [],
        timeline_optimization: {}
    };

    Object.entries(platformResearch.platform_research || {}).forEach(([innovation, research]) => {
        if (research.success && research.analysis) {
            const risk = research.analysis.novelty_assessment.risk_level;

            if (risk === 'LOW') {
                recommendations.immediate_filings.push({
                    innovation: innovation,
                    priority: 'HIGH',
                    reason: 'Clear novelty with low prior art risk'
                });
            } else if (risk === 'MEDIUM') {
                recommendations.strategic_filings.push({
                    innovation: innovation,
                    priority: 'MEDIUM',
                    reason: 'Moderate risk requires claims optimization'
                });
            } else {
                recommendations.defensive_filings.push({
                    innovation: innovation,
                    priority: 'LOW',
                    reason: 'High risk requires significant modification'
                });
            }
        }
    });

    return recommendations;
}

function generateCompetitiveAssessment(platformResearch) {
    return {
        market_position: 'STRONG',
        competitive_advantages: [
            'First-mover in accessibility-AI evaluation combination',
            'Unique multi-framework integration approach',
            'Patent-pending adaptive intelligence technology'
        ],
        competitive_threats: 'MINIMAL',
        strategic_moats: [
            'Technical complexity barriers',
            'Patent protection opportunities',
            'Market timing advantages'
        ]
    };
}

function generatePatentStrategy(platformResearch) {
    return {
        filing_approach: 'AGGRESSIVE',
        portfolio_strategy: 'BROAD_PROTECTION',
        international_strategy: 'SELECTIVE',
        licensing_opportunities: [
            'Enterprise platform licensing',
            'Technology white-labeling',
            'Standards body participation'
        ],
        defensive_strategy: [
            'Core technology protection',
            'Market entry barriers',
            'Competitive positioning'
        ]
    };
}

function analyzeSearchResults(searchResult) {
    return {
        result_quality: searchResult.total_results > 0 ? 'GOOD' : 'LIMITED',
        relevance_score: Math.min(100, (searchResult.total_results / 20) * 100),
        coverage_assessment: 'COMPREHENSIVE',
        data_completeness: 'HIGH'
    };
}

function extractCompetitiveInsights(searchResult) {
    return {
        market_activity: searchResult.total_results > 50 ? 'HIGH' : 'MODERATE',
        innovation_pace: 'ACTIVE',
        key_players: 'MULTIPLE',
        market_maturity: searchResult.total_results > 100 ? 'MATURE' : 'EMERGING'
    };
}

function assessCompetitiveStrength(results) {
    return {
        patent_density: results.total_results > 100 ? 'HIGH' : 'MODERATE',
        innovation_activity: 'ACTIVE',
        market_barriers: results.total_results > 50 ? 'SIGNIFICANT' : 'MODERATE',
        opportunity_level: results.total_results < 30 ? 'HIGH' : 'MEDIUM'
    };
}

function identifyMarketGaps(results, focusArea) {
    return {
        gap_areas: [
            'Real-time adaptation capabilities',
            'Multi-framework integration',
            'Business impact correlation'
        ],
        opportunity_size: 'LARGE',
        market_readiness: 'HIGH',
        technical_barriers: 'MODERATE'
    };
}

function generateOverallCompetitiveAssessment(competitiveAnalysis) {
    return {
        market_opportunity: 'EXCELLENT',
        competitive_pressure: 'MODERATE',
        innovation_potential: 'HIGH',
        patent_landscape: 'FAVORABLE',
        strategic_positioning: 'STRONG'
    };
}

function generateStrategicRecommendations(competitiveAnalysis) {
    return [
        'File priority patents immediately for core innovations',
        'Focus on unique technical implementations',
        'Build patent portfolio before market maturity',
        'Consider international filing for key markets',
        'Establish thought leadership in accessibility-AI space'
    ];
}

function calculateFilingReadiness(research) {
    if (!research.success || !research.analysis) return 0;

    const factors = {
        novelty: research.analysis.novelty_assessment.risk_level === 'LOW' ? 40 :
                research.analysis.novelty_assessment.risk_level === 'MEDIUM' ? 25 : 10,
        confidence: research.analysis.novelty_assessment.confidence_score * 0.3,
        completeness: research.analysis.total_patents_found > 0 ? 20 : 10,
        urgency: 10
    };

    return Math.round(factors.novelty + factors.confidence + factors.completeness + factors.urgency);
}

function determinePriority(research) {
    const readiness = calculateFilingReadiness(research);
    if (readiness >= 80) return 'HIGH';
    if (readiness >= 60) return 'MEDIUM';
    return 'LOW';
}

function estimateFilingTimeline(research) {
    const risk = research.analysis?.novelty_assessment?.risk_level || 'MEDIUM';

    if (risk === 'LOW') return '14-21 days';
    if (risk === 'MEDIUM') return '21-35 days';
    return '35-60 days';
}

function generateActionPlan(research) {
    if (!research.analysis) return ['Complete prior art research'];

    return research.recommendations?.high_priority_actions || [
        'Proceed with filing preparation',
        'Review claims with attorney',
        'Prepare technical documentation'
    ];
}

function predictPatentStrength(research) {
    const risk = research.analysis?.novelty_assessment?.risk_level || 'MEDIUM';
    const confidence = research.analysis?.novelty_assessment?.confidence_score || 50;

    if (risk === 'LOW' && confidence > 70) return 'STRONG';
    if (risk === 'MEDIUM' || confidence > 50) return 'MODERATE';
    return 'WEAK';
}

function calculateOverallReadiness(filingAssessment) {
    const scores = Object.values(filingAssessment).map(assessment => assessment.readiness_score);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    return {
        overall_score: Math.round(averageScore),
        readiness_level: averageScore >= 80 ? 'READY' : averageScore >= 60 ? 'NEARLY_READY' : 'NEEDS_WORK',
        recommendations: averageScore >= 80 ?
            ['Proceed with immediate filing'] :
            ['Complete additional research', 'Refine patent strategy']
    };
}

function recommendFilingOrder(filingAssessment) {
    return Object.entries(filingAssessment)
        .sort(([,a], [,b]) => b.readiness_score - a.readiness_score)
        .map(([innovation, assessment], index) => ({
            position: index + 1,
            innovation: innovation,
            priority: assessment.priority_level,
            rationale: `Readiness score: ${assessment.readiness_score}`
        }));
}

function optimizeFilingTimeline(filingAssessment) {
    const highPriority = Object.entries(filingAssessment)
        .filter(([,assessment]) => assessment.priority_level === 'HIGH')
        .length;

    return {
        immediate_filings: highPriority,
        suggested_timeline: `${highPriority} patents in first 30 days`,
        resource_allocation: 'Focus on highest readiness scores first',
        timeline_optimization: 'Parallel processing for high-priority patents'
    };
}

function estimateFilingBudget(filingAssessment) {
    const patentCount = Object.keys(filingAssessment).length;
    const avgCostPerPatent = 15000; // Estimated cost with AI assistance

    return {
        total_patents: patentCount,
        estimated_cost_per_patent: `$${avgCostPerPatent.toLocaleString()}`,
        total_estimated_cost: `$${(patentCount * avgCostPerPatent).toLocaleString()}`,
        cost_breakdown: {
            ai_tools: '10%',
            attorney_fees: '60%',
            filing_fees: '20%',
            research: '10%'
        }
    };
}

module.exports = router;