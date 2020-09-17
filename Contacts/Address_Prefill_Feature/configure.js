// This is a configuration file to override the default API authentication behavior.
// If the values are left empty, then automatic authentication will occur using the
// currently logged in user on BriteDemo. If you wish to manually override this to
// use the demo application in your own code, simply enter your BriteDemo API key
// and with an auth type of 'Token' and the site URL below.

var site_url = 'https://demo.britecore.com';

var apiKey = ''; // Set your BriteDemo API key here

var auth_type = 'Token';


// Get user session info - DO NOT MODIFY CODE BELOW THIS LINE
var urlParams = new URLSearchParams(window.location.search);
var headers = null;
var session = urlParams.get('session');
if (session != null) {
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Token ' + session
    };
    window.history.replaceState(null, null, window.location.pathname);
} else {
  // Get user session from referring url instead
  var urlParams2 = new URLSearchParams(window.frames['document'].referrer);
  session = urlParams2.get('session');
  headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Token ' + session
  };
}

if (site_url === '' || apiKey === '' || auth_type === '') {
    axios
        // Try the main site
        .get('https://demo.britecore.com/api/demo/auth/session/', {"headers" : headers})
        .then(response => {
            console.log(response.data);
            if (site_url === '') {
                this.site_url = response.data['site_url'];
            }
            if (apiKey === '') {
                this.apiKey = response.data['apiKey'];
            }
            if (auth_type === '') {
                this.auth_type = response.data['auth_type'];
            }
        })
        .catch(error => {
            console.log(error);
            // Try local instance instead
            axios
                .get('http://127.0.0.1:8000/api/demo/auth/session/', {"headers" : headers})
                .then(response => {
                    console.log(response.data);
                    if (site_url === '') {
                        this.site_url = response.data['site_url'];
                    }
                    if (apiKey === '') {
                        this.apiKey = response.data['apiKey'];
                    }
                    if (auth_type === '') {
                        this.auth_type = response.data['auth_type'];
                    }
                })
                .catch(error => {
                    console.log(error);
                })
        })
}
