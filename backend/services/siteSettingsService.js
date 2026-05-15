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
          title: 'Anarkali Suits',
          slug: 'anarkali',
          subtitle: 'Timeless Elegance',
          description: 'Experience the grace of flowing silhouettes with our exquisite Anarkali collection. Perfect for weddings, festivals, and special occasions, these suits blend traditional craftsmanship with contemporary designs.',
          features: ['Flowing Silhouette', 'Intricate Embroidery', 'Premium Fabrics'],
          image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=1200',
          order: 0
        },
        {
          title: 'Palazzo Suits',
          slug: 'palazzo',
          subtitle: 'Contemporary Comfort',
          description: 'Discover the perfect fusion of style and comfort with our Palazzo suits. Featuring wide-leg pants and elegant kurtas, these outfits are ideal for both casual gatherings and formal events.',
          features: ['Wide-Leg Comfort', 'Versatile Styling', 'Modern Appeal'],
          image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200',
          order: 1
        },
        {
          title: 'Straight Cut Suits',
          slug: 'straight-cut',
          subtitle: 'Classic Sophistication',
          description: 'Embrace timeless elegance with our Straight Cut collection. These suits offer a sleek, sophisticated look that works beautifully for office wear, parties, and everyday occasions.',
          features: ['Sleek Design', 'Easy to Wear', 'Versatile Choice'],
          image: 'https://images.unsplash.com/photo-1594465919760-441fe5908ab0?auto=format&fit=crop&q=80&w=1200',
          order: 2
        },
        {
          title: 'Sharara Suits',
          slug: 'sharara',
          subtitle: 'Regal Grandeur',
          description: 'Make a statement with our stunning Sharara suits. Featuring flared pants and ornate detailing, these outfits bring royal elegance to weddings, celebrations, and festive occasions.',
          features: ['Flared Elegance', 'Rich Embellishments', 'Festive Appeal'],
          image: 'https://images.unsplash.com/photo-1617175548912-1ef022df7006?auto=format&fit=crop&q=80&w=1200',
          order: 3
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
