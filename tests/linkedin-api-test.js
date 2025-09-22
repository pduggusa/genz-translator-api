/**
 * Test harness to check genz-translator-api compatibility
 * Tests both approaches: new endpoint vs existing extraction
 */

const LinkedInCorpusConverter = require('./linkedin-converter');
const express = require('express');

// Approach 1: Standalone API endpoint (if you want to add to genz-translator-api)
function createLinkedInEndpoint() {
    return (req, res) => {
        try {
            const linkedInData = req.body;
            const converter = new LinkedInCorpusConverter();

            // Convert LinkedIn export to Hacksaw timeline
            const timelineEntries = converter.extractLinkedInData(linkedInData);

            res.json({
                success: true,
                data: timelineEntries,
                metadata: {
                    converter: "hacksaw-linkedin-corpus",
                    entries_generated: timelineEntries.length,
                    format: "hacksaw_timeline_v1"
                }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    };
}

// Approach 2: Adapter for existing genz-translator-api /extract endpoint
function createExtractionAdapter() {
    return (req, res) => {
        // This would be the format your existing API expects
        const extractionRequest = {
            url: "linkedin://profile/export", // Mock URL
            extractionType: "structured",
            data: req.body, // LinkedIn export data
            options: {
                translator: "hacksaw-linkedin",
                outputFormat: "timeline"
            }
        };

        try {
            const converter = new LinkedInCorpusConverter();
            const timelineEntries = converter.extractLinkedInData(req.body);

            // Format response to match your existing API structure
            res.json({
                url: extractionRequest.url,
                extractionType: "structured",
                data: timelineEntries,
                processedAt: new Date().toISOString(),
                translator: "hacksaw-linkedin-corpus"
            });
        } catch (error) {
            res.status(500).json({
                error: "Extraction failed",
                details: error.message
            });
        }
    };
}

// Test server to demonstrate both approaches
function startTestServer() {
    const app = express();
    app.use(express.json());

    // Approach 1: New dedicated endpoint
    app.post('/translate/linkedin', createLinkedInEndpoint());

    // Approach 2: Adapter for existing /extract pattern
    app.post('/extract/linkedin', createExtractionAdapter());

    // Health check
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', converters: ['hacksaw-linkedin-corpus'] });
    });

    const port = 3001;
    app.listen(port, () => {
        console.log(`🧪 LinkedIn API Test Harness running on port ${port}`);
        console.log('');
        console.log('Available endpoints:');
        console.log('  POST /translate/linkedin - Direct LinkedIn translation');
        console.log('  POST /extract/linkedin  - Existing API pattern adapter');
        console.log('  GET  /health           - Health check');
        console.log('');
        console.log('Test with sample LinkedIn data...');
    });

    return app;
}

// Sample test data generator
function generateTestData() {
    return {
        positions: [
            {
                companyName: "Your Company Here",
                title: "Your Title Here",
                description: "Copy your LinkedIn job description here. Led cross-functional teams to implement best practices and drive digital transformation.",
                startDate: { year: 2020, month: 1 },
                endDate: { year: 2023, month: 6 },
                location: "Your Location",
                skills: ["List", "Your", "Skills", "Here"]
            }
        ]
    };
}

// CLI usage examples
function printUsageExamples() {
    console.log('📋 Usage Examples:');
    console.log('');
    console.log('# Test Approach 1 (new endpoint):');
    console.log('curl -X POST http://localhost:3001/translate/linkedin \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"positions":[...your LinkedIn data...]}\'');
    console.log('');
    console.log('# Test Approach 2 (existing pattern):');
    console.log('curl -X POST http://localhost:3001/extract/linkedin \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"positions":[...your LinkedIn data...]}\'');
    console.log('');
    console.log('Sample test data:');
    console.log(JSON.stringify(generateTestData(), null, 2));
}

// Integration assessment
function assessIntegration() {
    console.log('🔍 Integration Assessment for genz-translator-api:');
    console.log('');
    console.log('✅ ZERO CODE CHANGE OPTION:');
    console.log('   - Add new route handler');
    console.log('   - Reuse existing response format');
    console.log('   - Drop in linkedin-converter.js module');
    console.log('');
    console.log('✅ MINIMAL CODE CHANGE OPTION:');
    console.log('   - Extend existing /extract endpoint');
    console.log('   - Add "linkedin" extraction type');
    console.log('   - Leverage existing pipeline');
    console.log('');
    console.log('🎯 RECOMMENDATION: Zero code change approach');
    console.log('   Just add the new endpoint and module!');
}

// Main execution
if (require.main === module) {
    assessIntegration();
    console.log('');
    printUsageExamples();
    console.log('');
    console.log('🚀 Starting test harness...');
    startTestServer();
}

module.exports = {
    createLinkedInEndpoint,
    createExtractionAdapter,
    generateTestData,
    startTestServer
};