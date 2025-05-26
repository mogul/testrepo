// filters/exclusionSearchFilter.js
const { Document } = require("flexsearch");

module.exports = async function (exclusions) {
  // Create new document index
  const index = new Document({
    document: {
      id: "id",
      index: [
        "unit",
        "exclusion",
      ],
      store: true,
      tokenize: "forward"
    }
  });

  try {
    // Add collection items to index
    let id = 0;
    let removedIds = [];
    
    for (const e of exclusions) {
      try {
        index.add(id, e);
        id++;
      } catch (err) {
        console.error(`Error adding document ${id}:`, err);
        removedIds.push(id);
      }
    }

    console.log("Removed Records:", removedIds);

    // Export index as one file
    let indexObj = {};
    
    await index.export((key, data) => {
      indexObj[key] = data;
    });

    return indexObj;
  } catch (error) {
    console.error("Error in exclusionSearchFilter:", error);
    return exclusions; // Return original data as fallback
  }
};
