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
  features: [String],
  image: { type: String, required: true },
  order: { type: Number, required: true }
})

const siteSettingsSchema = new mongoose.Schema({
  logo: { type: String, required: true },
  aboutImage: { type: String, required: true },
  fabrics: [fabricSchema],
  categorySlides: [categorySlideSchema]
}, { timestamps: true })

export default mongoose.model('SiteSettings', siteSettingsSchema)
