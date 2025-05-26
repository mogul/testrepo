const { DateTime } = require('luxon');
const fs = require('fs');
const path = require('path');
const pluginRss = require('@11ty/eleventy-plugin-rss');
const pluginNavigation = require('@11ty/eleventy-navigation');
const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const yaml = require("js-yaml");
const svgSprite = require("eleventy-plugin-svg-sprite");
const exclusionSearchFilter = require("./filters/exclusionSearchFilter");
const { EleventyRenderPlugin } = require("@11ty/eleventy");
const {
  tooltipShortcode,
  csHeroImageShortcode,
  imageShortcode,
  imageWithClassShortcode,
  imageWithTextBlockShortcode,
  bannerCtaBlockShortcode,
  bannerShortcode,
  heroShortcode,
  imagePathShortcode
} = require('./config');

module.exports = function (config) {
  // Set pathPrefix for site
  let pathPrefix = '/';

  // Copy the `admin` folders to the output
  // config.addPassthroughCopy('admin');

  // Copy USWDS init JS so we can load it in HEAD to prevent banner flashing
  config.addPassthroughCopy({ './node_modules/@uswds/uswds/dist/js/uswds-init.js': 'assets/js/uswds-init.js' });

  // Add favicons
  config.addPassthroughCopy({ "./site/favicon.ico": "favicon.ico" });
  config.addPassthroughCopy({ "./site/android-chrome-192x192.png": "android-chrome-192x192.png" });
  config.addPassthroughCopy({ "./site/android-chrome-512x512.png": "android-chrome-512x512.png" });
  config.addPassthroughCopy({ "./site/apple-touch-icon.png": "apple-touch-icon.png" });
  config.addPassthroughCopy({ "./site/favicon-32x32.png": "favicon-32x32.png" });
  config.addPassthroughCopy({ "./site/favicon-16x16.png": "favicon-16x16.png" });

  // Add robots.txt
  config.addPassthroughCopy({ "./site/robots.txt": "robots.txt" });

  // Add plugins
  config.addPlugin(pluginRss);
  config.addPlugin(pluginNavigation);
  config.addPlugin(EleventyRenderPlugin);


  //// SVG Sprite Plugin for USWDS USWDS icons
  config.addPlugin(svgSprite, {
    path: "./node_modules/@uswds/uswds/dist/img/uswds-icons",
    svgSpriteShortcode: 'uswds_icons_sprite',
    svgShortcode: 'uswds_icons'
  });

  //// SVG Sprite Plugin for USWDS USA icons
  config.addPlugin(svgSprite, {
    path: "./node_modules/@uswds/uswds/dist/img/usa-icons",
    svgSpriteShortcode: 'usa_icons_sprite',
    svgShortcode: 'usa_icons'
  });

  // Allow yaml to be used in the _data dir
  config.addDataExtension("yaml", contents => yaml.load(contents));

  config.addFilter('readableDate', (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat(
      'dd LLL yyyy'
    );
  });

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  config.addFilter('htmlDateString', (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd');
  });

  // Get the first `n` elements of a collection.
  config.addFilter('head', (array, n) => {
    if (!Array.isArray(array) || array.length === 0) {
      return [];
    }
    if (n < 0) {
      return array.slice(n);
    }

    return array.slice(0, n);
  });

  // Return the smallest number argument
  config.addFilter('min', (...numbers) => {
    return Math.min.apply(null, numbers);
  });

  function filterTagList(tags) {
    return (tags || []).filter(
      (tag) => ['all', 'nav', 'post', 'posts'].indexOf(tag) === -1
    );
  }

  config.addFilter('filterTagList', filterTagList);

  config.addFilter('money', (number) => {

    // Convert the number to a fixed decimal with 2 places
    const formattedNumber = number.toFixed(2);
    // Add a dollar sign in front
    const moneyString = `$${formattedNumber}`;
    return moneyString;

  });


  config.addFilter('explode', (str) => {
    let list = '';
    if (str.length === 0) { return list; }
    let delimiter = str.includes('|') ? '|' : str.includes(';') ? ';' : ',';
    const splitted = str.split(delimiter);
    for (let i = 0; i < splitted.length; i++) {
      const content = splitted[i].trim();
      if (content.length > 0) {
        list += `<li>${splitted[i]}</li>`;
      }
    }

    return list;
  });

  // Add debugger filter
  config.addFilter('debug', (...args) => {
    console.log(...args);
    debugger;
  });

  // Create an array of all tags
  config.addCollection('tagList', function (collection) {
    let tagSet = new Set();
    collection.getAll().forEach((item) => {
      (item.data.tags || []).forEach((tag) => tagSet.add(tag));
    });

    return filterTagList([...tagSet]);
  });

  // If BASEURL env variable exists, update pathPrefix to the BASEURL
  if (process.env.BASEURL) {
    pathPrefix = process.env.BASEURL;
  }

  // Customize Markdown library and settings:
  let markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
  }).use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.ariaHidden({
      placement: 'after',
      class: 'direct-link',
      symbol: '#',
      level: [1, 2, 3, 4],
    }),
    slugify: config.getFilter('slug'),
  });
  config.setLibrary('md', markdownLibrary);

  const openDefaultRender = markdownLibrary.renderer.rules.link_open ||
    function (tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };

  markdownLibrary.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const [attrName, href] = token.attrs.find(attr => attr[0] === 'href')

    if (href && (!href.startsWith('/') && !href.startsWith('#'))) {
      token.attrPush(['target', '_blank']);
      token.attrPush(['rel', 'noopener noreferrer']);

      // The way this works is "token" is the opening link tag so that means the next token in the tokens list should be a text
      // token that contains the text that describes the link. We can then create a new token of our own that is of type html_inline
      // If you don't use html_inline you'd need to create a 3 new tokens: span_open, text, and span_close and reliably be able to
      // splice those into the tokens array 
      const newTabWarningText = {
        content: ' <span class="usa-sr-only">(opens in new tab)</span>',
        hidden: false,
        leve: 0,
        nesting: 0,
        type: 'html_inline'
      };

      //This line was commented because us causing a render error when a paragrapha has multiple links.
      //This line is needed for the screen reader open in new tab work
      //tokens.splice(idx + 2, 0, newTabWarningText);
    }

    return openDefaultRender(tokens, idx, options, env, self);
  };

  // Override Browsersync defaults (used only with --serve)
  config.setBrowserSyncConfig({
    callbacks: {
      ready: function (err, browserSync) {
        const content_404 = fs.readFileSync('_site/404/index.html');

        browserSync.addMiddleware('*', (req, res) => {
          // Provides the 404 content without redirect.
          res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
          res.write(content_404);
          res.end();
        });
      },
    },
    ui: false,
    ghostMode: false,
  });

  // Set image shortcodes
  config.addLiquidShortcode('cs_hero', csHeroImageShortcode);
  config.addLiquidShortcode('image', imageShortcode);
  config.addShortcode('image', imageShortcode);
  config.addShortcode('image_path', imagePathShortcode);
  config.addLiquidShortcode('image_with_class', imageWithClassShortcode);
  config.addLiquidShortcode("uswds_icon", function (name) {
    return `
    <svg class="usa-icon" aria-hidden="true" role="img">
      <use xlink:href="#svg-${name}"></use>
    </svg>`;
  });

  config.addShortcode("hero", heroShortcode);
  config.addShortcode("opens_in_new_tab", () => { return '<span class="usa-sr-only">(opens in new tab)</span>' });
  config.addShortcode("md", function (content) {
    // Render the Markdown content
    return markdownIt().render(content);
  });

  config.addLiquidShortcode('link', (link) => (link.startsWith('http') ? link : path.join(pathPrefix, link)));

  // Set Exclusion Search Filter
  config.addFilter("opsearch", exclusionSearchFilter);

  //Return true if the exclusion application end date is today or in the future
  //This is used in the sitemap
  config.addFilter('activeOp', (end_date) => {

    const today = new Date();
    const deadline = new Date(end_date);

    if (isNaN(deadline.getTime())) {
      // Invalid date input
      return true;
    }

    const daysUntilDeadline = Math.floor((deadline - today) / (24 * 60 * 60 * 1000));

    if (daysUntilDeadline <= -1) {
      return false;
    }
    else {
      return true;
    }

  });

  config.addFilter("set_title", function (data) {
    this.page.title = data;
  })

  config.addFilter('get_title', function (data) {
    return data ?? this.page.title;
  })

  config.addLiquidShortcode('banner_block', bannerShortcode);
  config.addPairedShortcode('image_with_text_block', imageWithTextBlockShortcode);
  config.addPairedShortcode('banner_cta_block', bannerCtaBlockShortcode);
  config.addPairedShortcode('tooltip', tooltipShortcode);

  return {
    // Control which files Eleventy will process
    // e.g.: *.md, *.njk, *.html, *.liquid
    templateFormats: ['md', 'njk', 'html', 'liquid'],

    // Pre-process *.md files with: (default: `liquid`)
    // Other template engines are available
    // See https://www.11ty.dev/docs/languages/ for other engines.
    markdownTemplateEngine: 'liquid',

    // Pre-process *.html files with: (default: `liquid`)
    // Other template engines are available
    // See https://www.11ty.dev/docs/languages/ for other engines.
    htmlTemplateEngine: 'liquid',

    // -----------------------------------------------------------------
    // If your site deploys to a subdirectory, change `pathPrefix`.
    // Don’t worry about leading and trailing slashes, we normalize these.

    // If you don’t have a subdirectory, use "" or "/" (they do the same thing)
    // This is only used for link URLs (it does not affect your file structure)
    // Best paired with the `url` filter: https://www.11ty.dev/docs/filters/url/

    // You can also pass this in on the command line using `--pathprefix`

    // Optional (default is shown)
    pathPrefix: pathPrefix,
    // -----------------------------------------------------------------

    // These are all optional (defaults are shown):
    dir: {
      input: 'pages',
      includes: '../_includes',
      data: '../_data',
      output: '_site',
    },
  };
};
