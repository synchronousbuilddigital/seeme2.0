import mongoose from 'mongoose'
import Magazine from '../models/Magazine.js'
import asyncHandler from '../utils/asyncHandler.js'

const defaultMagazineStories = [
  {
    title: 'Silk and the River City',
    subtitle: 'The Banaras Loom as a Living Chronicle',
    description: 'The Banarasi loom turns repetition into ritual. Every shuttle movement carries a tempo that has outlived trends, and every finished textile becomes a reminder that cloth can contain geography, labor, and inheritance at once. This chapter follows the loom room from daylight to dusk, moving past dye vats, thread books, and folded lengths of silk waiting for their last inspection.',
    image: '',
    category: 'Craftsmanship',
    author: 'Julian Thorne',
    quote: 'A woven fabric can be read the way a city is read: slowly, by layers.',
    readTime: '7 MIN READ',
    date: 'MAY 2026',
    chapter: 'CHAPTER 01',
    sections: [
      'The first paragraph introduces the loom room and the steady rhythm that shapes the cloth before it even leaves the frame.',
      'The second section studies the pattern books, where traditional references are reworked into a modern sequence of color and texture.',
      'The final section follows the garment into the wardrobe, where the textile becomes part of a contemporary silhouette.'
    ],
    highlights: ['Banarasi pattern books', 'Textile density and drape', 'Heritage weave reinterpreted for today'],
    marginalia: 'Reading cue: Notice how the story moves from architecture to intimacy, as if the weave were drawing a floor plan.',
    order: 0,
    isActive: true
  },
  {
    title: 'The Banarasi Weaving Legacy',
    subtitle: 'A Symphony of Gold and Pure Silk Threads',
    description: 'From the looms of Varanasi to the modern wardrobe. Discover how we preserve the intricate patterns of traditional Banarasi silk while adapting them for the contemporary woman. A celebration of texture, heritage, and the dedicated hands that guide every metallic thread through the loom to form legendary motifs.',
    image: '',
    category: 'Heritage',
    author: 'Elena Rossi',
    quote: 'We do not just weave silk; we weave the stories of generations.',
    readTime: '8 MIN READ',
    date: 'APRIL 2026',
    chapter: 'CHAPTER 02',
    sections: [
      'The opening spread traces the first sketch, where the motif is scaled, softened, and translated into thread.',
      'The middle pages move through the handwork itself, where gold tones are layered, pressed, and secured by eye.',
      'The closing note records the finishing stage, when the garment is inspected, stored, and prepared like an archive piece.'
    ],
    highlights: ['Intricate floral patterns', 'Pure mulberry silk threads', 'Traditional metallic borders'],
    marginalia: 'Library note: This story reads like a conservator\'s log, preserving process as carefully as the garment itself.',
    order: 1,
    isActive: true
  },
  {
    title: 'Atelier of Grandeur',
    subtitle: 'Step Inside the World of Precision Tailoring',
    description: 'Step inside the SEEMEE design studio where royal grandeur meets modern ease. Every cut is measured with spatial precision, every embroidery pattern is placed to silhouette the form, and every seam is hand-finished. We balance ancestral skills with contemporary tailoring, ensuring every single dress carries the human soul inside.',
    image: '',
    category: 'Atelier',
    author: 'Aria Varma',
    quote: 'The best craftsmanship never shouts. It is felt in the weight and drape of the fabric.',
    readTime: '6 MIN READ',
    date: 'MARCH 2026',
    chapter: 'CHAPTER 03',
    sections: [
      'The opening spread explains the silhouette, showing how a classic frame is widened, refined, and made easier to wear.',
      'The middle section focuses on surface treatment, where embroidery and seams are placed to guide the eye rather than overwhelm it.',
      'The closing note speaks to wearability, reminding the reader that beauty must still live in the body that carries it.'
    ],
    highlights: ['Comfort-led bespoke tailoring', 'Hand-guided embroidery', 'Architectural pattern-cutting'],
    marginalia: 'Workshop note: The pattern reads like a diagram, but the garment reads like a gesture.',
    order: 2,
    isActive: true
  },
  {
    title: 'The Architecture of the Loom',
    subtitle: 'Where Handloom Mechanics Meet Artistic Vision',
    description: 'A study of the mechanical elegance of hand-operated looms. The warp holds the tension of history while the weft introduces the variable paths of human touch. Here, we analyze how jacquard cards translate complex botanical drawings into textile relief, showing that the loom is both a machine and an extension of the weaver\'s imagination.',
    image: '',
    category: 'Mechanics',
    author: 'Kavya Singh',
    quote: 'Every thread is a choice, and every pick is a second in the weaver\'s day.',
    readTime: '7 MIN READ',
    date: 'FEBRUARY 2026',
    chapter: 'CHAPTER 04',
    sections: [
      'The first passage explains warp preparation, where hundreds of silk threads are combed and aligned.',
      'The second section details the weft insertions and the rhythmic click-clack of the shuttle in motion.',
      'The final spread shows how the pattern emerges, row by row, as a physical archive of patience.'
    ],
    highlights: ['Hand-crafted wooden frames', 'Botanical card systems', 'Precision warp alignment'],
    marginalia: 'Studio note: The physical setup of the warp takes three weeks, before a single inch of silk is woven.',
    order: 3,
    isActive: true
  },
  {
    title: 'The Weight of Velvet',
    subtitle: 'Nocturnal Elegance and the Draped Silhouette',
    description: 'As the sun sets, the richness of royal velvet takes center stage. Our nocturnal collection features deep emeralds and midnight tones, hand-embroidered with tilla work that captures the moon\'s reflection. Here, we explore the physical weight and drape of velvet, showing how it falls in heavy, majestic drapes while remaining incredibly soft and fluid.',
    image: '',
    category: 'Nocturnal',
    author: 'Mira Kapoor',
    quote: 'Velvet absorbs light and holds shadow, creating a deep dimension that silk cannot match.',
    readTime: '5 MIN READ',
    date: 'JANUARY 2026',
    chapter: 'CHAPTER 05',
    sections: [
      'The opening note describes the pile of velvet, explaining how it feels against the skin.',
      'The second passage details the hand-applied tilla embroidery, where silver threads are locked into the velvet fabric.',
      'The final page reads like an invitation to slow luxury, celebrating velvet\'s timeless, majestic presence.'
    ],
    highlights: ['Deep jewel tones', 'Hand-stitched silver tilla', 'Nocturnal design aesthetic'],
    marginalia: 'Archive note: A well-made garment should be readable years later, not just memorable on the day it is worn.',
    order: 4,
    isActive: true
  }
]

