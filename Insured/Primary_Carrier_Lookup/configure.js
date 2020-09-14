// This is a configuration file to override the default API authentication behavior.
// If the values are left empty, then automatic authentication will occur using the
// currently logged in user on BriteDemo. If you wish to manually override this to
// use the demo application in your own code, simply enter your API key and auth
// type and the site URL below.

const site_url = '';
const apiKey = '';
const auth_type = '';

// Get user session info - do not modify
if (site_url == '' || apiKey == '' || auth_type == '') {
    axios
        .get('https://demo.britecore.com/api/demo/auth/session/')
        .then(response => {
            console.log(response.data);
            if (site_url == '') {
                site_url = response.data['site_url'];
            }
            if (apiKey == '') {
                apiKey = response.data['apiKey'];
            }
            if (auth_type == '') {
                auth_type = response.data['auth_type'];
            }
        })
        .catch(error => {
            console.log(error);
            // Try local instance instead
            axios
                .get('http://127.0.0.1:8000/api/demo/auth/session/')
                .then(response => {
                    console.log(response.data);
                    if (site_url == '') {
                        site_url = response.data['site_url'];
                    }
                    if (apiKey == '') {
                        apiKey = response.data['apiKey'];
                    }
                    if (auth_type == '') {
                        auth_type = response.data['auth_type'];
                    }
                })
                .catch(error => {
                    console.log(error);
                })
        })
}
