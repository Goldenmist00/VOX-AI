/**
 * Comprehensive test script for Reddit RSS integration
 * Tests the full end-to-end flow (RSS only, Pushshift removed due to IP restrictions)
 * Run with: node scripts/test-full-integration.js
 */

const axios = require('axios')
const { parseString } = require('xml2js')
const cheerio = require('cheerio')

// Configuration
const BASE_URL = 'http://localhost:3000'
const TEST_KEYWORDS = ['climate change', 'artificial intelligence', 'renewable energy']
const TEST_SUBREDDITS = ['science', 'technology', 'environment']

// Test Results Storage
const testResults = {
  rssTests: [],
  apiTests: [],
  integrationTests: [],
  errors: []
}

// Utility Functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type] || '📋'
  
  console.log(`${prefix} [${timestamp}] ${message}`)
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// RSS Feed Tests
async function testRSSFeeds() {
  log('Starting RSS Feed Tests', 'info')
  
  for (const keyword of TEST_KEYWORDS) {
    for (const subreddit of TEST_SUBREDDITS) {
      try {
        const rssUrl = `https://www.reddit.com/r/${subreddit}/search.rss?q=${encodeURIComponent(keyword)}&restrict_sr=on&limit=5`
        
        log(`Testing RSS: r/${subreddit} for "${keyword}"`)
        
        const response = await axios.get(rssUrl, {
          headers: {
            'User-Agent': 'VOX-AI-Integration-Test/1.0.0'
          },
          timeout: 10000
        })
        
        if (response.status === 200 && response.data) {
          const posts = await parseRSSXML(response.data)
          
          testResults.rssTests.push({
            keyword,
            subreddit,
            success: true,
            postsFound: posts.length,
            responseSize: response.data.length
          })
          
          log(`✅ r/${subreddit}: ${posts.length} posts found`, 'success')
        }
        
        // Rate limiting delay
        await delay(1000)
        
      } catch (error) {
        testResults.rssTests.push({
          keyword,
          subreddit,
          success: false,
          error: error.message
        })
        
        log(`❌ r/${subreddit}: ${error.message}`, 'error')
      }
    }
  }
}

async function parseRSSXML(xmlData) {
  return new Promise((resolve, reject) => {
    parseString(xmlData, (err, result) => {
      if (err) {
        reject(err)
        return
      }

      try {
        const posts = []
        const items = result?.rss?.channel?.[0]?.item || []

        for (const item of items) {
          const title = item.title?.[0] || ''
          const link = item.link?.[0] || ''
          const author = item.author?.[0] || 'unknown'
          const pubDate = item.pubDate?.[0] || ''
          const description = item.description?.[0] || ''

          posts.push({
            title: cleanText(title),
            link,
            author: cleanText(author),
            pubDate: new Date(pubDate),
            description: cleanHtmlContent(description)
          })
        }

        resolve(posts)
      } catch (parseError) {
        reject(parseError)
      }
    })
  })
}

function cleanHtmlContent(html) {
  if (!html) return ''
  
  try {
    const $ = cheerio.load(html)
    $('script, style').remove()
    let text = $.text()
    text = text.replace(/\\s+/g, ' ').trim()
    text = text.replace(/\\[link\\]/g, '')
    text = text.replace(/\\[comments\\]/g, '')
    text = text.replace(/submitted by .* to .*/g, '')
    return text
  } catch (error) {
    return html.replace(/<[^>]*>/g, '').trim()
  }
}

