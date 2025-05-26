const validateSchema = require('xsd-validator').default;
const fs = require('fs');
const https = require('https');
const xml = fs.readFileSync('_site/sitemap.xml').toString();


const req = https.get('https://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd', (res) => {
  const { statusCode } = res;
  let xsd = '';

  res.on('data', (chunk) => { xsd += chunk })
  res.on('end', () => {
    const valid = validateSchema(xml, xsd);
    if(valid != true) {
      console.error(valid);
    }
  });
  
});

req.on('error', (error) => {
  console.error(error);
});

req.end();
