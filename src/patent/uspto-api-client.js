// USPTO Open Data Portal API Client
// Automated patent research and prior art analysis

const axios = require('axios');

class USPTOApiClient {
    constructor() {
        this.baseUrl = 'https://developer.uspto.gov/api-catalog';
        this.odpBaseUrl = 'https://data.uspto.gov/apis';
        this.patentSearchUrl = `${this.odpBaseUrl}/patent-file-wrapper/search`;
        this.patentDataUrl = `${this.odpBaseUrl}/patent-examination-data`;

        // Initialize with default headers
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'AI-Evaluation-Accessibility-Platform/3.0.0'
        };
    }

    /**
     * Search for patents using USPTO ODP API
     * @param {Object} searchParams - Search parameters
     * @returns {Promise<Object>} Search results
     */
    async searchPatents(searchParams = {}) {
        try {
            const {
                query,
                classification,
                inventor,
                assignee,
                dateRange,
                patentType = 'utility',
                status = 'published',
                limit = 50,
                offset = 0
            } = searchParams;

            // Build search query
            const searchQuery = {
                q: query,
                classification_cpc: classification,
                inventor_name: inventor,
                assignee_name: assignee,
                patent_type: patentType,
                status: status,
                limit: limit,
                offset: offset
            };

            // Add date range if specified
            if (dateRange) {
                searchQuery.date_published_start = dateRange.start;
                searchQuery.date_published_end = dateRange.end;
            }

            console.log(`🔍 Searching patents with query: ${query}`);

            const response = await axios.get(this.patentSearchUrl, {
                headers: this.headers,
                params: searchQuery,
                timeout: 30000
            });

            return {
                success: true,
                total_results: response.data.total_count || 0,
                results: response.data.patents || response.data.results || [],
                query_performed: searchQuery,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Patent search error:', error.message);
            return {
                success: false,
                error: error.message,
                query_performed: searchParams,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get detailed patent information
     * @param {string} patentNumber - Patent number or application number
     * @returns {Promise<Object>} Patent details
     */
    async getPatentDetails(patentNumber) {
        try {
            console.log(`📄 Retrieving patent details for: ${patentNumber}`);

            const response = await axios.get(`${this.patentDataUrl}/${patentNumber}`, {
                headers: this.headers,
                timeout: 15000
            });

            return {
                success: true,
                patent: response.data,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`Patent details error for ${patentNumber}:`, error.message);
            return {
                success: false,
                error: error.message,
                patent_number: patentNumber,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Automated prior art research for our innovations
     * @param {string} innovationTitle - Title of our innovation
     * @param {Array} keywords - Related keywords
     * @param {Array} classifications - CPC classifications
     * @returns {Promise<Object>} Prior art analysis
     */
    async conductPriorArtResearch(innovationTitle, keywords = [], classifications = []) {
        try {
            console.log(`🔬 Conducting prior art research for: ${innovationTitle}`);

            const searchResults = [];

            // Search by innovation keywords
            for (const keyword of keywords) {
                const keywordSearch = await this.searchPatents({
                    query: keyword,
                    classification: classifications.join(' OR '),
                    limit: 20
                });

                if (keywordSearch.success) {
                    searchResults.push({
                        search_type: 'keyword',
                        keyword: keyword,
                        results: keywordSearch.results
                    });
                }
            }

            // Search by CPC classifications
            for (const classification of classifications) {
                const classificationSearch = await this.searchPatents({
                    classification: classification,
                    limit: 15
                });

                if (classificationSearch.success) {
                    searchResults.push({
                        search_type: 'classification',
                        classification: classification,
                        results: classificationSearch.results
                    });
                }
            }

            // Analyze results for novelty assessment
            const analysis = this.analyzePriorArt(searchResults, innovationTitle, keywords);

            return {
                success: true,
                innovation_title: innovationTitle,
                search_results: searchResults,
                analysis: analysis,
                recommendations: this.generateNoveltyRecommendations(analysis),
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Prior art research error:', error.message);
            return {
                success: false,
                error: error.message,
                innovation_title: innovationTitle,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Analyze prior art results for novelty assessment
     * @param {Array} searchResults - Search results from multiple queries
     * @param {string} innovationTitle - Our innovation title
     * @param {Array} keywords - Innovation keywords
     * @returns {Object} Analysis results
     */
    analyzePriorArt(searchResults, innovationTitle, keywords) {
        const allPatents = [];
        const keywordMatches = {};

        // Flatten all search results
        searchResults.forEach(searchResult => {
            if (searchResult.results && Array.isArray(searchResult.results)) {
                allPatents.push(...searchResult.results);
            }
        });

        // Remove duplicates based on patent number
        const uniquePatents = allPatents.filter((patent, index, self) =>
            index === self.findIndex(p =>
                (p.patent_number === patent.patent_number) ||
                (p.application_number === patent.application_number)
            )
        );

        // Analyze keyword overlap
        keywords.forEach(keyword => {
            keywordMatches[keyword] = uniquePatents.filter(patent =>
                this.patentContainsKeyword(patent, keyword)
            ).length;
        });

        // Assess novelty risk
        const noveltyAssessment = this.assessNoveltyRisk(uniquePatents, keywords);

        return {
            total_patents_found: uniquePatents.length,
            unique_patents: uniquePatents.length,
            keyword_matches: keywordMatches,
            novelty_assessment: noveltyAssessment,
            high_risk_patents: this.identifyHighRiskPatents(uniquePatents, keywords),
            recommended_actions: this.generateActionItems(noveltyAssessment)
        };
    }

    /**
     * Check if patent contains specific keyword
     * @param {Object} patent - Patent object
     * @param {string} keyword - Keyword to search for
     * @returns {boolean} Whether patent contains keyword
     */
    patentContainsKeyword(patent, keyword) {
        const searchFields = [
            patent.title,
            patent.abstract,
            patent.description,
            patent.claims
        ].filter(Boolean).join(' ').toLowerCase();

        return searchFields.includes(keyword.toLowerCase());
    }

    /**
     * Assess novelty risk based on prior art
     * @param {Array} patents - Found patents
     * @param {Array} keywords - Innovation keywords
     * @returns {Object} Novelty risk assessment
     */
    assessNoveltyRisk(patents, keywords) {
        const recentPatents = patents.filter(patent => {
            const publishDate = new Date(patent.date_published || patent.publication_date);
            const cutoffDate = new Date();
            cutoffDate.setFullYear(cutoffDate.getFullYear() - 5); // Last 5 years
            return publishDate > cutoffDate;
        });

        const keywordOverlap = keywords.filter(keyword =>
            patents.some(patent => this.patentContainsKeyword(patent, keyword))
        ).length;

        const overlapPercentage = (keywordOverlap / keywords.length) * 100;

        let riskLevel = 'LOW';
        if (overlapPercentage > 70) riskLevel = 'HIGH';
        else if (overlapPercentage > 40) riskLevel = 'MEDIUM';

        return {
            risk_level: riskLevel,
            overlap_percentage: overlapPercentage,
            recent_patents_count: recentPatents.length,
            total_patents_count: patents.length,
            confidence_score: this.calculateConfidenceScore(patents, keywords)
        };
    }

    /**
     * Identify high-risk patents that may impact our filing
     * @param {Array} patents - Found patents
     * @param {Array} keywords - Innovation keywords
     * @returns {Array} High-risk patents
     */
    identifyHighRiskPatents(patents, keywords) {
        return patents.filter(patent => {
            const matchingKeywords = keywords.filter(keyword =>
                this.patentContainsKeyword(patent, keyword)
            );

            // High risk if matches multiple keywords and is recent
            const publishDate = new Date(patent.date_published || patent.publication_date);
            const isRecent = (Date.now() - publishDate.getTime()) < (3 * 365 * 24 * 60 * 60 * 1000); // 3 years

            return matchingKeywords.length >= 2 && isRecent;
        }).map(patent => ({
            ...patent,
            risk_factors: this.identifyRiskFactors(patent, keywords)
        }));
    }

    /**
     * Calculate confidence score for novelty assessment
     * @param {Array} patents - Found patents
     * @param {Array} keywords - Innovation keywords
     * @returns {number} Confidence score (0-100)
     */
    calculateConfidenceScore(patents, keywords) {
        const factors = {
            search_comprehensiveness: Math.min(100, (patents.length / 50) * 100),
            keyword_coverage: (keywords.length / 10) * 100, // Assuming 10 is comprehensive
            data_recency: patents.filter(p => {
                const date = new Date(p.date_published || p.publication_date);
                return (Date.now() - date.getTime()) < (2 * 365 * 24 * 60 * 60 * 1000);
            }).length / patents.length * 100
        };

        return Math.round(
            (factors.search_comprehensiveness * 0.4 +
             factors.keyword_coverage * 0.3 +
             factors.data_recency * 0.3)
        );
    }

    /**
     * Generate novelty recommendations based on analysis
     * @param {Object} analysis - Prior art analysis
     * @returns {Object} Recommendations
     */
    generateNoveltyRecommendations(analysis) {
        const recommendations = {
            filing_strategy: 'PROCEED',
            modifications_needed: [],
            additional_research: [],
            timeline_impact: 'NONE'
        };

        if (analysis.novelty_assessment.risk_level === 'HIGH') {
            recommendations.filing_strategy = 'MODIFY_CLAIMS';
            recommendations.modifications_needed.push(
                'Narrow claims to focus on unique aspects',
                'Emphasize technical advantages over prior art',
                'Add specific implementation details'
            );
            recommendations.timeline_impact = 'MODERATE';
        } else if (analysis.novelty_assessment.risk_level === 'MEDIUM') {
            recommendations.filing_strategy = 'PROCEED_WITH_CAUTION';
            recommendations.modifications_needed.push(
                'Highlight unique technical features',
                'Include specific use case examples'
            );
            recommendations.timeline_impact = 'MINIMAL';
        }

        if (analysis.novelty_assessment.confidence_score < 70) {
            recommendations.additional_research.push(
                'Expand keyword search terms',
                'Review international patent databases',
                'Conduct professional prior art search'
            );
        }

        return recommendations;
    }

    /**
     * Generate action items based on novelty assessment
     * @param {Object} noveltyAssessment - Novelty assessment results
     * @returns {Array} Action items
     */
    generateActionItems(noveltyAssessment) {
        const actions = [];

        if (noveltyAssessment.risk_level === 'HIGH') {
            actions.push(
                'Schedule immediate attorney consultation',
                'Revise patent claims to emphasize unique aspects',
                'Conduct additional prior art search',
                'Consider filing continuation-in-part application'
            );
        } else if (noveltyAssessment.risk_level === 'MEDIUM') {
            actions.push(
                'Review claims with patent attorney',
                'Add technical implementation details',
                'Document unique advantages over prior art'
            );
        } else {
            actions.push(
                'Proceed with filing as planned',
                'Document technical advantages',
                'Prepare for potential office actions'
            );
        }

        return actions;
    }

    /**
     * Identify specific risk factors for a patent
     * @param {Object} patent - Patent object
     * @param {Array} keywords - Innovation keywords
     * @returns {Array} Risk factors
     */
    identifyRiskFactors(patent, keywords) {
        const risks = [];

        if (patent.status === 'granted') {
            risks.push('Active granted patent');
        }

        const matchingKeywords = keywords.filter(keyword =>
            this.patentContainsKeyword(patent, keyword)
        );

        if (matchingKeywords.length > 2) {
            risks.push(`High keyword overlap (${matchingKeywords.length} matches)`);
        }

        const publishDate = new Date(patent.date_published || patent.publication_date);
        if ((Date.now() - publishDate.getTime()) < (1 * 365 * 24 * 60 * 60 * 1000)) {
            risks.push('Very recent publication');
        }

        return risks;
    }

    /**
     * Research specific innovation areas for our platform
     * @returns {Promise<Object>} Research results for all our innovations
     */
    async researchPlatformInnovations() {
        console.log('🚀 Starting comprehensive patent research for platform innovations...');

        const innovations = [
            {
                title: 'Dynamic Accessibility Adaptation Engine',
                keywords: [
                    'accessibility adaptation',
                    'dynamic content modification',
                    'WCAG automation',
                    'adaptive web content',
                    'accessibility intelligence',
                    'real-time compliance'
                ],
                classifications: ['G06F40/00', 'G06F3/01', 'G06F40/20']
            },
            {
                title: 'AI Agent Repository Environment Automation',
                keywords: [
                    'repository automation',
                    'environment setup',
                    'AI agent deployment',
                    'dependency resolution',
                    'code repository analysis',
                    'automated configuration'
                ],
                classifications: ['G06F8/71', 'G06F9/455', 'G06F8/61']
            },
            {
                title: 'AI-Powered Developer Accessibility Scoring',
                keywords: [
                    'developer assessment',
                    'accessibility scoring',
                    'code quality evaluation',
                    'recruitment automation',
                    'skill assessment',
                    'GitHub analysis'
                ],
                classifications: ['G06F40/30', 'G06Q10/00', 'G06F8/70']
            }
        ];

        const results = {};

        for (const innovation of innovations) {
            console.log(`📋 Researching: ${innovation.title}`);
            results[innovation.title] = await this.conductPriorArtResearch(
                innovation.title,
                innovation.keywords,
                innovation.classifications
            );

            // Add small delay to be respectful to the API
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return {
            success: true,
            platform_research: results,
            summary: this.generateResearchSummary(results),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate summary of platform research
     * @param {Object} results - Research results for all innovations
     * @returns {Object} Research summary
     */
    generateResearchSummary(results) {
        const summary = {
            total_innovations_researched: Object.keys(results).length,
            overall_novelty_assessment: 'PENDING',
            high_priority_actions: [],
            filing_timeline_impact: 'NONE',
            estimated_patent_strength: 'STRONG'
        };

        let highRiskCount = 0;
        let mediumRiskCount = 0;

        Object.values(results).forEach(result => {
            if (result.success && result.analysis) {
                const risk = result.analysis.novelty_assessment.risk_level;
                if (risk === 'HIGH') highRiskCount++;
                else if (risk === 'MEDIUM') mediumRiskCount++;
            }
        });

        if (highRiskCount > 0) {
            summary.overall_novelty_assessment = 'MEDIUM_RISK';
            summary.filing_timeline_impact = 'MODERATE';
            summary.high_priority_actions.push('Attorney consultation required for high-risk innovations');
        } else if (mediumRiskCount > 0) {
            summary.overall_novelty_assessment = 'LOW_RISK';
            summary.filing_timeline_impact = 'MINIMAL';
            summary.high_priority_actions.push('Claims review recommended for medium-risk innovations');
        } else {
            summary.overall_novelty_assessment = 'CLEAR_TO_PROCEED';
            summary.high_priority_actions.push('Proceed with filing as planned');
        }

        return summary;
    }
}

module.exports = { USPTOApiClient };