const fs = require('fs/promises');
const path = require('path');
const esbuild = require('esbuild');
const { sassPlugin } = require('esbuild-sass-plugin');

async function createAssetPaths() {
  let pathPrefix = '';

  if (process.env.BASEURL) {
    pathPrefix = process.env.BASEURL;
  }

  const assetPath = path.join(__dirname, '../_site/assets');
  const assetDirs = await fs.readdir(assetPath);
  const assetsFiles = await Promise.all(
    assetDirs.map(async dir => {
      const files = await fs.readdir(
        path.join(__dirname, '../_site/assets', dir),
      );
      return files.map(file => {
        const { name, ext } = path.parse(file);
        const hashedAt = name.lastIndexOf('-');
        const originalName = name.slice(0, hashedAt);
        const key = `${originalName}${ext}`;
        // Add baseUrl to asset paths
        return {
          [key]: `${pathPrefix}/assets/${dir}/${file}`,
        };
      });
    }),
  );

  const assets = Object.assign({}, ...assetsFiles.flat());
  const outputData = path.join(__dirname, '../_data/assetPaths.json');
  return await fs.writeFile(outputData, JSON.stringify(assets, null, 2));
}

async function copyBuildSpecificStyles() {
  const src = path.join(__dirname, `../${process.env.ELEVENTY_DIR}/styles`);
  const dest = path.join(__dirname, `../styles`);
  console.log(`Copying ${src} -> ${dest}`);
  await fs.cp(src, dest, { recursive: true });
}

async function deleteRecursively(targetPath) {
  console.log(`Deleting ${targetPath}`);
  await fs.rm(targetPath, { recursive: true, force: true });
}

async function doBuild() {
  // // Remove any old builds of site
  // await deleteRecursively(path.join(__dirname, `../_site`));

  // // Remove current root styles dir
  // await deleteRecursively(path.join(__dirname, `../styles`));

  // // Copy site specific styles to root styles directory
  // await copyBuildSpecificStyles();

  // Build styles from root styles dir
  esbuild
    .build({
      entryPoints: ['styles/styles.scss', 'js/app.js', 'js/flexsearch.bundle.js', 'js/flexsearch-client.js'],
      entryNames: '[dir]/[name]-[hash]',
      assetNames: '[dir]/[name]-[hash]',
      chunkNames: '[dir]/[name]-[hash]',
      outdir: '_site/assets',
      format: 'iife',
      loader: {
        '.svg': 'dataurl',
        '.png': 'copy',
        '.jpg': 'copy',
        '.ttf': 'copy',
        '.woff': 'copy',
        '.woff2': 'copy',
      },
      minify: process.env.ELEVENTY_ENV === 'production',
      sourcemap: process.env.ELEVENTY_ENV !== 'production',
      target: ['chrome58', 'firefox57', 'safari11', 'edge18'],
      plugins: [
        sassPlugin({
          loadPaths: [
            './node_modules/@uswds',
            './node_modules/@uswds/uswds/packages',
          ],
        })
      ],
      bundle: true,
      // Add public path for assets if baseUrl is set
      publicPath: process.env.BASEURL || undefined,
    })
    .then(async () => {
      await createAssetPaths();
      console.log('Assets have been built!');
      process.exit();
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

doBuild();
