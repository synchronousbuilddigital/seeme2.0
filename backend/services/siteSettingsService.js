import SiteSettings from '../models/SiteSettings.js'

export const getSettings = async () => {
  let settings = await SiteSettings.findOne()
  if (!settings) {
    // Create default settings if none exist
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
      ]
    })
  }
  return settings
}

export const updateSettings = async (settingsData) => {
  let settings = await SiteSettings.findOne()
  if (!settings) {
    settings = await SiteSettings.create(settingsData)
  } else {
    Object.assign(settings, settingsData)
    await settings.save()
  }
  return settings
}
