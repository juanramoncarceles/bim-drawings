function appendSVG(content) {
  document.getElementById('svgContainer').innerHTML = content;
}

function createImg(url) {
  const img = document.createElement('img');
  img.src = url;
  document.getElementById('itemsContainer').appendChild(img);
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
  const pre = document.getElementById('content');
  const textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}