/**
 * LinkedIn to Hacksaw Corpus Converter
 * Node.js prototype for genz-translator-api integration
 *
 * Converts LinkedIn work history into timeline.json format
 * with Hacksaw voice translation and cultural context inference
 */

const fs = require('fs');
const path = require('path');

class LinkedInCorpusConverter {
    constructor() {
        this.hacksawEmotionalStates = {
            startup: ["inventive", "defiant", "edge-focused", "scrappy"],
            enterprise: ["agile", "tactical", "insurgent", "pragmatic"],
            financial: ["focused", "resilient", "zero-trust", "sharp"],
            tech: ["curious", "rebellious", "velocity-driven", "fearless"],
            recovery: ["gritty", "determined", "phoenix-rising", "rebuilding"]
        };

        this.corporateToHacksaw = {
            "led cross-functional teams": "herded cats across silos",
            "implemented best practices": "built it right the first time",
            "drove digital transformation": "dragged legacy into the future",
            "optimized workflows": "killed the bureaucracy",
            "delivered scalable solutions": "built it to last and scale",
            "collaborated with stakeholders": "navigated the politics",
            "managed complex projects": "juggled chaos into order",
            "responsible for": "owned",
            "achieved results": "shipped it",
            "stakeholder management": "political navigation"
        };
    }

    /**
     * Extract work history from LinkedIn export JSON
     */
    extractLinkedInData(linkedInExport) {
        const positions = linkedInExport.positions || [];
        const timelineEntries = [];

        for (const position of positions) {
            const entry = this.convertPositionToTimeline(position);
            timelineEntries.push(entry);
        }

        return timelineEntries.sort((a, b) => (a.year || 0) - (b.year || 0));
    }

    /**
     * Convert single LinkedIn position to timeline entry
     */
    convertPositionToTimeline(position) {
        const company = position.companyName || '';
        const title = position.title || '';
        const description = position.description || '';
        const startDate = position.startDate || {};
        const endDate = position.endDate || null;

        // Parse dates
        const startYear = startDate.year || new Date().getFullYear();
        const endYear = endDate ? endDate.year : null;

        // Generate Hacksaw translations
        const hacksawProject = this.translateToHacksaw(description, title);
        const emotionalState = this.inferEmotionalState(company, title, startYear);
        const technologies = this.extractTechnologies(description);

        const timelineEntry = {
            year: startYear,
            year_end: endYear,
            location: `${company}, ${position.location || 'Remote'}`,
            company: company,
            role: title,
            project: hacksawProject,
            emotional_state: emotionalState,
            technologies: technologies,
            collaborators: this.extractCollaborators(description),
            media: this.inferCulturalContext(startYear),
            books: this.inferTechnicalBooks(technologies, startYear),
            class: "professional",
            linkedin_data: {
                duration: this.calculateDuration(startDate, endDate),
                description: description,
                skills: position.skills || [],
                recommendations: position.recommendations || 0
            }
        };

        return timelineEntry;
    }

    /**
     * Convert corporate speak to Hacksaw voice
     */
    translateToHacksaw(description, title) {
        if (!description) {
            return `${title} - (needs Hacksaw translation)`;
        }

        let hacksawDesc = description.toLowerCase();

        // Apply translations
        for (const [corporate, hacksaw] of Object.entries(this.corporateToHacksaw)) {
            hacksawDesc = hacksawDesc.replace(new RegExp(corporate, 'gi'), hacksaw);
        }

        // Add Hacksaw flavor
        if (hacksawDesc.includes('architecture')) {
            hacksawDesc += " - zero-trust by instinct";
        }
        if (hacksawDesc.includes('ci/cd') || hacksawDesc.includes('devops')) {
            hacksawDesc += " - CI/CD before it had a name";
        }
        if (hacksawDesc.includes('container')) {
            hacksawDesc += " - containers as cultural metaphor";
        }

        return hacksawDesc.substring(0, 200); // Keep it concise
    }

    /**
     * Infer Hacksaw's emotional state based on context
     */
    inferEmotionalState(company, title, year) {
        const companyLower = company.toLowerCase();
        const titleLower = title.toLowerCase();

        // Company type inference
        if (['startup', 'labs', 'innovation'].some(term => companyLower.includes(term))) {
            return this.randomChoice(this.hacksawEmotionalStates.startup);
        } else if (['bank', 'financial', 'capital', 'lehman'].some(term => companyLower.includes(term))) {
            return this.randomChoice(this.hacksawEmotionalStates.financial);
        } else if (['dell', 'microsoft', 'ibm', 'enterprise'].some(term => companyLower.includes(term))) {
            return this.randomChoice(this.hacksawEmotionalStates.enterprise);
        } else if (year >= 2020) { // Recent years - reflective period
            return "meta-aware, legacy-focused";
        } else {
            return this.randomChoice(this.hacksawEmotionalStates.tech);
        }
    }

