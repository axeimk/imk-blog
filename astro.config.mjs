// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { bundledLanguagesInfo } from 'shiki';

/** @param {string | undefined} lang */
function resolveLanguageName(lang) {
  if (!lang || lang === 'text' || lang === 'plaintext') return null;
  const info = bundledLanguagesInfo.find(
    (l) => l.id === lang || l.aliases?.includes(lang),
  );
  return info?.name ?? lang;
}

/** @type {import('shiki').ShikiTransformer} */
const languageLabelTransformer = {
  name: 'language-label',
  pre(node) {
    const name = resolveLanguageName(this.options.lang);
    if (name) {
      node.properties['data-language'] = name;
    }
  },
};

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.axeimk.dev',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      transformers: [languageLabelTransformer],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
