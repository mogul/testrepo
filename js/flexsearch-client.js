import FlexSearch from "./flexsearch.bundle";
import RenderResults from './modules/renderResults.js'

const dropDownSortList = ["Department of Agriculture",
  "Animal and Plant Health Inspection Service",
  "Agricultural Research Service",
  "Farm Service Agency",
  "Natural Resources Conservation Service",
  "Rural Development",
  "U.S. Forest Service",
  "Department of Commerce",
  "Economic Development Administration",
  "First Responder Network Authority",
  "National Institute of Standards and Technology",
  "National Oceanic and Atmospheric Administration",
  "National Telecommunications and Information Administration",
  "Department of the Interior",
  "Bureau of Indian Affairs",
  "Bureau of Land Management",
  "Bureau of Ocean Energy Management",
  "Bureau of Reclamation",
  "National Park Service",
  "Office of Surface Mining Reclamation and Enforcement",
  "U.S. Fish and Wildlife Service",
  "U.S. Geological Survey",
  "Department of Energy",
  "Department of Transportation",
  "Federal Aviation Administration",
  "Federal Highway Administration",
  "Federal Motor Carrier Safety Administration",
  "Federal Railroad Administration",
  "Federal Transit Administration",
  "Maritime Administration",
  "Pipeline and Hazardous Materials Safety Administration",
  "Saint Lawrence Seaway Development Corporation",
  "U.S. Army Corps of Engineers",
  "Environmental Protection Agency",
  "Federal Energy Regulatory Commission",
  "Nuclear Regulatory Commission",
  "Department of Homeland Security",
  "Customs and Border Protection",
  "Federal Emergency Management Agency",
  "Federal Law Enforcement Training Center",
  "Transportation Security Administration",
  "U.S. Coast Guard",
  "Department of Housing and Urban Development",
  "U.S. Army",
  "U.S. Air Force",
  "Defense Logistics Agency",
  "U.S. Navy",
  "Defense Threat Reduction Agency",
  "Missile Defense Agency",
  "Department of Health and Human Services",
  "Centers for Disease Control and Prevention",
  "Food and Drug Administration",
  "Indian Health Service",
  "National Institutes of Health",
  "Federal Bureau of Prisons",
  "Drug Enforcement Administration",
  "Federal Bureau of Investigation",
  "Immigration and Naturalization Service",
  "Office of Justice Assistance, Research, and Statistics",
  "U.S. Marshals Service",
  "Department of Labor",
  "Department of State",
  "Department of the Treasury",
  "Department of Veterans Affairs",
  "Armed Forces Retirement Home",
  "Consumer Product Safety Commission",
  "Denali Commission",
  "Federal Communications Commission",
  "Federal Deposit Insurance Corporation",
  "Federal Maritime Commission",
  "General Services Administration",
  "International Boundary & Water Commission",
  "National Aeronautics and Space Administration",
  "National Capital Planning Commission",
  "National Endowment for the Humanities",
  "National Science Foundation",
  "Presidio Trust",
  "Gulf Coast Ecosystem Restoration Council",
  "Small Business Administration",
  "Tennessee Valley Authority",
  "U.S. Agency for International Development",
  "U.S. Postal Service"]

