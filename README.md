# Categorical exclusions prototype


## Getting Started

Install JavaScript, then run:

`npm install`


Warning: this will overwrite the current exclusions.json.  It seems more direct to create the json  from other data than go through the csv parsing route earlier, so recommend scripting that elsewhere and uploading json file directly. 

Not recommended:
Populate the data from csv:

`npm run data`

End warning


Start 11ty:

`npm run dev`


## Building the site

### Building the site for production in two simple steps


Warning: this will overwrite the current exclusions.json.  It seems more direct to create the json  from other data than go through the csv parsing route earlier, so recommend scripting that elsewhere and uploading json file directly. 
1. Populate the data:
```
npm run data
```
End warning

2. Second command (this will create the build with the correct URL):
```
BASEURL=https://baseurl npm run build:prod:url
```

After running these commands, the content for production will be available in the [`_site`](/_site/) folder.


### Asset Bundling with esbuild and autoprefixer

This site uses esbuild and autoprefixer to bundle your SASS/CSS and fingerprint the files in the site build. In addition, esbuild is used to bundle and fingerprint the javascript files.

### Important Consideration
For the asset bundling and fingerprinting features to activate, a specific condition must be met:

Environment Variable Requirement: The process is triggered when an environment variable named ELEVENTY_ENV is set to production.

Ensure that the ELEVENTY_ENV variable is correctly set in your production environment to take advantage of these features.

`process.env.ELEVENTY_ENV=production`

## Styles

## Styling Architecture

All custom styles are found within `site/styles`. Within this directory there is a main scss file `styles.scss` which imports various other partials. Alongside this file are scss files related to specific pages such as the styling for the 404 page.

Within `site/styles/modules` one can find scss files for various global styles such as variables, mixins, and functions. Within this directory is another directory entitled `components`. This directory holds scss files for specific page components/blocks such as the header or hero.

## Updating content and data

### Updating static pages

To update content of the static pages, as the about page, you need to open the html file in the [`site`](/site/) folder and alter content.

At the top file you see 4 parameters: `title`, `description`, `layout` and `permalink`. The `title` and `description` are the values that the static page display to the people. `Layout` assign a layout to the page (you can find all layouts in [`site/_includes/layouts`](/site/_includes/layouts/)). The final parameter, `permalink` is used to assign the permanent link to the static page. 

See more in the [11ty official documentation](https://www.11ty.dev/docs/data-configuration/#:~:text=permalink%3A%20Change%20the%20output%20target%20of%20the%20current,in%20your%20data%2C%20but%20permalink%20is%20an%20exception.).

### Adding and updating

To create the individual exclusion html pages, the project is using a technique called `Pages From Data` that allow us to use a data file and turned into html pages. Read more here: https://www.11ty.dev/docs/pages-from-data/

Warning: this method is deprecated.  We can generate the json elsewhere - python script coming
There are two files you may need to update in the [`/_data/data-transformation/`](/_data/data-transformation/) folder:

- `units.csv`
- `exclusions.csv`

The first is a record of departments, bureaus, and other organizations with a categorical exclusion list. This file has a link to the particular policy, law, regulation, etc and front matter that gives context to the CEs within.

The exclusions file contains individual CEs which relate to a unit.


These files are transformed into `exclusions.json` by the [`transform.js`](/_data/data-transformation/transform.js) script.

Clear exclusions with:

```javascript
npm run data:clear
```

End warning
### Data-driven 11ty Search Index Filter
The search index is generated during the build step via the 11ty filter found here: `filters/exclusionSearchFilter.js`. This filter is set up in `.eleventy.js` and is utilized in the `site/exclusion-search-index.json.njk` template file.
Thanks to this setup the client JS (`js/flexsearch-client.js`) on the site only needs to fetch and load the index instead of having to also generate it from the raw exclusion JSON data. This allows for more efficient client side JS.

Changes to the filter itself would take place in `filters/exclusionSearchFilter.js`. Documentation on the export and import functionality and customizability can be found [here](https://github.com/nextapps-de/flexsearch?tab=readme-ov-file#export).

### Sitemap

The sitemap is gnerated with the `sitemap.xml.njk` file. The code for the `pathPrefix` functionality has been removed, because we will not be leveraging it in this instance. Instead the `BASEURL` environment variable will be used to set the base url for the site, allowing the sitemap to have full URLs.
```javascript
if (process.env.BASEURL) {
    config.addGlobalData('baseUrl', process.env.BASEURL);
}
```

An example of a base url value is in the github workflow configuration.
```
env:
#   ELEVENTY_ENV: production
    BASEURL:
```

## Accessibility Testing

For automated accessibility testing, we are using [Pa11y](https://pa11y.org/). It performs [Section 508](https://section508.gov/manage/improve-digital-dashboard-scores/) accessibility testing.  In order to run it the following can be used.
```
npm run pa11y
```
```
npx pa11y-ci --sitemap https://example.com/sitemap.xml
```
## Linting

ESLint is being used for linting. The configuration file is at `.eslintrc.js` It is using the `xo` linter, because it is the least knit-picky of the available options, having you spend less time focusing on small changes. It is also configured for browser code and commonjs, as that's the system already being used.

To run it locally, you can run `npm run lint`. The `find` command is being used to feed files to `eslint` `find . -type f -not -path './node_modules/*' -not -path '.*.js' -name '*.js`. It gets all JS files, except in `node_modules` and dot files.

## Links

In order to assure there are no broken links, we are running `check-html-links` in the build pipeline. In order to run it the following can be used.
```
npm run links
```
```
npx check-html-links _site/
```

**Notes**
- At the moment when we don't have real data, it is not testing external links. When real data is imported, `--validate-externals` can be added to the script to test external links.
