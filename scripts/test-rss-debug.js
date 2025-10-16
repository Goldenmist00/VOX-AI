/**
 * Debug script to test Reddit RSS fetching
 * Run with: node scripts/test-rss-debug.js
 */

const axios = require('axios')
const { parseString } = require('xml2js')

async function testRedditRSS() {
  console.log('🔍 Testing Reddit RSS Feed Access...')
  
  const keyword = 'climate change'
  const subreddit = 'science'
  const rssUrl = `https://www.reddit.com/r/${subreddit}/search.rss?q=${encodeURIComponent(keyword)}&restrict_sr=on&limit=5&sort=relevance`
  
  console.log(`Testing URL: ${rssUrl}`)
  
  try {
    const response = await axios.get(rssUrl, {
      headers: {
        'User-Agent': 'VOX-AI-RSS-Test/1.0.0'
      },
      timeout: 15000
    })
    
    console.log(`✅ Response Status: ${response.status}`)
    console.log(`✅ Response Size: ${response.data.length} characters`)
    
    // Parse XML
    parseString(response.data, (err, result) => {
      if (err) {
        console.error('❌ XML Parse Error:', err)
        return
      }
      
      console.log('✅ XML Parsed Successfully')
      
      // Handle both RSS and Atom formats
      let items = []
      if (result?.rss?.channel?.[0]?.item) {
        items = result.rss.channel[0].item
      } else if (result?.feed?.entry) {
        items = result.feed.entry
      }
      console.log(`✅ Found ${items.length} items in RSS/Atom feed`)
      
      if (items.length > 0) {
        console.log('\n📋 Sample Items:')
        items.slice(0, 3).forEach((item, index) => {
          // Handle both RSS and Atom formats
          const title = item.title?.[0] || item.title || 'No title'
          const author = item.author?.[0]?.name?.[0] || item.author?.[0] || 'No author'
          const link = item.link?.[0]?.$?.href || item.link?.[0] || 'No link'
          const date = item.published?.[0] || item.pubDate?.[0] || 'No date'
          
          console.log(`\n${index + 1}. Title: ${title}`)
          console.log(`   Author: ${author}`)
          console.log(`   Link: ${link}`)
          console.log(`   Date: ${date}`)
        })
      } else {
        console.log('⚠️  No items found in RSS feed')
        console.log('Raw XML structure:')
        console.log(JSON.stringify(result, null, 2))
      }
    })
    
  } catch (error) {
    console.error('❌ Request failed:', error.message)
    if (error.response) {
      console.error(`   Status: ${error.response.status}`)
      console.error(`   Headers:`, error.response.headers)
    }
  }
}

async function testMultipleSubreddits() {
  console.log('\n🔍 Testing Multiple Subreddits...')
  
  const keyword = 'artificial intelligence'
  const subreddits = ['technology', 'artificial', 'MachineLearning']
  
  for (const subreddit of subreddits) {
    console.log(`\n📡 Testing r/${subreddit}...`)
    
    const rssUrl = `https://www.reddit.com/r/${subreddit}/search.rss?q=${encodeURIComponent(keyword)}&restrict_sr=on&limit=3`
    
    try {
      const response = await axios.get(rssUrl, {
        headers: {
          'User-Agent': 'VOX-AI-RSS-Test/1.0.0'
        },
        timeout: 10000
      })
      
      parseString(response.data, (err, result) => {
        if (err) {
          console.log(`   ❌ Parse error: ${err.message}`)
          return
        }
        
        const items = result?.rss?.channel?.[0]?.item || []
        console.log(`   ✅ r/${subreddit}: ${items.length} posts found`)
        
        if (items.length > 0) {
          console.log(`   📝 Sample: "${items[0].title?.[0]?.substring(0, 60)}..."`)
        }
      })
      
    } catch (error) {
      console.log(`   ❌ r/${subreddit}: ${error.message}`)
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

async function testCommentFetching() {
  console.log('\n🔍 Testing Comment Fetching...')
  
  // Test with a sample Reddit post URL
  const testUrl = 'https://www.reddit.com/r/technology/comments/sample.json'
  
  console.log(`Testing comment fetch from: ${testUrl}`)
  
  try {
    const response = await axios.get(testUrl, {
      headers: {
        'User-Agent': 'VOX-AI-RSS-Test/1.0.0'
      },
      timeout: 10000
    })
    
    console.log(`✅ JSON Response received`)
    
    if (Array.isArray(response.data) && response.data.length > 1) {
      const commentsData = response.data[1]?.data?.children || []
      console.log(`✅ Found ${commentsData.length} comment objects`)
      
      const validComments = commentsData.filter(item => 
        item.data && 
        item.data.body && 
        item.data.body !== '[deleted]' && 
        item.data.body !== '[removed]'
      )
      
      console.log(`✅ ${validComments.length} valid comments`)
      
      if (validComments.length > 0) {
        console.log(`📝 Sample comment: "${validComments[0].data.body.substring(0, 100)}..."`)
      }
    } else {
      console.log('⚠️  Unexpected JSON structure')
    }
    
  } catch (error) {
    console.log('⚠️  Comment fetching test skipped (requires valid post URL)')
    console.log('   This will be tested with real posts during integration')
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Reddit RSS Debug Tests\n')
  
  try {
    await testRedditRSS()
    await testMultipleSubreddits()
    await testCommentFetching()
    
    console.log('\n✅ Debug tests completed!')
    console.log('\nIf RSS feeds are working but no data is showing in the app:')
    console.log('1. Check MongoDB connection')
    console.log('2. Check Gemini AI API key')
    console.log('3. Check authentication in the app')
    console.log('4. Check browser console for errors')
    
  } catch (error) {
    console.error('\n❌ Debug tests failed:', error)
  }
}

// Run tests
runTests().catch(console.error)