import mongoose from 'mongoose'

const fabricSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  order: { type: Number, required: true }
})

const categorySlideSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true },
  subtitle: { type: String, required: true },
  description: { type: String, required: true },
  targetAudience: { type: mongoose.Schema.Types.Mixed, default: ['all'] },
  features: [String],
  image: { type: String, required: true },
  order: { type: Number, required: true }
})

const magazineStorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  description: { type: String, required: true },
  image: { type: String, default: '' },
  category: { type: String, default: 'Craftsmanship' },
  author: { type: String, default: 'SEEMEE Atelier' },
  quote: { type: String, default: '' },
  readTime: { type: String, default: '5 MIN READ' },
  date: { type: String, default: '' },
  chapter: { type: String, default: 'CHAPTER 01' },
  sections: [String],
  highlights: [String],
  marginalia: { type: String, default: '' },
  order: { type: Number, default: 0 }
})

const siteSettingsSchema = new mongoose.Schema({
  logo: { type: String, required: true },
  aboutImage: { type: String, required: true },
  fabrics: [fabricSchema],
  categorySlides: [categorySlideSchema],
  magazineStories: [magazineStorySchema]
}, { timestamps: true })

export default mongoose.model('SiteSettings', siteSettingsSchema)
