const path = require('path');
const Image = require('@11ty/eleventy-img');

async function csHeroImageShortcode() {
  const baseUrl = this.ctx?.baseUrl || '';
  let imgSrcs = ["_img/cs-hero-mobile.jpg", "_img/cs-hero.jpg"];
  let imgMetas = [];
  for (const src of imgSrcs) {
    const fileType = path.extname(src).replace('.', '');
    const metadata = await Image(src, {
      formats: [fileType],
      outputDir: './_site/img/',
    });
    imgMetas.push(metadata[fileType] ? metadata[fileType][0] : metadata.jpeg[0]);
  }
  return `<picture>
            <source media="(max-width: 767px" srcset="${baseUrl}${imgMetas[0].url}" />
            <source media="(min-width: 768px" srcset="${baseUrl}${imgMetas[1].url}" />
            <img class="cs-hero__image" src="${baseUrl}${imgMetas[1].url}" alt="ACC member in action" />
          </picture>`;
}

function isEmpty(value) {
  return (value === null || (typeof value === "string" && value.trim().length === 0) || value === 'undefined');
}

async function imageWithClassShortcode(imagePath, cssClass, altText) {
  const pathPrefix = process.env.BASEURL ?? '';
  const fileType = path.extname(imagePath).replace('.', '');

  const metadata = await Image(imagePath, {
    formats: [fileType],
    outputDir: './_site/assets/images/',
    filenameFormat: (id, src, width, format, options) => {
      const basename = path.basename(src, `.${format}`);
      return `${basename}.${id}.${format}`;
    },
  });

  const data = metadata[fileType]?.[0] ?? metadata.jpeg[0];
  // _site/ is the filesystem root of the site, so we should strip that off
  const url = data.outputPath.replace(/^_site\//i, '');
  imagePath = `${pathPrefix}/${url}`;

  // Put the img attributes into an object that we'll later turn into a string.
  // We do it this way so that future maintainers don't accidentally forget to
  // put quotes around an attribute value and cause the site to go haywire in
  // unexpected, hard-to-debug ways that do not break the build.
  const attributes = {
    src: imagePath,
    class: cssClass ?? false,
    alt: altText ?? false,
    loading: 'lazy',
    decoding: 'async',
  };

  const attributeStrings = Object.entries(attributes).map(
    ([key, value]) => `${key}="${(value || '').replace(/"/g, '&quot;')}"`
  );

  return `<img ${attributeStrings.join(' ')}>`;

}

async function imageShortcode(src, alt) {
  const isc = await imageWithClassShortcode.call(this, src, '', alt);
  return isc;
}

async function bannerShortcode(text, hLevel) {
  if (!hLevel) {
    return `
      <section class="banner-block">
        <p class="banner-block__heading">${text}</p>
      </section>
    `;
  }
  return `
    <section class="banner-block">
      <h${hLevel} class="banner-block__heading">${text}</h${hLevel}>
    </section>
  `;
}

async function imageWithTextBlockShortcode(content, src, alt, isFlipped) {
  const isc = await imageShortcode.call(this, src, alt)
  const classes = isFlipped ? "image-text-block image-text-block--flipped" : "image-text-block";
  return `<section class="${classes}">`.concat(
    isc,
    content,
    '</section>'
  );
}

async function bannerCtaBlockShortcode(content, heading, subHeading, url, buttonText, isAltColor) {
  const pathPrefix = process.env.BASEURL ?? '';
  const classes = isAltColor ? "banner-cta-block banner-cta-block--alt-color" : "banner-cta-block";

  // Check if URL is already absolute
  const fullUrl = url.startsWith('http')
    ? url
    : `${pathPrefix}${url.startsWith('/') ? url : `/${url}`}`;

  return `
      <section class="${classes}">
        <div class="banner-cta-block__bg">
          <div class="banner-cta-block__content-wrapper">
            <div class="banner-cta-block__content-inner">
              <div class="banner-cta-block__text">
                <p class="banner-cta-block__sub-heading">${subHeading}</p>
                <h3 class="banner-cta-block__heading">${heading}</h3>
                <p class="banner-cta-block__content">${content}</p>
              </div>
              <a href="${fullUrl}" class="usa-button btn btn--special">${buttonText}</a>
            </div>
          </div>
        </div>
      </section>
  `;
}

async function heroShortcode(text, imageSrc, alt = "Illustration of a green hand, gently holding mountains, trees, and wind turbines.", customClass = "") {
  const baseUrl = this.ctx?.baseUrl || '';
  const fileType = path.extname(imageSrc).replace('.', '');
  const metadata = await getImageData(imageSrc, fileType);
  const data = metadata[fileType][0];
  return `
    <header class="hero dark ${customClass}">
      <div class="hero-container">
        <h1>${text}</h1>
        <img src="${baseUrl}${data.url}" alt="${alt}">
      </div>
      <hr aria-hidden="true" class="hero-wave-divider">
    </header>
  `;
}

async function getImageData(imageSrc, fileType) {
  return await Image(imageSrc, {
    formats: [fileType],
    outputDir: './_site/img/',
  });
}

async function imagePathShortcode(imageSrc) {
  const baseUrl = this.ctx?.baseUrl || '';
  const fileType = 'png';
  const metadata = await getImageData(imageSrc, fileType);
  return `${baseUrl}${metadata[fileType][0].url}`;
}

async function tooltipShortcode(text) {
  const img = await imageShortcode.call(this, "_img/icons/info.svg");
  return `
    <span class="info-icon usa-tooltip" title="${text}">
      ${img}
    </span>
  `;
}

module.exports = {
  tooltipShortcode,
  csHeroImageShortcode,
  imageWithClassShortcode,
  imageShortcode,
  bannerShortcode,
  imageWithTextBlockShortcode,
  bannerCtaBlockShortcode,
  heroShortcode,
  imagePathShortcode
};