// Auto seed magazines if collection is empty
const ensureSeedMagazines = async () => {
  const count = await Magazine.countDocuments()
  if (count === 0) {
    await Magazine.insertMany(defaultMagazineStories)
  }
}

// @desc    Get active magazine items (public)
// @route   GET /api/magazine
// @access  Public
export const getActiveMagazines = asyncHandler(async (req, res) => {
  await ensureSeedMagazines()
  const magazines = await Magazine.find({ isActive: true }).sort({ order: 1 })
  res.json({ success: true, data: magazines })
})

// @desc    Get all magazine items (admin)
// @route   GET /api/magazine/all
// @access  Admin
export const getAllMagazines = asyncHandler(async (req, res) => {
  await ensureSeedMagazines()
  const magazines = await Magazine.find().sort({ order: 1 })
  res.json({ success: true, data: magazines })
})

// @desc    Create magazine item
// @route   POST /api/magazine
// @access  Admin
export const createMagazine = asyncHandler(async (req, res) => {
  const {
    title,
    subtitle,
    description,
    image,
    category,
    author,
    quote,
    readTime,
    date,
    chapter,
    sections,
    highlights,
    marginalia,
    order,
    isActive
  } = req.body

  const highestOrder = await Magazine.findOne().sort({ order: -1 })
  const newOrder = order !== undefined ? Number(order) : (highestOrder ? highestOrder.order + 1 : 0)

  const magazine = await Magazine.create({
    title,
    subtitle: subtitle || '',
    description,
    image,
    category: category || 'Craftsmanship',
    author: author || 'SEEMEE Atelier',
    quote: quote || '',
    readTime: readTime || '5 MIN READ',
    date: date || '',
    chapter: chapter || `CHAPTER ${String(newOrder + 1).padStart(2, '0')}`,
    sections: Array.isArray(sections) ? sections : [],
    highlights: Array.isArray(highlights) ? highlights : [],
    marginalia: marginalia || '',
    order: newOrder,
    isActive: isActive !== undefined ? Boolean(isActive) : true
  })

  res.status(201).json({ success: true, data: magazine })
})

