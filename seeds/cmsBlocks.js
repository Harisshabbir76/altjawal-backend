const PageContentBlock = require('../models/PageContentBlock');

const BLOCKS = [
  // ── Home ──────────────────────────────────────────────────────────
  { pageSlug: 'home', blockKey: 'hero_headline',          label: 'Hero Headline',              blockType: 'text' },
  { pageSlug: 'home', blockKey: 'hero_subtext',           label: 'Hero Sub-text',              blockType: 'textarea' },
  { pageSlug: 'home', blockKey: 'hero_cta_label',         label: 'Hero Button Text',           blockType: 'text' },
  { pageSlug: 'home', blockKey: 'hero_background',        label: 'Hero Background Image',      blockType: 'image' },
  { pageSlug: 'home', blockKey: 'intro_heading',          label: 'Introduction Heading',       blockType: 'text' },
  { pageSlug: 'home', blockKey: 'intro_body',             label: 'Introduction Body Text',     blockType: 'textarea' },
  { pageSlug: 'home', blockKey: 'intro_image',            label: 'Introduction Image',         blockType: 'image' },
  { pageSlug: 'home', blockKey: 'services_section_heading', label: 'Services Section Heading', blockType: 'text' },
  { pageSlug: 'home', blockKey: 'why_us_heading',         label: 'Why Choose Us Heading',      blockType: 'text' },
  { pageSlug: 'home', blockKey: 'why_us_body',            label: 'Why Choose Us Body',         blockType: 'textarea' },
  { pageSlug: 'home', blockKey: 'cta_banner_heading',     label: 'CTA Banner Heading',         blockType: 'text' },
  { pageSlug: 'home', blockKey: 'cta_banner_subtext',     label: 'CTA Banner Sub-text',        blockType: 'text' },
  { pageSlug: 'home', blockKey: 'cta_banner_button',      label: 'CTA Banner Button Label',    blockType: 'text' },
  { pageSlug: 'home', blockKey: 'cta_banner_background',  label: 'CTA Banner Background',      blockType: 'image' },

  // ── About ─────────────────────────────────────────────────────────
  { pageSlug: 'about', blockKey: 'page_hero_heading',     label: 'Page Hero Heading',          blockType: 'text' },
  { pageSlug: 'about', blockKey: 'page_hero_subtext',     label: 'Page Hero Sub-text',         blockType: 'text' },
  { pageSlug: 'about', blockKey: 'page_hero_background',  label: 'Page Hero Background',       blockType: 'image' },
  { pageSlug: 'about', blockKey: 'story_heading',         label: 'Our Story Heading',          blockType: 'text' },
  { pageSlug: 'about', blockKey: 'story_body',            label: 'Our Story Body Text',        blockType: 'textarea' },
  { pageSlug: 'about', blockKey: 'story_image',           label: 'Our Story Image',            blockType: 'image' },
  { pageSlug: 'about', blockKey: 'mission_heading',       label: 'Mission Heading',            blockType: 'text' },
  { pageSlug: 'about', blockKey: 'mission_body',          label: 'Mission Text',               blockType: 'textarea' },
  { pageSlug: 'about', blockKey: 'vision_heading',        label: 'Vision Heading',             blockType: 'text' },
  { pageSlug: 'about', blockKey: 'vision_body',           label: 'Vision Text',                blockType: 'textarea' },
  { pageSlug: 'about', blockKey: 'values_heading',        label: 'Values Section Heading',     blockType: 'text' },
  { pageSlug: 'about', blockKey: 'team_heading',          label: 'Team Section Heading',       blockType: 'text' },

  // ── Services ──────────────────────────────────────────────────────
  { pageSlug: 'services', blockKey: 'page_hero_heading',      label: 'Page Hero Heading',          blockType: 'text' },
  { pageSlug: 'services', blockKey: 'page_hero_subtext',      label: 'Page Hero Sub-text',         blockType: 'text' },
  { pageSlug: 'services', blockKey: 'page_hero_background',   label: 'Page Hero Background',       blockType: 'image' },
  { pageSlug: 'services', blockKey: 'section_intro',          label: 'Services Introduction',      blockType: 'textarea' },
  { pageSlug: 'services', blockKey: 'service_1_title',        label: 'Service 1 Title',            blockType: 'text' },
  { pageSlug: 'services', blockKey: 'service_1_description',  label: 'Service 1 Description',      blockType: 'textarea' },
  { pageSlug: 'services', blockKey: 'service_1_image',        label: 'Service 1 Image',            blockType: 'image' },
  { pageSlug: 'services', blockKey: 'service_2_title',        label: 'Service 2 Title',            blockType: 'text' },
  { pageSlug: 'services', blockKey: 'service_2_description',  label: 'Service 2 Description',      blockType: 'textarea' },
  { pageSlug: 'services', blockKey: 'service_2_image',        label: 'Service 2 Image',            blockType: 'image' },
  { pageSlug: 'services', blockKey: 'service_3_title',        label: 'Service 3 Title',            blockType: 'text' },
  { pageSlug: 'services', blockKey: 'service_3_description',  label: 'Service 3 Description',      blockType: 'textarea' },
  { pageSlug: 'services', blockKey: 'service_3_image',        label: 'Service 3 Image',            blockType: 'image' },
  { pageSlug: 'services', blockKey: 'cta_heading',            label: 'Bottom CTA Heading',         blockType: 'text' },
  { pageSlug: 'services', blockKey: 'cta_button_label',       label: 'Bottom CTA Button',          blockType: 'text' },

  // ── Branding ──────────────────────────────────────────────────────
  { pageSlug: 'branding', blockKey: 'page_hero_heading',      label: 'Page Hero Heading',          blockType: 'text' },
  { pageSlug: 'branding', blockKey: 'page_hero_subtext',      label: 'Page Hero Sub-text',         blockType: 'text' },
  { pageSlug: 'branding', blockKey: 'page_hero_background',   label: 'Page Hero Background',       blockType: 'image' },
  { pageSlug: 'branding', blockKey: 'section_intro',          label: 'Branding Intro Text',        blockType: 'textarea' },
  { pageSlug: 'branding', blockKey: 'service_1_title',        label: 'Branding Service 1 Title',   blockType: 'text' },
  { pageSlug: 'branding', blockKey: 'service_1_description',  label: 'Branding Service 1 Desc',    blockType: 'textarea' },
  { pageSlug: 'branding', blockKey: 'service_1_image',        label: 'Branding Service 1 Image',   blockType: 'image' },
  { pageSlug: 'branding', blockKey: 'service_2_title',        label: 'Branding Service 2 Title',   blockType: 'text' },
  { pageSlug: 'branding', blockKey: 'service_2_description',  label: 'Branding Service 2 Desc',    blockType: 'textarea' },
  { pageSlug: 'branding', blockKey: 'service_2_image',        label: 'Branding Service 2 Image',   blockType: 'image' },
  { pageSlug: 'branding', blockKey: 'service_3_title',        label: 'Branding Service 3 Title',   blockType: 'text' },
  { pageSlug: 'branding', blockKey: 'service_3_description',  label: 'Branding Service 3 Desc',    blockType: 'textarea' },
  { pageSlug: 'branding', blockKey: 'service_3_image',        label: 'Branding Service 3 Image',   blockType: 'image' },

  // ── Events ────────────────────────────────────────────────────────
  { pageSlug: 'events', blockKey: 'page_hero_heading',        label: 'Page Hero Heading',          blockType: 'text' },
  { pageSlug: 'events', blockKey: 'page_hero_subtext',        label: 'Page Hero Sub-text',         blockType: 'text' },
  { pageSlug: 'events', blockKey: 'page_hero_background',     label: 'Page Hero Background',       blockType: 'image' },
  { pageSlug: 'events', blockKey: 'section_intro',            label: 'Production Intro Text',      blockType: 'textarea' },
  { pageSlug: 'events', blockKey: 'category_1_title',         label: 'Category 1 Title',           blockType: 'text' },
  { pageSlug: 'events', blockKey: 'category_1_description',   label: 'Category 1 Description',     blockType: 'textarea' },
  { pageSlug: 'events', blockKey: 'category_1_image',         label: 'Category 1 Image',           blockType: 'image' },
  { pageSlug: 'events', blockKey: 'category_2_title',         label: 'Category 2 Title',           blockType: 'text' },
  { pageSlug: 'events', blockKey: 'category_2_description',   label: 'Category 2 Description',     blockType: 'textarea' },
  { pageSlug: 'events', blockKey: 'category_2_image',         label: 'Category 2 Image',           blockType: 'image' },
  { pageSlug: 'events', blockKey: 'process_heading',          label: 'Process Section Heading',    blockType: 'text' },
  { pageSlug: 'events', blockKey: 'process_step_1',           label: 'Process Step 1',             blockType: 'textarea' },
  { pageSlug: 'events', blockKey: 'process_step_2',           label: 'Process Step 2',             blockType: 'textarea' },
  { pageSlug: 'events', blockKey: 'process_step_3',           label: 'Process Step 3',             blockType: 'textarea' },
  { pageSlug: 'events', blockKey: 'cta_heading',              label: 'Bottom CTA Heading',         blockType: 'text' },
  { pageSlug: 'events', blockKey: 'cta_button_label',         label: 'Bottom CTA Button',          blockType: 'text' },

  // ── Legal ─────────────────────────────────────────────────────────
  { pageSlug: 'legal', blockKey: 'page_heading',              label: 'Page Heading',               blockType: 'text' },
  { pageSlug: 'legal', blockKey: 'terms_heading',             label: 'Terms of Service Heading',   blockType: 'text' },
  { pageSlug: 'legal', blockKey: 'terms_body',                label: 'Terms of Service Full Text', blockType: 'textarea' },
  { pageSlug: 'legal', blockKey: 'privacy_heading',           label: 'Privacy Policy Heading',     blockType: 'text' },
  { pageSlug: 'legal', blockKey: 'privacy_body',              label: 'Privacy Policy Full Text',   blockType: 'textarea' },
  { pageSlug: 'legal', blockKey: 'cookie_heading',            label: 'Cookie Policy Heading',      blockType: 'text' },
  { pageSlug: 'legal', blockKey: 'cookie_body',               label: 'Cookie Policy Text',         blockType: 'textarea' },
  { pageSlug: 'legal', blockKey: 'last_updated',              label: 'Last Updated Date',          blockType: 'text' },
];

async function seedCmsBlocks() {
  try {
    const ops = BLOCKS.map((b) => ({
      updateOne: {
        filter: { pageSlug: b.pageSlug, blockKey: b.blockKey },
        update: { $setOnInsert: b },
        upsert: true,
      },
    }));
    await PageContentBlock.bulkWrite(ops);
    console.log('CMS blocks seeded.');
  } catch (err) {
    console.error('CMS seed error:', err.message);
  }
}

module.exports = seedCmsBlocks;
