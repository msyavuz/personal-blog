import type { SiteConfig } from '@types'

const config: SiteConfig = {
  site: 'https://msyavuz.dev',
  title: 'Mehmet Salih Yavuz',
  description: 'A personal blog about web development, programming, and technology.',
  author: 'Mehmet Salih Yavuz',
  // Keywords for SEO, used in the meta tags.
  tags: ['web development', 'programming', 'technology', 'blog'],
  // Path to the image used for generating social media previews.
  // Needs to be a square JPEG file due to limitations of the social card generator.
  // Try https://squoosh.app/ to easily convert images to JPEG.
  socialCardAvatarImage: './src/content/avatar.jpg',
  font: 'JetBrains Mono Variable',
  pageSize: 15,
  navLinks: [
    {
      name: 'Home',
      url: '/',
    },
    {
      name: 'About',
      url: '/about',
    },
    {
      name: 'Archive',
      url: '/posts',
    },
    {
      name: 'GitHub',
      url: 'https://github.com/msyavuz/personal-blog',
      external: true,
    },
  ],
  themes: {
    // The theming mode. One of "single" | "select" | "light-dark-auto".
    mode: 'select',
    // The default theme identifier, used when themeMode is "select" or "light-dark-auto".
    // Make sure this is one of the themes listed in `themes` or "auto" for "light-dark-auto" mode.
    default: 'tokyo-night',
    // Shiki themes to bundle with the site.
    // https://expressive-code.com/guides/themes/#using-bundled-themes
    // These will be used to theme the entire site along with syntax highlighting.
    // To use light-dark-auto mode, only include a light and a dark theme in that order.
    // include: [
    //   'github-light',
    //   'github-dark',
    // ]
    include: ['catppuccin-latte', 'tokyo-night'],
  },
  // Social links to display in the footer.
  socialLinks: {
    github: 'https://github.com/msyavuz',
    email: 'salih.yavuz@proton.me',
    linkedin: 'https://www.linkedin.com/in/mehmetsalihyavuz/',
    rss: true,
  },
  // Configuration for Giscus comments.
  // To set up Giscus, follow the instructions at https://giscus.app/
  // You'll need a GitHub repository with discussions enabled and the Giscus app installed.
  // Take the values from the generated script tag at https://giscus.app and fill them in here.
  // If you don't want to use Giscus, set this to undefined.
  // giscus: {
  //   repo: 'stelcodes/multiterm-astro',
  //   repoId: 'R_kgDOPNnBig',
  //   category: 'Giscus',
  //   categoryId: 'DIC_kwDOPNnBis4CteOc',
  //   reactionsEnabled: true, // Enable reactions on post itself
  // },
  giscus: undefined,
}

export default config
