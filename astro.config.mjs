// @ts-check
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import sitemap from '@astrojs/sitemap'
import mdx from '@astrojs/mdx'
import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import expressiveCode from 'astro-expressive-code'
import siteConfig from './src/site.config'
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'
import icon from 'astro-icon'
import {
  remarkDescription,
  remarkReadingTime,
  rehypeTitleFigure,
} from './src/settings-utils'
import { remarkGithubCard } from './src/plugins/remark-github-card'
import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic'
import rehypeExternalLinks from 'rehype-external-links'
import remarkDirective from 'remark-directive' /* Handle ::: directives as nodes */
import rehypeUnwrapImages from 'rehype-unwrap-images'
import { remarkAdmonitions } from './src/plugins/remark-admonitions' /* Add admonitions */
import remarkMath from 'remark-math' /* for latex math support */
import rehypeKatex from 'rehype-katex' /* again, for latex math support */
import remarkGemoji from './src/plugins/remark-gemoji' /* for shortcode emoji support */
import rehypePixelated from './src/plugins/rehype-pixelated' /* Custom plugin to handle pixelated images */

/**
 * Map post slug -> published date, read straight from frontmatter so the sitemap
 * can emit <lastmod>. Astro's content collections aren't available at config time.
 */
const postsDir = './src/content/posts'
const postDates = new Map(
  fs
    .readdirSync(postsDir)
    .filter((file) => /\.mdx?$/.test(file))
    .flatMap((file) => {
      const raw = fs.readFileSync(path.join(postsDir, file), 'utf-8')
      const match = raw.match(/^published:\s*(.+)$/m)
      if (!match) return []
      const date = new Date(match[1].trim().replace(/^['"]|['"]$/g, ''))
      if (Number.isNaN(date.getTime())) return []
      return [[file.replace(/\.mdx?$/, ''), date]]
    }),
)

// https://astro.build/config
export default defineConfig({
  site: siteConfig.site,
  trailingSlash: 'never',
  prefetch: true,
  markdown: {
    remarkPlugins: [
      [remarkDescription, { maxChars: 200 }],
      remarkReadingTime,
      remarkDirective,
      remarkGithubCard,
      remarkAdmonitions,
      remarkMath,
      remarkGemoji,
    ],
    rehypePlugins: [
      rehypeHeadingIds,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: {
            className: ['heading-anchor'],
          },
          content: fromHtmlIsomorphic(
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link-icon lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
            { fragment: true },
          ).children,
        },
      ],
      rehypeTitleFigure,
      [
        rehypeExternalLinks,
        {
          rel: ['noreferrer', 'noopener'],
          target: '_blank',
        },
      ],
      rehypeUnwrapImages,
      rehypePixelated,
      rehypeKatex,
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      // Tag pages are thin, auto-generated, and canonical-duplicated by /posts.
      filter: (page) => !new URL(page).pathname.startsWith('/tags/'),
      serialize(item) {
        const slug = new URL(item.url).pathname.replace(/^\/posts\//, '')
        const published = postDates.get(slug)
        return published ? { ...item, lastmod: published.toISOString() } : item
      },
    }),
    expressiveCode({
      themes: siteConfig.themes.include,
      useDarkModeMediaQuery: false,
      defaultProps: {
        showLineNumbers: false,
        wrap: false,
      },
      plugins: [pluginLineNumbers()],
    }), // Must come after expressive-code integration
    mdx(),
    icon(),
  ],
  experimental: {
    contentIntellisense: true,
  },
})
