/**
* Get the URL parameters.
* source: https://css-tricks.com/snippets/javascript/get-url-variables/
* @param  {String} url The URL
* @return {Object}     The URL parameters
*/
function getUrlParams(url) {
  const params = {};
  const parser = document.createElement('a');
  parser.href = url;
  const vars = parser.search.substring(1).split('&');
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=');
    params[pair[0]] = decodeURIComponent(pair[1]);
  }
  return params;
};



function startPage() {

  // Get the URL params
  const resourceId = getUrlParams(window.location.href).id;

  if (resourceId) {
    readFileContent(resourceId);
  } else { // Case that someone authenticated access secondPage.html without parameter 
    // Show a form / button to upload your project... or go to your list of projects to pick one ?
    console.log('Redirect to list of projects or show it here on a modal ?');
    // window.location.replace("index.html");
  }
}
