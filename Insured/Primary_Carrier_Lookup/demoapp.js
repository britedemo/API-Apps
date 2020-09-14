new Vue({
        delimiters: ['[[', ']]'],
        el: '#demoapp',
        data () {
            return {
                carrierName: null,
                carrierAddress: null,
                carrierCityStateZip: null,
                carrierPhone: null,
                loading: false,
                errored: false
            };
        },
        methods: {
            lookupCarrier: function() {
                // Call the API using Axios
                var api = '/api/v2/insured/get_primary_carrier';
                var payload = JSON.stringify({}); // Payload
                var headers = {
                    'Content-Type': 'application/json',
                    'Authorization': site_token_type + ' ' + site_token
                };
                this.loading = true;
                axios
                    .post(site_url + api, payload, {"headers" : headers})
                    .then(response => {
                    this.carrierName = response.data.data.name;
                    this.carrierAddress = response.data.data.addresses[0].address_line1;
                    this.carrierCityStateZip = response.data.data.addresses[0].address_city + ', '
                                                    + response.data.data.addresses[0].address_state + ' '
                                                    + response.data.data.addresses[0].address_zip;
                    this.carrierPhone = response.data.data.phones[0].phone;
                    // Log the JSON response
                    parent.console.log(response.data);
                    })
                    .catch(error => {
                        parent.console.log(error);
                        this.errored = true;
                    })
                    .finally(() => this.loading = false);
            }
        }
    });