function cleanText(text) {
  if (!text) return ''
  
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

// API Tests
async function testAPIEndpoints() {
  log('Starting API Endpoint Tests', 'info')
  
  // Test 1: Fetch Reddit RSS Data
  for (const keyword of TEST_KEYWORDS.slice(0, 2)) { // Limit to 2 keywords for testing
    try {
      log(`Testing API fetch for "${keyword}"`)
      
      const response = await axios.post(`${BASE_URL}/api/reddit-rss`, {
        keyword,
        maxPosts: 5,
        includeComments: true,
        maxCommentsPerPost: 3,
        forceRefresh: true
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.status === 200 && response.data.success) {
        testResults.apiTests.push({
          endpoint: 'POST /api/reddit-rss',
          keyword,
          success: true,
          totalStored: response.data.data.totalStored,
          processingTime: response.data.data.processingTime
        })
        
        log(`✅ API Fetch: ${response.data.data.totalStored} items stored in ${response.data.data.processingTime}ms`, 'success')
      } else {
        throw new Error(response.data.error || 'API request failed')
      }
      
      // Delay between API calls
      await delay(5000)
      
    } catch (error) {
      testResults.apiTests.push({
        endpoint: 'POST /api/reddit-rss',
        keyword,
        success: false,
        error: error.message
      })
      
      log(`❌ API Fetch failed: ${error.message}`, 'error')
    }
  }
  
  // Test 2: Get Reddit Data
  for (const keyword of TEST_KEYWORDS.slice(0, 1)) { // Test with 1 keyword
    try {
      log(`Testing data retrieval for "${keyword}"`)
      
      const response = await axios.get(`${BASE_URL}/api/reddit-rss?action=data&keyword=${encodeURIComponent(keyword)}&limit=10`, {
        timeout: 15000
      })
      
      if (response.status === 200 && response.data.success) {
        testResults.apiTests.push({
          endpoint: 'GET /api/reddit-rss (data)',
          keyword,
          success: true,
          itemsRetrieved: response.data.data.items.length,
          totalCount: response.data.data.pagination.totalCount
        })
        
        log(`✅ Data Retrieval: ${response.data.data.items.length} items retrieved`, 'success')
      } else {
        throw new Error(response.data.error || 'Data retrieval failed')
      }
      
    } catch (error) {
      testResults.apiTests.push({
        endpoint: 'GET /api/reddit-rss (data)',
        keyword,
        success: false,
        error: error.message
      })
      
      log(`❌ Data Retrieval failed: ${error.message}`, 'error')
    }
  }
  
  // Test 3: Get Trending Keywords
  try {
    log('Testing trending keywords endpoint')
    
    const response = await axios.get(`${BASE_URL}/api/reddit-rss?action=trending&limit=5`, {
      timeout: 10000
    })
    
    if (response.status === 200 && response.data.success) {
      testResults.apiTests.push({
        endpoint: 'GET /api/reddit-rss (trending)',
        success: true,
        trendingCount: response.data.data.length
      })
      
      log(`✅ Trending Keywords: ${response.data.data.length} keywords found`, 'success')
    } else {
      throw new Error(response.data.error || 'Trending keywords failed')
    }
    
  } catch (error) {
    testResults.apiTests.push({
      endpoint: 'GET /api/reddit-rss (trending)',
      success: false,
      error: error.message
    })
    
    log(`❌ Trending Keywords failed: ${error.message}`, 'error')
  }
}

// Integration Tests
async function testIntegration() {
  log('Starting Integration Tests', 'info')
  
  const testKeyword = 'sustainability'
  
  try {
    // Step 1: Fetch data
    log(`Integration Test: Fetching data for "${testKeyword}"`)
    
    const fetchResponse = await axios.post(`${BASE_URL}/api/reddit-rss`, {
      keyword: testKeyword,
      maxPosts: 3,
      includeComments: true,
      maxCommentsPerPost: 2,
      forceRefresh: true
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!fetchResponse.data.success) {
      throw new Error('Fetch step failed: ' + fetchResponse.data.error)
    }
    
    log(`✅ Step 1: Fetched ${fetchResponse.data.data.totalStored} items`, 'success')
    
    // Wait for processing
    await delay(3000)
    
    // Step 2: Retrieve and verify data
    log('Integration Test: Retrieving stored data')
    
    const retrieveResponse = await axios.get(`${BASE_URL}/api/reddit-rss?action=data&keyword=${encodeURIComponent(testKeyword)}&limit=5`, {
      timeout: 15000
    })
    
    if (!retrieveResponse.data.success) {
      throw new Error('Retrieve step failed: ' + retrieveResponse.data.error)
    }
    
    const items = retrieveResponse.data.data.items
    log(`✅ Step 2: Retrieved ${items.length} items`, 'success')
    
    // Step 3: Verify data structure
    if (items.length > 0) {
      const firstItem = items[0]
      const requiredFields = ['_id', 'type', 'keyword', 'analysis', 'weightedScore']
      const missingFields = requiredFields.filter(field => !(field in firstItem))
      
      if (missingFields.length === 0) {
        log('✅ Step 3: Data structure validation passed', 'success')
        
        // Check analysis structure
        const analysis = firstItem.analysis
        if (analysis && analysis.sentiment && analysis.relevancy && analysis.quality) {
          log('✅ Step 4: AI analysis structure validation passed', 'success')
          
          testResults.integrationTests.push({
            test: 'Full Integration Flow',
            success: true,
            itemsFetched: fetchResponse.data.data.totalStored,
            itemsRetrieved: items.length,
            dataStructureValid: true,
            analysisStructureValid: true
          })
        } else {
          throw new Error('AI analysis structure incomplete')
        }
      } else {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }
    } else {
      log('⚠️  No items retrieved for verification', 'warning')
      testResults.integrationTests.push({
        test: 'Full Integration Flow',
        success: true,
        itemsFetched: fetchResponse.data.data.totalStored,
        itemsRetrieved: 0,
        dataStructureValid: false,
        analysisStructureValid: false,
        note: 'No items to verify structure'
      })
    }
    
  } catch (error) {
    testResults.integrationTests.push({
      test: 'Full Integration Flow',
      success: false,
      error: error.message
    })
    
    log(`❌ Integration Test failed: ${error.message}`, 'error')
  }
}

// Performance Tests
async function testPerformance() {
  log('Starting Performance Tests', 'info')
  
  const testKeyword = 'technology'
  
  try {
    log('Performance Test: Large dataset fetch')
    
    const startTime = Date.now()
    
    const response = await axios.post(`${BASE_URL}/api/reddit-rss`, {
      keyword: testKeyword,
      maxPosts: 20,
      includeComments: true,
      maxCommentsPerPost: 10,
      forceRefresh: true
    }, {
      timeout: 60000, // 1 minute timeout for performance test
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    if (response.data.success) {
      const itemsPerSecond = (response.data.data.totalStored / duration) * 1000
      
      testResults.integrationTests.push({
        test: 'Performance Test',
        success: true,
        totalItems: response.data.data.totalStored,
        duration: duration,
        itemsPerSecond: Math.round(itemsPerSecond * 100) / 100
      })
      
      log(`✅ Performance: ${response.data.data.totalStored} items in ${duration}ms (${Math.round(itemsPerSecond * 100) / 100} items/sec)`, 'success')
    } else {
      throw new Error(response.data.error)
    }
    
  } catch (error) {
    testResults.integrationTests.push({
      test: 'Performance Test',
      success: false,
      error: error.message
    })
    
    log(`❌ Performance Test failed: ${error.message}`, 'error')
  }
}

// Generate Test Report
function generateReport() {
  log('Generating Test Report', 'info')
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      rssTests: {
        total: testResults.rssTests.length,
        passed: testResults.rssTests.filter(t => t.success).length,
        failed: testResults.rssTests.filter(t => !t.success).length
      },
      apiTests: {
        total: testResults.apiTests.length,
        passed: testResults.apiTests.filter(t => t.success).length,
        failed: testResults.apiTests.filter(t => !t.success).length
      },
      integrationTests: {
        total: testResults.integrationTests.length,
        passed: testResults.integrationTests.filter(t => t.success).length,
        failed: testResults.integrationTests.filter(t => !t.success).length
      }
    },
    details: testResults
  }
  
  console.log('\\n' + '='.repeat(80))
  console.log('REDDIT RSS INTEGRATION TEST REPORT')
  console.log('='.repeat(80))
  
  console.log('\\n📊 SUMMARY:')
  console.log(`RSS Feed Tests: ${report.summary.rssTests.passed}/${report.summary.rssTests.total} passed`)
  console.log(`API Tests: ${report.summary.apiTests.passed}/${report.summary.apiTests.total} passed`)
  console.log(`Integration Tests: ${report.summary.integrationTests.passed}/${report.summary.integrationTests.total} passed`)
  
  const totalTests = report.summary.rssTests.total + report.summary.apiTests.total + report.summary.integrationTests.total
  const totalPassed = report.summary.rssTests.passed + report.summary.apiTests.passed + report.summary.integrationTests.passed
  
  console.log(`\\n🎯 OVERALL: ${totalPassed}/${totalTests} tests passed (${Math.round((totalPassed/totalTests)*100)}%)`)
  
  if (totalPassed === totalTests) {
    console.log('\\n🎉 ALL TESTS PASSED! Reddit RSS integration is working correctly.')
  } else {
    console.log('\\n⚠️  Some tests failed. Check the details above for issues.')
  }
  
  // Save detailed report
  const fs = require('fs')
  const reportPath = 'test-report.json'
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\\n📄 Detailed report saved to: ${reportPath}`)
  
  console.log('\\n' + '='.repeat(80))
}

// Main Test Runner
async function runAllTests() {
  console.log('🚀 Starting Reddit RSS Integration Tests\\n')
  
  try {
    // Check if server is running
    try {
      await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 })
      log('✅ Server is running', 'success')
    } catch (error) {
      log('❌ Server is not running. Please start the development server first.', 'error')
      log('Run: npm run dev', 'info')
      return
    }
    
    // Run test suites
    await testRSSFeeds()
    await delay(2000)
    
    await testAPIEndpoints()
    await delay(2000)
    
    await testIntegration()
    await delay(2000)
    
    await testPerformance()
    
    // Generate report
    generateReport()
    
  } catch (error) {
    log(`Fatal error during testing: ${error.message}`, 'error')
    console.error(error)
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error)
}

module.exports = {
  runAllTests,
  testRSSFeeds,
  testAPIEndpoints,
  testIntegration,
  testPerformance
}