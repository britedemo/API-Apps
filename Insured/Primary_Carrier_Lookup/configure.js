// The configuration variables below override the default API authentication behavior.
// If the values are left empty, then automatic authentication will occur using the
// currently authorized user on BriteDemo. If you wish to manually override this to
// use the demo application in your own code, or outside of BriteDemo, simply enter
// your BriteDemo API key with an auth type of 'Token' and the site URL below.

var site_url = ""; // Set the site url here. Leave empty by default.

var apiKey = ""; // Set your BriteDemo API key here. Leave empty by default.

var auth_type = "Token";

function createAPIClient() {
  // Get user session info - DO NOT MODIFY CODE BELOW THIS LINE
  var urlParams = new URLSearchParams(window.location.search);
  var sessionKey = urlParams.get('session');
  var siteURL = urlParams.get('site');
  if (apiKey == "" && sessionKey != null) {
      apiKey = sessionKey;
      if (site_url == "" && siteURL != null) {
          site_url = siteURL;
      }
      window.history.replaceState(null, null, window.location.pathname);
  } else {
      // Get user session from referring url instead
      var urlParams2 = new URLSearchParams(window.frames['document'].referrer);
      sessionKey = urlParams2.get('session');
      siteURL = urlParams2.get('site');
      if (apiKey == "" && sessionKey != null) {
          apiKey = sessionKey;
          if (site_url == "" && siteURL != null) {
              site_url = siteURL;
          }
      } else {
          console.log("Missing authentication information!")
      }
  }
  // Create the API client
  if (site_url != "" && auth_type != "" && apiKey != "") {
    const apiClient = axios.create({
      baseURL: site_url,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: auth_type + " " + apiKey
      }
    });
    return apiClient;
  } else {
    console.log("Missing information needed to authenticate!");
  }
}
