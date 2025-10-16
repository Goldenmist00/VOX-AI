const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

// Define the Debate schema directly since we can't import the model
const debateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: [String],
  createdBy: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  participants: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const Debate = mongoose.models.Debate || mongoose.model('Debate', debateSchema)

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

const sampleDebates = [
  {
    title: "Should AI Replace Human Content Moderation?",
    description: "Discussing the pros and cons of using AI vs human moderators for social media platforms.",
    tags: ["AI", "moderation", "technology", "social-media"],
    createdBy: "system@vox-ai.com",
    isActive: true,
    participants: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "The Future of Remote Work",
    description: "Exploring whether remote work will become the permanent norm or if we'll return to office-based work.",
    tags: ["remote-work", "future", "productivity", "workplace"],
    createdBy: "system@vox-ai.com", 
    isActive: true,
    participants: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Climate Change: Individual vs Corporate Responsibility",
    description: "Debating whether climate action should focus on individual behavior changes or corporate regulations.",
    tags: ["climate", "environment", "responsibility", "policy"],
    createdBy: "system@vox-ai.com",
    isActive: true,
    participants: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const seedDebates = async () => {
  try {
    await connectDB()
    
    // Clear existing debates
    await Debate.deleteMany({})
    console.log('Cleared existing debates')
    
    // Insert sample debates
    const debates = await Debate.insertMany(sampleDebates)
    console.log(`Created ${debates.length} sample debates:`)
    debates.forEach(debate => {
      console.log(`- ${debate.title}`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('Error seeding debates:', error)
    process.exit(1)
  }
}

seedDebates()