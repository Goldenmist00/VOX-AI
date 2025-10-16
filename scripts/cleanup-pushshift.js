/**
 * Cleanup script to remove Pushshift references and update existing data
 * Run with: node scripts/cleanup-pushshift.js
 */

const { MongoClient } = require('mongodb')

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vox-ai'

async function cleanupPushshiftData() {
  console.log('🧹 Starting Pushshift cleanup...')
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    
    const db = client.db()
    
    // Update all keywords to use RSS only
    console.log('📝 Updating keywords to RSS-only...')
    const keywordResult = await db.collection('keywords').updateMany(
      {},
      {
        $set: {
          dataSources: ['rss']
        },
        $unset: {
          pushshiftData: 1 // Remove any Pushshift-specific fields
        }
      }
    )
    console.log(`✅ Updated ${keywordResult.modifiedCount} keywords`)
    
    // Optional: Remove old Comment collection (Pushshift data)
    // Uncomment the following lines if you want to remove old Pushshift comments
    /*
    console.log('🗑️  Removing old Pushshift comments...')
    const commentResult = await db.collection('comments').deleteMany({})
    console.log(`✅ Removed ${commentResult.deletedCount} old comments`)
    */
    
    // Update any existing integration status
    console.log('📊 Cleaning up integration status...')
    await db.collection('integrationstatus').deleteMany({
      source: 'pushshift'
    })
    console.log('✅ Cleaned up integration status')
    
    console.log('🎉 Pushshift cleanup completed successfully!')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await client.close()
    console.log('📪 Disconnected from MongoDB')
  }
}

// Confirmation prompt
function askForConfirmation() {
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  return new Promise((resolve) => {
    rl.question('⚠️  This will update all keywords to RSS-only. Continue? (y/N): ', (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

// Main execution
async function main() {
  console.log('🔧 VOX AI Pushshift Cleanup Script')
  console.log('This script will:')
  console.log('- Update all keywords to use RSS only')
  console.log('- Remove Pushshift-specific data')
  console.log('- Clean up integration status')
  console.log('')
  
  const confirmed = await askForConfirmation()
  
  if (confirmed) {
    await cleanupPushshiftData()
  } else {
    console.log('❌ Cleanup cancelled')
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { cleanupPushshiftData }