    /**
     * Extract technologies from job description
     */
    extractTechnologies(description) {
        if (!description) return [];

        const techPatterns = [
            /\b(AWS|Azure|GCP|Docker|Kubernetes|Jenkins|Git|Python|Java|C#|\.NET|React|Angular|Vue)\b/gi,
            /\b(CI\/CD|DevOps|Terraform|Ansible|Puppet|Chef)\b/gi,
            /\b(SQL|NoSQL|MongoDB|PostgreSQL|MySQL|Redis)\b/gi
        ];

        const technologies = [];
        for (const pattern of techPatterns) {
            const matches = description.match(pattern) || [];
            technologies.push(...matches);
        }

        return [...new Set(technologies)];
    }

    /**
     * Extract collaborator hints from description
     */
    extractCollaborators(description) {
        // This would need LinkedIn connections data or manual input
        return ["TBD - needs manual entry"];
    }

    /**
     * Infer cultural media from time period
     */
    inferCulturalContext(year) {
        const culturalMap = {
            1990: ["License to Ill", "Scatterbrain"],
            2000: ["Security Fix – Brian Krebs", "The Matrix"],
            2010: ["Neuromancer", "Mr. Robot"],
            2020: ["Neuromancer", "GitPod culture"]
        };

        const decades = Object.keys(culturalMap).map(Number).sort((a, b) => b - a);
        for (const decade of decades) {
            if (year >= decade) {
                return culturalMap[decade];
            }
        }
        return [];
    }

    /**
     * Infer relevant technical books based on tech stack and era
     */
    inferTechnicalBooks(technologies, year) {
        const books = [];

        if (technologies.some(tech => ['Docker', 'Kubernetes', 'CI/CD'].includes(tech))) {
            books.push("The Phoenix Project");
        }
        if (technologies.some(tech => ['AWS', 'Azure', 'architecture'].includes(tech))) {
            books.push("Clean Architecture");
        }
        if (year >= 2015) {
            books.push("Accelerate");
        }

        return books;
    }

    /**
     * Calculate duration string
     */
    calculateDuration(startDate, endDate) {
        if (!startDate) return "Unknown duration";

        const startYear = startDate.year || 0;
        const startMonth = startDate.month || 1;

        let endYear, endMonth;
        if (endDate) {
            endYear = endDate.year || 0;
            endMonth = endDate.month || 12;
        } else {
            const now = new Date();
            endYear = now.getFullYear();
            endMonth = now.getMonth() + 1;
        }

        const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth);
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;

        if (years > 0 && months > 0) {
            return `${years} years ${months} months`;
        } else if (years > 0) {
            return `${years} years`;
        } else {
            return `${months} months`;
        }
    }

    /**
     * Simple random choice
     */
    randomChoice(choices) {
        return choices[Math.floor(Math.random() * choices.length)];
    }

    /**
     * Save entries to timeline.json format
     */
    saveToTimeline(timelineEntries, outputPath) {
        fs.writeFileSync(outputPath, JSON.stringify(timelineEntries, null, 2));
    }

    /**
     * Append new entries to existing timeline.json
     */
    appendToExistingTimeline(newEntries, timelinePath) {
        let existingTimeline = [];

        try {
            const data = fs.readFileSync(timelinePath, 'utf8');
            existingTimeline = JSON.parse(data);
        } catch (error) {
            console.log('No existing timeline found, creating new one');
        }

        // Remove template entry if it exists
        existingTimeline = existingTimeline.filter(entry => entry.year !== 'TEMPLATE');

        // Merge and sort
        const combinedTimeline = [...existingTimeline, ...newEntries];
        combinedTimeline.sort((a, b) => (a.year || 0) - (b.year || 0));

        fs.writeFileSync(timelinePath, JSON.stringify(combinedTimeline, null, 2));
    }
}

// Example usage and testing
if (require.main === module) {
    const converter = new LinkedInCorpusConverter();

    // Example LinkedIn export format
    const sampleLinkedInData = {
        positions: [
            {
                companyName: "Example Corp",
                title: "Senior Infrastructure Architect",
                description: "Led cross-functional teams to implement CI/CD pipelines using Docker and Kubernetes. Drove digital transformation initiatives and optimized workflows for scalable solutions.",
                startDate: { year: 2020, month: 1 },
                endDate: { year: 2023, month: 6 },
                location: "Remote",
                skills: ["AWS", "Kubernetes", "CI/CD"]
            },
            {
                companyName: "Tech Startup Inc",
                title: "DevOps Engineer",
                description: "Responsible for infrastructure automation and container orchestration. Managed complex projects involving microservices architecture.",
                startDate: { year: 2018, month: 3 },
                endDate: { year: 2020, month: 1 },
                location: "San Francisco, CA",
                skills: ["Docker", "Jenkins", "AWS"]
            }
        ]
    };

    console.log('Converting LinkedIn data to Hacksaw corpus format...\n');

    const timelineEntries = converter.extractLinkedInData(sampleLinkedInData);

    console.log('Generated timeline entries:');
    console.log(JSON.stringify(timelineEntries, null, 2));

    // Save to file
    const outputPath = path.join(__dirname, 'linkedin_timeline_output.json');
    converter.saveToTimeline(timelineEntries, outputPath);
    console.log(`\nSaved to: ${outputPath}`);

    // Append to existing timeline
    const existingTimelinePath = path.join(__dirname, 'notes', 'timeline.json');
    if (fs.existsSync(existingTimelinePath)) {
        console.log(`\nAppending to existing timeline: ${existingTimelinePath}`);
        converter.appendToExistingTimeline(timelineEntries, existingTimelinePath);
    }
}

module.exports = LinkedInCorpusConverter;