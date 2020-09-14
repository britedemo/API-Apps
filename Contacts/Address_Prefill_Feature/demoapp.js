new Vue({
        delimiters: ['[[', ']]'],
        el: '#demoapp',
        data () {
            return {
                cities: null,
                counties: null,
                latitude: null,
                longitude: null,
                loading: false,
                errored: false
            };
        },
        methods: {
            lookupAddress: function() {
                // Call the API using Axios
                var api = '/api/v2/contacts/retrieveAddressInfo';
                var payload = JSON.stringify({
                    "stateAbbr": $("#stateSelect").val(),
                    "zip": $("#zipCode").val(),
                    "addressLine1": $("#streetAddress").val()
                });
                var headers = {
                    'Content-Type': 'application/json',
                    'Authorization': site_token_type + ' ' + site_token
                };
                this.loading = true;
                axios
                    .post(site_url + api, payload, {"headers" : headers})
                    .then(response => {
                    // Handle response
                    this.cities = response.data['cities'];
                    this.counties = response.data['counties'];
                    this.latitude = response.data['location'].latitude;
                    this.longitude = response.data['location'].longitude;
                    // Log the JSON response
                    parent.console.log(response.data);
                    })
                    .catch(error => {
                        parent.console.log(error);
                        this.errored = true;
                    })
                    .finally(() => this.loading = false);
            }
        },
        computed: {
            getMap: function() {
                return '<iframe src="https://maps.google.com/maps?q=' + this.latitude + ',' + this.longitude + '&t=&z=15&ie=UTF8&iwloc=&output=embed" width="500px" height="400px" frameborder="0" style="border:1px solid lightgray;" allowfullscreen></iframe>';
            }
        }
    });
