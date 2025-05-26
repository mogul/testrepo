
let ResultsSortBy = "";
let SearchResults = "";
let ResultsPage = 0;

function custom_sort_desc(a, b, order) {

  if (ResultsSortBy.includes("date")) {
    return new Date(b[ResultsSortBy]).getTime() - new Date(a[ResultsSortBy]).getTime();
  }
  else {
    const valueA = a[ResultsSortBy].toLowerCase(); // Convert to lowercase for case-insensitive sorting
    const valueB = b[ResultsSortBy].toLowerCase();

    return valueB.localeCompare(valueA);
  }
}

function custom_sort_asc(a, b, order) {

  if (ResultsSortBy.includes("date")) {

    return new Date(a[ResultsSortBy]).getTime() - new Date(b[ResultsSortBy]).getTime();
  }
  else {
    const valueA = a[ResultsSortBy].toLowerCase(); // Convert to lowercase for case-insensitive sorting
    const valueB = b[ResultsSortBy].toLowerCase();

    return valueA.localeCompare(valueB);

  }
}

function getSlug(result) {

  return result.longUnit
    .toLowerCase()
    .replace(/[\s\W-]+/g, '-')  // Replace spaces and non-word characters with hyphens
    .replace(/^-+|-+$/g, '');  // Remove leading and trailing hyphens
}


function chunkObject(obj, chunkSize) {
  const keys = Object.keys(obj);
  const result = [];

  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunkKeys = keys.slice(i, i + chunkSize);
    const chunk = {};

    for (const key of chunkKeys) {
      chunk[key] = obj[key];
    }

    result.push(chunk);
  }

  return result;
}

function goNextPage(e, SearchResults, sortBy, order) {

  ResultsPage = document.querySelector(`.current-page`).innerHTML - 1;

  if (ResultsPage < e.target.dataset.lastpage) {
    ResultsPage++;
    RenderResults(SearchResults, sortBy, order, ResultsPage);
  }
}

function goPrevPage(e, SearchResults, sortBy, order) {

  ResultsPage = document.querySelector(`.current-page`).innerHTML - 1;

  if (ResultsPage <= e.target.dataset.lastpage) {
    ResultsPage--;
    RenderResults(SearchResults, sortBy, order, ResultsPage);
  }
}

//If it's a mobile device, this function return the 
//number of milliseconds to wait before showing something
function howMuchToWait() {
  if (window.innerWidth < 768)
    return 500;
  else return 0;
}

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

