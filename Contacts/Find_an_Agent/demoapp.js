if (window.self !== window.top) {
    // Remove the copyright if in an iFrame
    document.getElementById("copyright").innerHTML = "";
}

const apiClient = createAPIClient();

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
                var payload = JSON.stringify({
                    "max_distance": parseInt($("#maxDistance").val()),
                    "zipcode": $("#zipCode").val(),
                    "results": parseInt($("#maxResults").val())
                });
                this.loading = true;
                apiClient.post('/api/v2/contacts/retrieve_agencies_near_zip', payload)
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
