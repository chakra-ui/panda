export interface Showcase {
  name: string
  description: string
  url: string
  image: string
}

export const showcases: Showcase[] = [
  {
    name: 'CoinMarketCap',
    description: 'Leading crypto data platform',
    url: 'https://coinmarketcap.com/',
    image:
      'https://s2.coinmarketcap.com/static/cloud/img/splash_600x315_1.png?_=d3bfca8'
  },
  {
    name: 'Magic Labs',
    description: 'A web3 infrastructure company',
    url: 'https://magic.link/',
    image: 'https://magic.link/images/og-img.png'
  },
  {
    name: 'Novu',
    description: 'Open-source notification infrastructure',
    url: 'https://novu.co/',
    image: 'https://novu.co/images/social-preview.jpg'
  },
  {
    name: 'Ark UI',
    description: 'A library of unstyled components',
    url: 'https://ark-ui.com/',
    image: 'https://ark-ui.com/opengraph-image.png?0b173734bffff5ac'
  },
  {
    name: 'Cool Contrast',
    description: 'Customize how your content appears',
    url: 'https://coolcontrast.vercel.app/',
    image: 'https://coolcontrast.vercel.app/seo-og-image.webp'
  },
  {
    name: 'Panda Mastery',
    description: 'An advanced course to learn Panda CSS',
    url: 'https://www.pandamastery.com/',
    image: '/showcase/panda-mastery.png'
  },

  {
    name: 'Liquity',
    description: 'Decentralized protocol for interest-free loans',
    url: 'https://liquity.app/',
    image: '/showcase/liquity.png'
  },
  {
    name: 'Baseconnect',
    description: 'Helps businesses with market intelligence',
    url: 'https://baseconnect.in/',
    image: '/showcase/base-connect.png'
  },
  {
    name: 'Park UI',
    description: 'Build design systems with Panda and Ark UI',
    url: 'https://park-ui.com',
    image: '/showcase/park-ui.png'
  }
]
