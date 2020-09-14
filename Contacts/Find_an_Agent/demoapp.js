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
                    'Authorization': site_token_type + ' ' + site_token
                };
                this.loading = true;
                axios
                    .post(site_url + api, payload, {"headers" : headers})
                    .then(response => {
                    this.message = response.data['messages'][0];
                    this.agencies = response.data['data'];
                    // Log the response
                    parent.console.log(response.data['data']);
                    })
                    .catch(error => {
                        parent.console.log(error);
                        this.errored = true;
                    })
                    .finally(() => this.loading = false);
            },
            getMapLink: function(address, city, state, zip) {
                return 'https://www.google.com/maps/place/' + address + ', ' + city + ', ' + state + ' ' + zip;
            }
        }
    });