const SearchApp = (function () {
  let SearchIndex = "";
  let SearchResults = "";
  let SearchResultsAll = "";
  let FilterResults = "";
  let ResultsSortBy = "";
  let ResultsSortByOrder = "";
  const UnitAllValues = getAllDropdownValues("filter-unit");

  // Add baseUrl detection
  function getBaseUrl() {
    // Try to get baseUrl from meta tag
    const baseUrlMeta = document.querySelector('meta[name="baseUrl"]');
    if (baseUrlMeta) {
      return baseUrlMeta.getAttribute('content');
    }
    // Fallback to base href
    const baseTag = document.querySelector('base');
    if (baseTag) {
      return baseTag.getAttribute('href').replace(/\/$/, '');
    }
    return '';
  }

  // Modified loadIndex function
  function loadIndex() {
    const baseUrl = getBaseUrl();
    // Construct the full URL for the search index
    const searchIndexUrl = `${baseUrl}/data/exclusion-search-index.json`;

    // Fetch Index with full URL
    fetch(searchIndexUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      }).then(data => {
        // Import Index
        SearchIndex = FlexSearch.Document({
          document: {
            id: "id",
            index: [
              "unit",
              "exclusion"
            ],
            store: true,
            tokenize: "reverse"
          }
        });
        const docIndexKeys = Object.keys(data);
        for (const k of docIndexKeys) {
          SearchIndex.import(k, data[k]);
        }
        setUpSearchFormEvents(SearchIndex);
        // setSortSelectedValue();
        search(); //initialize the search screen with some results;
      }).catch(err => {
        console.error(`Error loading index file: ${err}`);
      });
  }


  //Set up all events from search interactions
  function setUpSearchFormEvents(SearchIndex) {
    // const formEl = document.getElementById('search-form');

    //On search event submitted
    document.getElementById('search-form').addEventListener('submit', (event) => {
      //Prevent defaul submit behavior
      event.preventDefault();
      search();
    });
    //Filters events
    document.getElementById('filter-unit').addEventListener('change', (event) => filterResults(event));
    // document.getElementById('filter-workenvironment').addEventListener('change', (event) => filterResults(event));
    // document.getElementById('filter-focusarea').addEventListener('change', (event) => filterResults(event));
    document.getElementById('clear-filters').addEventListener('click', (event) => {
      search();
      reloadFilters();
      RenderResults(SearchResults, ResultsSortBy, ResultsSortByOrder, 0);
    });
    // document.getElementById('sort-results').addEventListener('change', (event) => sortResults(event));
  }

  //Search the index
  //q = Query, if null get the value from search-input element
  function search(q) {

    const inputEl = document.getElementById('search-input');
    const resultsEl = document.querySelector('.search-results');

    //Flex search happen here
    if (q == null) {
      if (inputEl.value == "") {
        q = "ALL"; //Default search;
      }
      else {
        q = inputEl.value;
      }
    }

    let results = "";

    if (q !== "ALL") {
      results = SearchIndex.search(q, { enrich: true, suggest: true }); // Set results limit to 0
    }
    else {
      //Return All values on the index
      results = [{
        field: "all", result: Object.values(SearchIndex["store"]).map(r => {
          return {
            id: r.id,
            doc: r
          }
        })
      }];

    }

    SearchResults = getUniqueResultObjs(results);

    if (Object.keys(SearchResults).length > 0) {
      //This function re-load the filter with the SearchResults values
      reloadFilters();
    }

    RenderResults(SearchResults, ResultsSortBy, ResultsSortByOrder, 0);
  }

  //React at interactions with sort dropdown
  //Depending in the value selected the sort is asc or desc
  function sortResults(event) {

    setSortSelectedValue();

    if (FilterResults !== "") {
      RenderResults(FilterResults, ResultsSortBy, ResultsSortByOrder, 0);
    }
    else {
      RenderResults(SearchResults, ResultsSortBy, ResultsSortByOrder, 0);
    }

  }

  //Action: reload/reset the filters to all values, 
  //for example when clear filter is clicked,
  //or when all filters are unselected. 
  function reloadFilters() {

    //Filters
    const filterUnitEl = document.getElementById('filter-unit');
    // const filterWorkEnvironmentEl = document.getElementById('filter-workenvironment');
    // const filterFocusAreaEl = document.getElementById('filter-focusarea');

    //Given the current search results; get the values for the filters
    let units = [...new Set(Object.values(SearchResults).map(item => item.longUnit))];
    // let workenvironments = [...new Set(Object.values(SearchResults).map(item => item.placement_type))];
    // let focusarea = [...new Set(Object.values(SearchResults).map(item => item.project.focus_area))];

    //Load the values into the filters
    loadFilter(filterUnitEl, units, UnitAllValues);
    // loadFilter(filterWorkEnvironmentEl, workenvironments, WorkEnvironmentAllValues);
    // loadFilter(filterFocusAreaEl, focusarea, FocusAreaAllValues);

    FilterResults = "";

  }

  //When a filter event occur this function reload all the filters
  function filterResults(event) {

    //Filters
    const filterUnitEl = document.getElementById('filter-unit');
    // const filterWorkEnvironmentEl = document.getElementById('filter-workenvironment');
    // const filterFocusAreaEl = document.getElementById('filter-focusarea');

    //Get the selected value of each filter
    let unit = filterUnitEl.options[filterUnitEl.selectedIndex].value;
    // let workenvironment = filterWorkEnvironmentEl.options[filterWorkEnvironmentEl.selectedIndex].value;
    // let focusarea = filterFocusAreaEl.options[filterFocusAreaEl.selectedIndex].value;

    // if (unit === "" && workenvironment === "" && focusarea === "") {
    if (unit === "") {
      search();

      //When all filters are un-selected the result is set back to Search Result
      reloadFilters();

      RenderResults(SearchResults, ResultsSortBy, ResultsSortByOrder, 0);
    }
    else {

      // Apply filters
      // const filteredResults = applyFilters(SearchResults, [['unit', unit], ['placement_type', workenvironment], ['project', ['focus_area', focusarea]]]);
      const filteredResults = applyFilters(SearchResults, [['longUnit', unit]]);

      /*
      Reload the filter to show only values availables when another filter is apply.
      The filters are apply in cascade; selected filter are not reload.
      */
      if (event.target.id !== 'filter-unit' && unit === "") {
        unit = [...new Set(Object.values(filteredResults).map(item => { item.longUnit }))];
        loadFilter(filterUnitEl, unit, UnitAllValues);
      }

      // if(event.target.id !== 'filter-workenvironment' && workenvironment === "") {
      //   workenvironments = [...new Set(Object.values(filteredResults).map(item => item.placement_type))];
      //   loadFilter(filterWorkEnvironmentEl, workenvironments, WorkEnvironmentAllValues);
      // }

      // if(event.target.id !== 'filter-focusarea' && focusarea === "") {
      //   focusarea = [...new Set(Object.values(filteredResults).map(item => item.project.focus_area))];
      //   loadFilter(filterFocusAreaEl, focusarea, FocusAreaAllValues);
      // }

      //This allow to sort filtered results
      FilterResults = filteredResults;

      RenderResults(filteredResults, ResultsSortBy, ResultsSortByOrder, 0);

    }
  }

  //This function apply the filter on the search results when one is selected
  function applyFilters(results, filters) {
    for (const [attribute, value] of filters) {
      if (value !== "") {
        //For filter like focus area that are under the atribute project
        //Ex. When the filter focus area is apply the value is an array with all the values of project,
        //including focus area.
        if (Array.isArray(value)) {
          if (value[1] !== "") {
            results = Object.values(results).filter(r => {
              const rvalue = r[attribute][value[0]].toLowerCase();
              const val = value[1].toLowerCase();
              if (rvalue == val) return true;
              //The data source can contain multiple values separated by "," or ";"
              if (rvalue.split(';').some(s => s.trim() === val)) return true;
              if (rvalue.split(',').some(s => s.trim() === val)) return true;

              return false;
            });
          }
        }
        //For other filters the value is not an array
        //Ex. State and Work Environmens
        //For more context of the data schema check acc_listing_schema.json in this project
        else {
          results = Object.values(results).filter(r => {

            const rvalue = r[attribute].toLowerCase();
            const val = value.toLowerCase();
            if (rvalue == val) return true;
            //The data source can contain multiple values separated by "," or ";"
            if (rvalue.split(';').some(s => s.trim() === val)) return true;
            if (rvalue.split(',').some(s => s.trim() === val)) return true;

            return false;
          });
        }
      }
    }
    // Sort options based on structuredID
    results = results.sort((a, b) => a.structuredID.localeCompare(b.structuredID, 'en', { numeric: true }));

    return results;
  }

  // Remove all options from a dropdown
  function removeAllOptions(element) {

    while (element.options.length > 0) {
      element.remove(0);
    }
  }

  //Load the values to a dropdown filter
  function loadFilter(element, values, allvalues) {

    values = allvalues.filter(A => {

      if (values.some(v => v.trim().toLowerCase() == A.trim().toLowerCase())) return true;

      if (values.some(v => v.split(";").some(w => {
        if (w.trim().toLowerCase() == A.trim().toLowerCase()) return true;
      })
      )) return true;

      if (values.some(v => v.split(",").some(w => {
        if (w.trim().toLowerCase() == A.trim().toLowerCase()) return true;
      })
      )) return true;


      return false;
    });

    // Sort options based on the master list
    values = values.sort((a, b) => {
      return dropDownSortList.indexOf(a) - dropDownSortList.indexOf(b);
    });

    removeAllOptions(element);

    // Create an empty option
    var emptyOption = document.createElement("option");
    emptyOption.value = ""; // Set the value to an empty string
    emptyOption.text = "All"; // Optional: Provide meaningful text

    element.add(emptyOption);

    // Loop through the array using forEach
    values.forEach(function (value) {
      var option = document.createElement("option");
      option.text = option.value = value;
      element.add(option);
    });

  }

  //Get unique values for the result 
  function getUniqueResultObjs(results) {
    const uniqResults = {};
    const resultIds = results.flatMap(r => r.result);

    for (r of resultIds) {
      if (uniqResults[r.id]) continue;

      uniqResults[r.id] = r.doc;
    }

    return uniqResults;
  }

  //Get all the values of a filter dropdown and remove those from the html element
  function getAllDropdownValues(elem) {
    const selectElement = document.getElementById(elem); // Replace "mySelect" with your actual dropdown ID
    const values = Array.from(selectElement.options).map(option => option.value);
    removeAllOptions(selectElement);
    return values;
  }

  function setSortSelectedValue() {
    let elemSort = document.getElementById("sort-results");

    ResultsSortBy = elemSort.options[elemSort.selectedIndex].value;
    ResultsSortByName = elemSort.options[elemSort.selectedIndex].innerHTML;

    if (ResultsSortByName.includes("Latest"))
      ResultsSortByOrder = "desc";
    else
      ResultsSortByOrder = "asc";
  }

  return {
    loadIndex: loadIndex,
    search: search
    // Other public methods...
  };
})();

SearchApp.loadIndex(); // Initialize the app
