const exclusions = require('./exclusions.json');

//NOTE: this is future functionality b/c any normalized names are currently overwritten by the flexsearch-client
const exclusionsValueEnum = {
  'AFRH - AFRH': "Armed Forces Retirement Home"
}

const buildCategoryDropDownsFromJSON = (json) => {
  const agencyListObject = json.reduce((accum, item) => {
    let unit = item.longUnit;
    if (!accum[unit]) {
      let dropdown = {
        "name": exclusionsValueEnum[unit] ?? unit,
        "value": unit
      }
      accum[unit] = dropdown
    }
    return accum
  }, {})
  return Object.values(agencyListObject).map((value) => value)
}

module.exports = async function () {
  let dropdowns = buildCategoryDropDownsFromJSON(exclusions)
  return {
    "units": dropdowns,
    "sortby": [
      { "name": "Soonest application deadline", "value": "app_end_date" },
      { "name": "Latest application deadline", "value": "app_end_date" },
      { "name": "Soonest start date", "value": "start_date" },
      { "name": "Latest start date", "value": "start_date" }
    ]
  }
}()
