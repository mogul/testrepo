# Data Transformation components
1. `listing_schema.json`

    * Description: This file defines the data schema used for validation during the transformation process.

    * Purpose: It ensures that the transformed data adheres to the expected structure.

    * Usage: The transformation process validates input data against this schema.

2. `data-transformation/transform.js`

    * Description: This script handles the transformation of CSV data from the source into a JSON file.

    * Purpose: It prepares the data for creating HTML pages in the project.

    * Usage: Execute this script to convert the input CSV (opportunities.csv) into the desired JSON format.

3. `opportunities.csv`

    * Description: This is the input file containing raw data.

    * Purpose: It serves as the source data for the transformation process.

    * Usage: Ensure this file contains the relevant information you want to process.

4. `failure.csv`

    * Description: Records that failed the validation process are stored in this file.

    * Purpose: It helps track problematic data points.

    * Usage: Review this file to identify validation failures.

5. `clear-opportunities.js`

    * Description: A helper script to clear the opportunities.json file.

    * Purpose: When the JSON file is not clear, old records are not inserted. Use this script to reset it.

    * Usage: Run this script before updating old records to ensure a clean slate.

6. `opportunities.json`

     * Description: The output file containing transformed data.

     * Purpose: It holds the processed data in JSON format.

     * Location: Saved in /site/_data/opportunities.json.