export default async function RenderResults(uniqResults, sortBy, order = "asc", page = 0) {

  SearchResults = uniqResults;

  if (Object.keys(uniqResults).length === 0) {
    //if there are not results


    document.querySelector('.number-of-positions').innerHTML = `<div class="filters-block__listings__positions__loading-spin"></div> Updating`;



    setTimeout(() => {
      document.querySelector('.number-of-positions').innerHTML = `0 listings`;
    }, howMuchToWait(), num_of_listings = uniqResults.length); // Delay of 500 milliseconds (half a second)



    document.querySelector('.search-results').innerHTML = `
                                                            <div class="not-found-content">
                                                                <h2>No listings found for your search</h2>
                                                                <p>
                                                                  Try another search or <a id="view-all-search" href="/search">view all listings</a>.
                                                                </p>
                                                                <p>
                                                                  <a href="/search-tips/">View search tips</a>.
                                                                </p>
                                                            </div>
                                                          `;
    document.getElementById('result-pagination').innerHTML = ``;
  }
  else {

    // // If the application window has expired we don't want to show the job
    uniqResults = Object.values(uniqResults);
    // uniqResults = Object.values(uniqResults).filter(result => {

    //   // let jobEnd = new Date(result.app_end_date);
    //   let jobEnd = CalculateEndDate(result.app_end_date,"Miliseconds");
    //   // Add (23 hours - 1 minute) of milliseconds to the job end time so that it expires at 11:59pm in the tz of the user
    //   // jobEnd = jobEnd.setTime(jobEnd.getTime() + 86340000);

    //   // Go ahead an show the job if there's some kind of issue determining the end date
    //   if (isNaN(jobEnd)) {
    //     return true
    //   }

    //   const now = new Date().getTime();

    //   return now <= jobEnd
    // });

    ResultsSortBy = sortBy;

    if (ResultsSortBy !== "") {
      if (order == "asc")
        uniqResults = uniqResults.sort(custom_sort_asc);
      else
        uniqResults = uniqResults.sort(custom_sort_desc);
    }

    document.querySelector('.number-of-positions').innerHTML = `<div class="filters-block__listings__positions__loading-spin"></div> Updating`;

    setTimeout(() => {
      document.querySelector('.number-of-positions').innerHTML = `${num_of_listings} listings`;
    }, howMuchToWait(), num_of_listings = uniqResults.length); // Delay of 500 milliseconds (half a second)

    document.getElementById('result-pagination').innerHTML = ``;

    if (uniqResults.length > 10) {
      //Pagination 

      const pages = chunkObject(uniqResults, 10);

      document.getElementById('result-pagination').innerHTML = `<nav aria-label="Pagination" class="usa-pagination">
                                                                  <ul class="usa-pagination__list"></ul>
                                                                </nav>`;

      for (let i = 0; i < pages.length; i++) {

        //First and last page
        if (i === 0
          || i === pages.length - 1
          || (i === page && pages.length >= 3)
          || (i === page - 1 && pages.length >= 3)
          || (i === page + 1 && pages.length >= 3)
        ) {

          //Prev item
          if (i === 0 && page !== 0 && pages.length > 1) {
            document.querySelector('.usa-pagination > ul').innerHTML += `
              <li class="usa-pagination__item usa-pagination__arrow">
              <a
                href="javascript:void(0);"
                class="usa-pagination__link usa-pagination__previous-page"
                data-lastpage="${pages.length - 1}"
                aria-label="Next page">
                <span class="usa-pagination__link-text" data-lastpage="${pages.length - 1}">Previous</span>
                </a>
            </li>
            `;
          }

          document.querySelector('.usa-pagination > ul').innerHTML += `
            <li class="usa-pagination__item usa-pagination__page-no ${i === page ? 'usa-current' : ''}">
            <a
              href="javascript:void(0);"
              class="usa-pagination__button ${i === page ? 'current-page' : ''}"
              aria-label="Page ${i + 1}"
              >${i + 1}</a
            >
          </li>
          `;
          //Next item
          if (i > 0 && i === pages.length - 1 && page !== pages.length - 1 && pages.length > 1) {
            document.querySelector('.usa-pagination > ul').innerHTML += `
              <li class="usa-pagination__item usa-pagination__arrow">
              <a
                href="javascript:void(0);"
                class="usa-pagination__link usa-pagination__next-page"
                data-lastpage="${pages.length - 1}"
                aria-label="Next page">
                <span class="usa-pagination__link-text" data-lastpage="${pages.length - 1}">Next</span>
                </a>
            </li>
            `;
          }
        }
        else {
          //First ...
          if ((i === 1 && pages.length > 3)
            || (i === pages.length - 2 && pages.length > 3)
          ) {
            document.querySelector('.usa-pagination > ul').innerHTML += `
              <li
              class="usa-pagination__item usa-pagination__overflow"
              aria-label="ellipsis indicating non-visible pages"
              >
                <span>…</span>
              </li>
            `;
          }
        }
      }

      const numberOfPositionsElement = document.querySelector('.number-of-positions');

      document.querySelectorAll(`.usa-pagination__button`).forEach(b => {
        b.addEventListener('click', (e) => {
          numberOfPositionsElement.scrollIntoView('{behavoir: "smooth"}');
          ResultsPage = e.target.innerHTML - 1;
          RenderResults(SearchResults, sortBy, order, ResultsPage);
        });
      });

      document.querySelectorAll(`.usa-pagination__next-page`).forEach(b => {
        b.addEventListener('click', (e) => {
          goNextPage(e, SearchResults, sortBy, order); // Pass the event object to your function
          numberOfPositionsElement.scrollIntoView('{behavoir: "smooth"}');
        });
      });

      document.querySelectorAll(`.usa-pagination__previous-page`).forEach(b => {
        b.addEventListener('click', (e) => {
          goPrevPage(e, SearchResults, sortBy, order); // Pass the event object to your function
          numberOfPositionsElement.scrollIntoView('{behavoir: "smooth"}');
        });
      });

      uniqResults = pages[page];

    }
    else {
      document.getElementById('result-pagination').innerHTML = "";
    }



    document.querySelector('.search-results').innerHTML = `<ul class="usa-card-group"></ul>`;

    for (key in uniqResults) {
      const baseUrl = getBaseUrl();
      let result = uniqResults[key]
      let slug = getSlug(result);
      const { id, longUnit, origin, originUrl, context, additionalContext, exclusion } = result;

      document.querySelector('.search-results > ul').innerHTML += `
                                                                    <li class="result-card-container">
                                                                      <div class="result-card-container-header">
                                                                        <h2><a href=${baseUrl}/exclusions/${slug}-${id}.html>${longUnit}</a></h2>
                                                                      </div>
                                                                      <div class="result-card-container-body height-card overflow-x-hidden">
                                                                        <span class="result-card-container__body-info">${origin}</span>
                                                                        ${exclusion}
                                                                      </div>
                                                                      <div class="result-card-container-footer">
                                                                        <a class="usa-button" href=${baseUrl}/exclusions/${slug}-${id}.html class="usa-button">
                                                                          Learn more
                                                                        </a>
                                                                      </div>
                                                                    </li>
                                                                  `;

    }

  }


}
