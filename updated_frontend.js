// Replace the fetchUrlContent function in your index.html with this updated version:

async function fetchUrlContent(url) {
    // Your Azure Web App backend
    const BACKEND_URL = 'https://genz-translator-api.azurewebsites.net/api/fetch-url';
    
    try {
        const response = await fetch(`${BACKEND_URL}?url=${encodeURIComponent(url)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch content');
        }
        
        // Return both title and body from the enhanced backend
        return {
            title: data.title || 'No title found',
            body: data.body,
            url: data.url,
            metadata: data.metadata
        };
        
    } catch (error) {
        console.error('Backend fetch failed:', error.message);
        
        // Provide helpful error messages
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('Cannot connect to backend service. Please check your internet connection.');
        } else if (error.message.includes('timeout') || error.message.includes('408')) {
            throw new Error('The website took too long to respond. Please try a different URL.');
        } else if (error.message.includes('404')) {
            throw new Error('The requested page was not found.');
        } else if (error.message.includes('403') || error.message.includes('401')) {
            throw new Error('Access denied to the website. The site may block automated requests.');
        }
        
        throw new Error(`Failed to fetch content: ${error.message}`);
    }
}

// Replace the handleUrlTranslate function with this updated version:

async function handleUrlTranslate() {
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();
    
    if (!url) {
        showError('Please enter a URL');
        return;
    }

    // Basic URL validation
    try {
        const parsedUrl = new URL(url);
        sourceUrl.current = parsedUrl.hostname;
    } catch {
        showError('Please enter a valid URL (e.g., https://example.com)');
        return;
    }

    setUrlLoading(true);
    hideError();
    hideResults();

    try {
        showError('Fetching content... This may take a moment depending on the website.');
        
        const urlContent = await fetchUrlContent(url);
        
        // Combine title and body for display and translation
        const fullContent = `${urlContent.title}\n\n${urlContent.body}`;
        const translated = translateToGenY(fullContent);
        
        // Display the original content (title + body)
        document.getElementById('originalText').textContent = fullContent;
        document.getElementById('translatedText').textContent = translated;
        
        // Show URL badge with metadata if available
        document.getElementById('sourceDomain').textContent = sourceUrl.current;
        if (urlContent.metadata?.bodyTruncated) {
            document.getElementById('sourceDomain').textContent += ' (truncated)';
        }
        document.getElementById('urlBadge').classList.remove('hidden');
        
        showResults();
        hideSample();
        hideError();
        
        // Optional: Log metadata for debugging
        console.log('Content metadata:', urlContent.metadata);
        
    } catch (err) {
        showError(`Error: ${err.message}`);
        console.error('Translation error:', err);
    } finally {
        setUrlLoading(false);
    }
}