import SiteSettings from '../models/SiteSettings.js'

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
    order: 0
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
    order: 1
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
    order: 2
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
    order: 3
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
    order: 4
  }
]

export const getSettings = async () => {
  let settings = await SiteSettings.findOne()
  if (!settings) {
    settings = await SiteSettings.create({
      logo: '/images/logoSEEMEE1.png',
      aboutImage: '/images/about.jpg',
      fabrics: [
        {
          title: 'Premium Silk',
          description: 'Luxurious silk fabrics with natural sheen and smooth texture. Perfect for elegant ethnic wear that drapes beautifully and adds sophistication.',
          image: '/images/silk.jpg',
          order: 0
        },
        {
          title: 'Pure Cotton',
          description: 'Soft, breathable cotton fabrics ideal for everyday comfort. Lightweight and perfect for all-season wear with easy maintenance.',
          image: '/images/cotton.jpg',
          order: 1
        },
        {
          title: 'Georgette',
          description: 'Lightweight and flowing georgette fabrics with slightly crinkled texture. Ideal for creating graceful silhouettes and elegant drapes.',
          image: '/images/georgette.jpg',
          order: 2
        },
        {
          title: 'Velvet',
          description: 'Rich and luxurious velvet fabrics with soft pile. Perfect for festive and special occasion wear with premium quality finish.',
          image: '/images/velvet.jpg',
          order: 3
        }
      ],
      categorySlides: [
        {
          title: '2-Piece Sets',
          slug: '2-piece-sets',
          subtitle: 'Effortless Modernity',
          description: 'Stunning tunic and trouser duos that redefine casual luxury with absolute ease.',
          features: ['Tailored Tunic', 'Fluid Trousers', 'Premium Comfort'],
          image: '/images/categories_straight.jpg',
          order: 0
        },
        {
          title: '3-Piece Sets',
          slug: '3-piece-sets',
          subtitle: 'Complete Regal Grace',
          description: 'Harmonious kurta, pants, and matching dupatta sets, crafted with ancestral weaves.',
          features: ['Heritage Kurta', 'Symmetric Pants', 'Adorned Dupatta'],
          image: '/images/ruby_bridal_sharara.png',
          order: 1
        },
        {
          title: 'Co-ord Sets',
          slug: 'co-ord-sets',
          subtitle: 'Contemporary Sleekness',
          description: 'Monochromatic, luxury structured matching co-ords engineered to silhouette your form.',
          features: ['Avant-garde Structure', 'Symmetric Drapes', 'Modern Aesthetic'],
          image: '/images/categories_straight.jpg',
          order: 2
        }
      ],
      magazineStories: defaultMagazineStories
    })
  } else if (!settings.magazineStories || settings.magazineStories.length === 0) {
    settings = await SiteSettings.findOneAndUpdate(
      { _id: settings._id },
      { $set: { magazineStories: defaultMagazineStories } },
      { new: true }
    )
  }

  return settings.toObject ? settings.toObject() : settings
}

export const updateSettings = async (settingsData) => {
  const settings = await SiteSettings.findOneAndUpdate(
    {},
    { $set: settingsData },
    { new: true, upsert: true, runValidators: true }
  )
  return settings
}
