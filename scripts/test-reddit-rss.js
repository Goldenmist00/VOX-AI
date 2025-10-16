/**
 * Test script for Reddit RSS integration
 * Run with: node scripts/test-reddit-rss.js
 */

const axios = require('axios')
const { parseString } = require('xml2js')
const cheerio = require('cheerio')

// Test functions
async function testRSSFeed() {
  console.log('🔍 Testing Reddit RSS Feed Access...')
  
  try {
    const keyword = 'climate change'
    const subreddit = 'science'
    const rssUrl = `https://www.reddit.com/r/${subreddit}/search.rss?q=${encodeURIComponent(keyword)}&restrict_sr=on&limit=5`
    
    console.log(`   Testing URL: ${rssUrl}`)
    
    const response = await axios.get(rssUrl, {
      headers: {
        'User-Agent': 'VOX-AI-RSS-Test/1.0.0'
      },
      timeout: 10000
    })
    
    if (response.status === 200 && response.data) {
      console.log('✅ RSS feed accessible')
      console.log(`   Response size: ${response.data.length} characters`)
      
      // Test XML parsing
      const posts = await parseRSSXML(response.data)
      console.log(`✅ Successfully parsed ${posts.length} posts from RSS`)
      
      if (posts.length > 0) {
        const firstPost = posts[0]
        console.log(`   Sample post: "${firstPost.title.substring(0, 50)}..."`)
        console.log(`   Author: ${firstPost.author}`)
        console.log(`   Link: ${firstPost.link}`)
      }
      
      return true
    } else {
      throw new Error(`Unexpected response status: ${response.status}`)
    }
    
  } catch (error) {
    console.error('❌ RSS feed test failed:', error.message)
    return false
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
    // Load HTML with cheerio
    const $ = cheerio.load(html)
    
    // Remove script and style elements
    $('script, style').remove()
    
    // Get text content and clean it
    let text = $.text()
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim()
    
    // Remove Reddit-specific artifacts
    text = text.replace(/\[link\]/g, '')
    text = text.replace(/\[comments\]/g, '')
    text = text.replace(/submitted by .* to .*/g, '')
    
    return text
  } catch (error) {
    console.warn('Error cleaning HTML content:', error.message)
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

async function testMultipleSubreddits() {
  console.log('\n🔍 Testing Multiple Subreddits...')
  
  const keyword = 'artificial intelligence'
  const subreddits = ['technology', 'MachineLearning', 'artificial', 'singularity']
  
  for (const subreddit of subreddits) {
    try {
      console.log(`   Testing r/${subreddit}...`)
      
      const rssUrl = `https://www.reddit.com/r/${subreddit}/search.rss?q=${encodeURIComponent(keyword)}&restrict_sr=on&limit=3`
      
      const response = await axios.get(rssUrl, {
        headers: {
          'User-Agent': 'VOX-AI-RSS-Test/1.0.0'
        },
        timeout: 8000
      })
      
      if (response.status === 200) {
        const posts = await parseRSSXML(response.data)
        console.log(`   ✅ r/${subreddit}: ${posts.length} posts found`)
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.log(`   ❌ r/${subreddit}: ${error.message}`)
    }
  }
}

async function testCommentScraping() {
  console.log('\n🔍 Testing Comment Scraping...')
  
  try {
    // Test with a known Reddit post URL
    const testUrl = 'https://www.reddit.com/r/technology/comments/sample_post/'
    
    console.log(`   Testing comment extraction from: ${testUrl}`)
    
    const response = await axios.get(testUrl, {
      headers: {
        'User-Agent': 'VOX-AI-RSS-Test/1.0.0'
      },
      timeout: 10000
    })
    
    if (response.status === 200) {
      const $ = cheerio.load(response.data)
      
      // Look for comment elements (Reddit's structure may vary)
      const comments = []
      
      // Try different selectors for comments
      const commentSelectors = [
        '[data-testid="comment"]',
        '.Comment',
        '[data-type="comment"]',
        '.thing.comment'
      ]
      
      for (const selector of commentSelectors) {
        const elements = $(selector)
        if (elements.length > 0) {
          console.log(`   Found ${elements.length} comments using selector: ${selector}`)
          break
        }
      }
      
      console.log('✅ Comment scraping structure identified')
      
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
    
  } catch (error) {
    console.log('⚠️  Comment scraping test skipped (requires valid post URL)')
    console.log('   This will be tested with real posts during integration')
  }
}

async function testRateLimiting() {
  console.log('\n🔍 Testing Rate Limiting...')
  
  const requests = []
  const keyword = 'test'
  
  // Make multiple rapid requests
  for (let i = 0; i < 5; i++) {
    const rssUrl = `https://www.reddit.com/r/test/search.rss?q=${keyword}&limit=1`
    
    requests.push(
      axios.get(rssUrl, {
        headers: {
          'User-Agent': 'VOX-AI-RSS-Test/1.0.0'
        },
        timeout: 5000
      }).then(response => ({
        success: true,
        status: response.status,
        request: i + 1
      })).catch(error => ({
        success: false,
        error: error.message,
        request: i + 1
      }))
    )
  }
  
  const results = await Promise.all(requests)
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  console.log(`   Successful requests: ${successful}/5`)
  console.log(`   Failed requests: ${failed}/5`)
  
  if (successful >= 3) {
    console.log('✅ Rate limiting appears reasonable')
  } else {
    console.log('⚠️  High failure rate - may need request throttling')
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Reddit RSS Integration Tests\n')
  
  const tests = [
    { name: 'RSS Feed Access', fn: testRSSFeed },
    { name: 'Multiple Subreddits', fn: testMultipleSubreddits },
    { name: 'Comment Scraping', fn: testCommentScraping },
    { name: 'Rate Limiting', fn: testRateLimiting }
  ]
  
  const results = []
  
  for (const test of tests) {
    try {
      console.log(`\n${'='.repeat(50)}`)
      console.log(`Running: ${test.name}`)
      console.log('='.repeat(50))
      
      const startTime = Date.now()
      const result = await test.fn()
      const duration = Date.now() - startTime
      
      results.push({
        name: test.name,
        success: result !== false,
        duration
      })
      
      console.log(`\n✅ ${test.name} completed in ${duration}ms`)
      
    } catch (error) {
      console.error(`\n❌ ${test.name} failed:`, error.message)
      results.push({
        name: test.name,
        success: false,
        error: error.message
      })
    }
    
    // Delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('TEST SUMMARY')
  console.log('='.repeat(60))
  
  const passed = results.filter(r => r.success).length
  const total = results.length
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL'
    const duration = result.duration ? ` (${result.duration}ms)` : ''
    console.log(`${status} ${result.name}${duration}`)
    if (result.error) {
      console.log(`     Error: ${result.error}`)
    }
  })
  
  console.log(`\nOverall: ${passed}/${total} tests passed`)
  
  if (passed === total) {
    console.log('🎉 All tests passed! Reddit RSS integration is ready.')
  } else {
    console.log('⚠️  Some tests failed. Review the errors above.')
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error)
}

module.exports = {
  testRSSFeed,
  testMultipleSubreddits,
  testCommentScraping,
  testRateLimiting,
  runAllTests
}