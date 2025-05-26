const sitemap = require('fs').readFileSync('_site/sitemap.xml').toString();
const puppeteer = require("puppeteer");
const pa11y = require("pa11y");
const parseString = require('xml2js').parseString;
(async () => {
  parseString(sitemap, async (err, sitemapObj) => {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        `--no-sandbox`,
        `--disable-setuid-sandbox`,
      ],
      slowMo: 50
    });
    let exitCode = 0;

    if (err === null) {
      let urlSet = sitemapObj.urlset.url.filter((url) => {
        let segments = url.loc[0].split(".");
        let fileType = segments[segments.length - 1];
        return fileType === 'html' || fileType === undefined;
      })

      for (let i = 0; i < urlSet.length; i++) {
        let result = await pa11y(urlSet[i].loc[0], {
          browser: browser,
          level: "info",
          hideElements: "svg symbol, #filters-wrapper, #main-content > section:nth-child(4) > div > div > div:nth-child(2) > form",
          standard: 'WCAG2AA'
        })
        .catch((exception) => {
          console.error(exception)
        })
        console.log(result);
        exitCode += result.issues.length;
      }
    } else {
      console.error(err);
      process.exit(1);
    }
    //
    await browser.close();
    process.exit(exitCode);
  });
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
