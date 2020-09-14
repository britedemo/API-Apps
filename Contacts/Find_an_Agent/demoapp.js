if(window.self !== window.top) {
    //Remove the copyright if in an iFrame on localhost or britecore domain
    if ((window.location.href.indexOf("localhost:8000") > -1) || (window.location.href.indexOf("127.0.0.1:8000") > -1) ||  (window.location.href.indexOf("204.236.220.13") > -1) || (window.location.href.indexOf("britecore") > -1)) {
        document.getElementById("copyright").innerHTML = "";
    }
}

new Vue({
        delimiters: ['[[', ']]'],
        el: '#demoapp',
        data () {
            return {
                agencies: null,
                message: null,
                loading: false,
                errored: false
            };
        },
        mounted() {
            // Get user session info
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
                    })
            }
        },
        methods: {
            findAgencies: function() {
                // Call the API using Axios
                var api = '/api/v2/contacts/retrieve_agencies_near_zip';
                // Payload
                var payload = JSON.stringify({
                    "max_distance": parseInt($("#maxDistance").val()),
                    "zipcode": $("#zipCode").val(),
                    "results": parseInt($("#maxResults").val())
                });
                var headers = {
                    'Content-Type': 'application/json',
                    'Authorization': auth_type + ' ' + apiKey
                };
                this.loading = true;
                axios
                    .post(site_url + api, payload, {"headers" : headers})
                    .then(response => {
                    this.message = response.data['messages'][0];
                    this.agencies = response.data['data'];
                    // Log the response
                    console.log(response.data['data']);
                    })
                    .catch(error => {
                        console.log(error);
                        this.errored = true;
                    })
                    .finally(() => this.loading = false);
            },
            getMapLink: function(address, city, state, zip) {
                return 'https://www.google.com/maps/place/' + address + ', ' + city + ', ' + state + ' ' + zip;
            }
        }
    });
