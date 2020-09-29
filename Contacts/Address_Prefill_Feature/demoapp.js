if (window.self !== window.top) {
    // Remove the copyright if in an iFrame
    document.getElementById("copyright").innerHTML = "";
}

new Vue({
        delimiters: ['[[', ']]'],
        el: '#demoapp',
        data () {
            return {
                cities: null,
                cityList: '',
                countyList: '',
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
                    'Authorization': auth_type + ' ' + apiKey
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
                    console.log(response.data);
                    // Set default values for cities and counties
                    var cityString = this.cities[0];
                    var countyString = this.counties[0].name;
                    this.cityList = cityString.toString();
                    this.countyList = countyString.toString();
                    })
                    .catch(error => {
                        console.log(error);
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
