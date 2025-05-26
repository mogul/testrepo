(async function (exclusionsPath, unitsPath, outputPath, jsonSchemaPath) {
  const csv = require('csv-parser');
  const { open } = require('node:fs/promises');
  const { Buffer } = require('node:buffer');
  const { validator } = require('@exodus/schemasafe');
  const ObjectsToCsv = require('objects-to-csv');

  const exclusionsCsv = await open(exclusionsPath);
  const unitsCsv = await open(unitsPath);
  const jsonSchemaFile = await open(jsonSchemaPath, 'r');
  const jsonSchema = await jsonSchemaFile.readFile({ encoding: 'utf8' })
    .then((schema) => JSON.parse(schema));
  const jsonFile = await open(outputPath, 'r+');
  var exclusions = await jsonFile.readFile({ encoding: 'utf8' })
    .then((file) => JSON.parse(file))
    .catch((error) => {
      console.error(error)
    });

  var failures = [];
  // Replace url-exists with our custom utility
  const { urlExists } = require('../../js/utils/url-checker');

  function convertNewlines(data) {
    return data.replaceAll("\n", "<br/>");
  }

  function ensureHttps(url) {
    if (/^http:\/\//i.test(url)) {
      url = url.replace(/^http:\/\//i, 'https://');
    } else if (!/^https:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    return url;
  }

  function ensureHttp(url) {
    if (/^https:\/\//i.test(url)) {
      url = url.replace(/^https:\/\//i, 'http://');
    } else if (!/^http:\/\//i.test(url)) {
      url = 'http://' + url;
    }
    return url;
  }

  // Updated to use Promise-based API from url-checker
  async function checkUrl(url) {
    // First try with HTTPS
    let httpsUrl = ensureHttps(url);
    let exists = await urlExists(httpsUrl);
    if (exists) {
      return httpsUrl;
    }
    
    // If HTTPS fails, try with HTTP
    let httpUrl = ensureHttp(url);
    exists = await urlExists(httpUrl);
    if (exists) {
      return httpUrl;
    }
    
    // If both fail, log and return original URL
    console.log(`Please check this URL: ${url}`);
    return url;
  }

  async function processCsv() {
    const units = {};
    await unitsCsv.createReadStream().pipe(csv({
      headers: ['Identifier', 'Unit', 'Origin', 'Link', 'Text'],
      skipLines: 1
    })).on('data', async (d) => {
      let unit = {
        unit: d['Unit'],
        origin: d['Origin'],
        link: d['Link'],
        context: d['Text']
      };
      if (!(d['Identifier'] in units)) {
        units[d['Identifier']] = unit;
      };
    }).on('end', async () => {
      processCsvExclusions(units);
    });
  };

  async function processCsvExclusions(units) {

    const checkUrlPromises = [];

    await exclusionsCsv.createReadStream().pipe(csv({
      headers: ['Identifier', 'Unit code', 'Additional context', 'Exclusion'],
      skipLines: 1
    })).on('data', async (d) => {
      const checkUrls = async () => {
        const unit = units[d['Unit code']];

        let exclusion = {
          id: Number(d['Identifier']),
          unit: unit['unit'],
          origin: unit['origin'],
          // TKTK don't want to check this here since it will be run for every exclusion
          // instead of only on unit ingest
          // originUrl: await checkUrl(unit['Link']),
          originUrl: unit['link'],
          context: convertNewlines(unit['context']),
          additionalContext: convertNewlines(d['Additional context']),
          exclusion: convertNewlines(d['Exclusion']),
        };
        try {
          const validate = validator(jsonSchema, { includeErrors: true });
          if (!exclusions.some(obj => obj.id === exclusion.id)) {
            if (validate(exclusion)) {
              exclusions.push(exclusion);
            } else {
              let errors = validate.errors;
              failures.push(exclusion);
              for (let i = 0; i < validate.errors.length; i++) {
                let key = validate.errors[i].instanceLocation.replace('#/', '')
                errors[i].value = exclusion[key];
                errors[i].record = exclusion.id;
              }
              exclusion.errors = errors;
              console.log("exclusion failed")
              console.log(errors);
            }
          }
        } catch (error) {
          console.log("error with createReadStream pipe")
          console.error(error);
        }
      }

      checkUrlPromises.push(checkUrls());

    }).on('end', async () => {

      await Promise.all(checkUrlPromises).then(async () => {

        try {
          const csvBuilder = new ObjectsToCsv(failures);
          await csvBuilder.toDisk('_data/data-transformation/failures.csv');
          await jsonFile.truncate();
          await jsonFile.write(JSON.stringify(exclusions), 0, 'utf-8');
        } catch (error) {
          console.log("error with checkUrlPromises end");
          console.error(error);
        } finally {
          jsonSchemaFile?.close();
          exclusionsCsv?.close();
          jsonFile?.close();
        }
      });
    });

  }

  // processCsv(); 
  // commenting this so it won't auto run


})('_data/data-transformation/exclusions.csv', '_data/data-transformation/units.csv', '_data/exclusions.json', '_data/exclusions_schema.json')
