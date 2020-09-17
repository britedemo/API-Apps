// This is a configuration file to override the default API authentication behavior.
// If the values are left empty, then automatic authentication will occur using the
// currently logged in user on BriteDemo. If you wish to manually override this to
// use the demo application in your own code, simply enter your BriteDemo API key
// with an auth type of 'Token' and the site URL below.

function createAPIClient() {
  var site_url = "https://demo.britecore.com";

  var apiKey = ""; // Set your BriteDemo API key here

  var auth_type = "Token";


  // Get user session info - DO NOT MODIFY CODE BELOW THIS LINE
  var urlParams = new URLSearchParams(window.location.search);
  var sessionKey = urlParams.get('session');
  if (apiKey == "" && sessionKey != null) {
      apiKey = sessionKey;
      window.history.replaceState(null, null, window.location.pathname);
  } else {
      // Get user session from referring url instead
      var urlParams2 = new URLSearchParams(window.frames['document'].referrer);
      sessionKey = urlParams2.get('session');
      if (apiKey == "" && sessionKey != null) {
          apiKey = sessionKey;
      } else {
          console.log("Missing authentication token!")
      }
  }

  if (site_url == "") {
    // Use default
    site_url = "https://demo.britecore.com";
  }
  if (auth_type == "") {
    // Use default
    auth_type = "Token";
  }
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