// @desc    Update magazine item
// @route   PUT /api/magazine/:id
// @access  Admin
export const updateMagazine = asyncHandler(async (req, res) => {
  const {
    title,
    subtitle,
    description,
    image,
    category,
    author,
    quote,
    readTime,
    date,
    chapter,
    sections,
    highlights,
    marginalia,
    order,
    isActive
  } = req.body

  const updateFields = {}
  if (title !== undefined) updateFields.title = title
  if (subtitle !== undefined) updateFields.subtitle = subtitle
  if (description !== undefined) updateFields.description = description
  if (image !== undefined) updateFields.image = image
  if (category !== undefined) updateFields.category = category
  if (author !== undefined) updateFields.author = author
  if (quote !== undefined) updateFields.quote = quote
  if (readTime !== undefined) updateFields.readTime = readTime
  if (date !== undefined) updateFields.date = date
  if (chapter !== undefined) updateFields.chapter = chapter
  if (sections !== undefined) updateFields.sections = Array.isArray(sections) ? sections : []
  if (highlights !== undefined) updateFields.highlights = Array.isArray(highlights) ? highlights : []
  if (marginalia !== undefined) updateFields.marginalia = marginalia
  if (order !== undefined) updateFields.order = Number(order)
  if (isActive !== undefined) updateFields.isActive = Boolean(isActive)

  let magazine = null

  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    magazine = await Magazine.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
  }

  if (!magazine) {
    const filter = {}
    if (chapter) filter.chapter = chapter
    else if (title) filter.title = title
    else if (order !== undefined) filter.order = Number(order)

    if (Object.keys(filter).length > 0) {
      magazine = await Magazine.findOneAndUpdate(filter, { $set: updateFields }, { new: true, runValidators: true })
    }
  }

  if (!magazine) {
    magazine = await Magazine.create({
      title: title || 'Untitled Chapter',
      subtitle: subtitle || '',
      description: description || '',
      image: image || '',
      category: category || 'Craftsmanship',
      author: author || 'SEEMEE Atelier',
      quote: quote || '',
      readTime: readTime || '5 MIN READ',
      date: date || '',
      chapter: chapter || 'CHAPTER 01',
      sections: Array.isArray(sections) ? sections : [],
      highlights: Array.isArray(highlights) ? highlights : [],
      marginalia: marginalia || '',
      order: order !== undefined ? Number(order) : 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    })
  }

  res.json({ success: true, data: magazine })
})

// @desc    Delete magazine item
// @route   DELETE /api/magazine/:id
// @access  Admin
export const deleteMagazine = asyncHandler(async (req, res) => {
  let magazine = null
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    magazine = await Magazine.findByIdAndDelete(req.params.id)
  }

  if (!magazine && req.query.chapter) {
    magazine = await Magazine.findOneAndDelete({ chapter: req.query.chapter })
  }

  if (!magazine && req.query.title) {
    magazine = await Magazine.findOneAndDelete({ title: req.query.title })
  }

  if (!magazine) {
    // Delete by order if passed
    const orderNum = Number(req.params.id)
    if (!isNaN(orderNum)) {
      magazine = await Magazine.findOneAndDelete({ order: orderNum })
    }
  }

  if (!magazine) {
    res.status(404)
    throw new Error('Magazine item not found')
  }
  res.json({ success: true, message: 'Magazine item deleted' })
})
