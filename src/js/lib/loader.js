'use strict';

let isLoaded = false;

// DynamicLoader object to manage loading process
const DynamicLoader = {
  // Default onLoad function (no-op)
  onLoad: () => {},

  // Register a callback for when loading is done
  done(callback) {
    if (isLoaded) {
      // If already loaded, execute the callback immediately
      callback();
    } else {
      // Otherwise, set the callback to be executed later
      this.onLoad = callback;
    }
  }
};

// Function to load external content specified in 'extern' tags
const loadExternalContent = () => {
  // Get all 'extern' tags in the document
  const externalTags = document.getElementsByTagName('extern');
  let loadedCount = 0;                      // Counter for loaded content
  const totalCount = externalTags.length;   // Total number of external tags

  // Iterate over all external tags
  Array.from(externalTags).forEach(externalTag => {
    // Create a new XMLHttpRequest
    const xhr = new XMLHttpRequest(); 

    // Define what happens when the request state changes
    xhr.onreadystatechange = () => {
      // If request is complete
      if (xhr.readyState !== 4) return;

      // If request is successful
      if (xhr.status === 200) {
        insertContent(xhr.responseText, externalTag); // Insert the fetched content
      }

      // If all external content has been loaded, call onLoad callback
      if (++loadedCount === totalCount) {
        DynamicLoader.onLoad();
        isLoaded = true;
      }
    };

    // Initialize the request
    xhr.open('GET', externalTag.getAttribute('src'), true);
    xhr.send(); // Send the request
  });
};

// Function to insert fetched content into the DOM
const insertContent = (content, externalTag) => {
  // Create a temporary div to hold the content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;

  // Insert the temporary div's content after the externalTag
  externalTag.parentNode.insertBefore(tempDiv, externalTag.nextSibling);
  externalTag.parentNode.removeChild(externalTag);

  // Move content from the temporary div to its parent node
  while (tempDiv.childNodes.length > 0) {
    tempDiv.parentNode.insertBefore(tempDiv.childNodes[0], tempDiv.nextSibling);
  }
  tempDiv.parentNode.removeChild(tempDiv); // Remove the temporary div
};

// Load external content when the document is ready
if (document.readyState === 'complete') {
  loadExternalContent();
} else {
  window.addEventListener('load', loadExternalContent);
}

export default DynamicLoader;
