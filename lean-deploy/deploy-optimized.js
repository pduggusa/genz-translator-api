const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')

const app = express()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}))

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://your-domain.com'] : true,
  credentials: true
}))

app.use(compression())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
})
app.use(limiter)

app.use(express.json({ limit: '10mb' }))

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  })
})

// Lazy-load heavy dependencies only when needed
let playwright = null
let cheerio = null
let readability = null

const loadBrowserDependencies = async () => {
  if (!playwright) {
    playwright = await import('playwright')
    cheerio = await import('cheerio')
    readability = await import('@mozilla/readability')
  }
  return { playwright, cheerio, readability }
}

// Cannabis extraction endpoint
app.post('/extract', async (req, res) => {
  try {
    const { url } = req.body

    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }

    // Load heavy dependencies only when needed
    const { playwright, cheerio } = await loadBrowserDependencies()

    // Simple axios fetch for basic extraction (faster)
    const axios = require('axios')

    try {
      // Try simple fetch first (much faster)
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      const $ = cheerio.load(response.data)

      // Quick cannabis pattern detection
      const cannabisKeywords = ['cannabis', 'marijuana', 'cbd', 'thc', 'hemp', 'weed', 'dispensary']
      let count = 0

      $('*').each((i, element) => {
        const text = $(element).text().toLowerCase()
        cannabisKeywords.forEach(keyword => {
          const matches = (text.match(new RegExp(keyword, 'g')) || []).length
          count += matches
        })
      })

      return res.json({
        url,
        count,
        method: 'fast-extraction',
        timestamp: new Date().toISOString()
      })

    } catch (axiosError) {
      // Fallback to browser if simple fetch fails
      const browser = await playwright.chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })

      const page = await browser.newPage()
      await page.goto(url, { waitUntil: 'networkidle' })
      const content = await page.content()
      await browser.close()

      const $ = cheerio.load(content)
      const cannabisKeywords = ['cannabis', 'marijuana', 'cbd', 'thc', 'hemp', 'weed', 'dispensary']
      let count = 0

      $('*').each((i, element) => {
        const text = $(element).text().toLowerCase()
        cannabisKeywords.forEach(keyword => {
          const matches = (text.match(new RegExp(keyword, 'g')) || []).length
          count += matches
        })
      })

      return res.json({
        url,
        count,
        method: 'browser-extraction',
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Extraction error:', error)
    res.status(500).json({
      error: 'Extraction failed',
      message: error.message
    })
  }
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Cannabis Extractor API running on port ${PORT}`)
  console.log(`🛡️ Security: Helmet, CORS, Rate limiting enabled`)
  console.log(`⚡ Optimization: Lazy loading, compression enabled`)
})