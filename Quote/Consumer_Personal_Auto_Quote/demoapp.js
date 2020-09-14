if (window.self !== window.top) {
    // Remove the copyright if in an iFrame
    document.getElementById("copyright").innerHTML = "";
}

var session = {
    zip_code: null,
    effective_date: null,
    expiration_date: null,
    address_info: null,
    street_address: null,
    city: null,
    state: null,
    today: null,
    quotable_products: null,
    product_version_id: null,
    product_version_name: null,
    selected_product: null,
    policy_risk_types: null,
    quote_info: null,
    quote_number: null,
    quote_risks: null,
    contact_first_name: null,
    contact_middle_name: null,
    contact_last_name: null,
    contact_phone_number: null,
    contact_email: null,
    driver_name: null,
    driver_name_id: null,
    driver_dob: null,
    driver_age_limit_date: null,
    driver_risk_types: null,
    driver_gender: null,
    driver_marital_status: null,
    driver_good_student: null,
    driver_training: null,
    driver_senior: null,
    vehicle_risk_types: null,
    vehicle_vin: null,
    vehicle_make: null,
    vehicle_model: null,
    vehicle_model_year: null,
    vehicle_mileage: null,
    vehicle_rating_tier: null,
    vehicle_territory: null,
    vehicle_use: null,
    vehicle_performance: null,
    update_quote_risks_response: null,
    add_driver_risk_response: null,
    update_driver_risk_response: null,
    add_vehicle_risk_response: null,
    update_vehicle_risk_response: null,
    add_comprehensive_response: null,
    remove_comprehensive_response: null,
    add_collision_response: null,
    remove_collision_response: null,
    add_additional_equipment_response: null,
    remove_additional_equipment_response: null,
    add_transportation_response: null,
    remove_transportation_response: null,
    add_towing_response: null,
    remove_towing_response: null,
    summary: null,
    submit_response: null,
    q1: null,
    q2: null,
    q3: null,
    q4: null,
    q5: null,
    q6: null
}

var formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

var numberFormat = new Intl.NumberFormat();

const apiClient = axios.create({
  baseURL: site_url,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Authorization': auth_type + ' ' + apiKey
  }
});

const Start = {
    template: `
        <div class="row justify-content-center mt-2">
            <div class="col-md-7">
                <div class="form-group">
                    <center>
                        <h5 class="text-center" id="quoteHeader">Enter your Zip Code to get started...</h5>
                        <input type="text" class="form-control input-lg" style="text-align:center; width: 8rem;" id="zipCode" minlength="5" maxlength="5" required>
                        <small class="text-danger" style="display: none;" id="zipError">Enter 5 digit zip code</small><br>
                        <button class="btn btn-primary" @click="validateZip">Get Quote</button>
                    </center>
                </div>
            </div>
        </div>
    `,
    methods: {
        validateZip: function() {
            session.zip_code = document.getElementById('zipCode').value;

            // Validate zip code
            if(session.zip_code === '') {
                document.getElementById('zipCode').style.borderColor = "red";
                document.getElementById('zipError').style.display = "block";
            } else {
                this.$router.push('/effective');
            }
        }
    }
};

const Effective = {
    template: `
        <div class="row justify-content-center mt-2">
            <div class="col-md-7">
                <div class="form-group">
                    <center>
                        <div class="text-center" id="quoteHeader"><h5>Checking locations...</h5><br><br><i class="fa fa-spinner fa-pulse fa-4x fa-fw"></i></div>
                        <input type="date" class="form-control input-lg" style="display: none; text-align:center; width: 12rem;" id="effectiveDate" required>
                        <small class="text-danger" style="display: none;" id="effDateError">Enter a valid date</small><br>
                        <button class="btn btn-primary" id="effBtn" style="display: none;" @click="validateEffectiveDate">Continue</button>
                    </center>
                </div>
            </div>
        </div>
    `,
    created() {
        if (session.zip_code !== null) {
            payload = JSON.stringify({
                "zip": session.zip_code
            });
            console.log('POST: ' + '/api/v1/contacts/retrieveAddressInfoFromZip');
            console.log('PAYLOAD: ' + payload);
            apiClient.post('/api/v1/contacts/retrieveAddressInfoFromZip', payload)
                .then(response => {
                    console.log(response.data);
                    session.address_info = response.data;
                    for (var key in session.address_info) {
                        // Store the city and state for later
                        if (key === 'cities') {
                            session.city = session.address_info[key][0];
                        }
                        if (key === 'stateAbbr') {
                            session.state = session.address_info[key];
                        }
                    }
                    document.getElementById('quoteHeader').innerHTML = "<h5>When do you need coverage to start?</h5>";
                    document.getElementById('effectiveDate').style.display = "block";
                    document.getElementById('effBtn').style.display = "block";
                    // Limit to only today or in the future
                    session.today = new Date();
                    var dd = session.today.getDate();
                    var mm = session.today.getMonth() + 1; //January is 0!
                    var yyyy = session.today.getFullYear();
                    if(dd < 10){
                        dd= '0' + dd;
                    }
                    if(mm < 10){
                       mm = '0' + mm;
                    }
                    session.today = yyyy + '-' + mm + '-' + dd;
                    document.getElementById("effectiveDate").setAttribute("min", session.today);
                })
                .catch(error => {
                    console.log('There was an error:', error.response);
                });
        }
    },
    mounted() {
        // Set default to today
        document.getElementById('effectiveDate').valueAsDate = new Date();
    },
    methods: {
        validateEffectiveDate: function () {
            session.effective_date = document.getElementById('effectiveDate').value;
            // Cannot be earlier than today
            if (session.effective_date < session.today) {
                session.effective_date = '';
                document.getElementById('effectiveDate').value = '';
            }

            // Determine expiration date (1 Year Term)
            if (session.effective_date !== null) {
                expire_date = new Date(session.effective_date);
                expire_date.setFullYear(expire_date.getFullYear() + 1);
                expire_date.setDate(expire_date.getDate() + 1);
                month = '' + (expire_date.getMonth() + 1);
                day = '' + expire_date.getDate();
                year = expire_date.getFullYear();
                if (month.length < 2)
                    month = '0' + month;
                if (day.length < 2)
                    day = '0' + day;
                session.expiration_date = [year, month, day].join('-');
            }

            // Validate effective date
            if(session.effective_date === '' || session.effective_date === null) {
                document.getElementById('effectiveDate').style.borderColor = "red";
                document.getElementById('effDateError').style.display = "block";
            } else {
                this.$router.push('/products');
            }
        }
    }
};

const Products = {
    template: `
        <div class="row justify-content-center mt-2">
            <div class="col-md-8">
                <div class="form-group">
                    <center>
                        <div class="text-center" id="quoteHeader"><h5>Looking for available coverages...</h5><br><br><i class="fa fa-spinner fa-pulse fa-4x fa-fw"></i></div>
                    </center>
                    <div class="card-deck justify-content-center">
                        <a href="#" data-toggle="tooltip" title="Homeowners" disabled>
                            <div class="card pd-2 m-2 text-center text-dark" id="Homeowners" style="width: 8rem; display: none;">
                                <div class="card-body text-muted">
                                    <i class="fa fa-home fa-4x" aria-hidden="true" disabled></i>
                                </div>
                            </div>
                        </a>
                        <a href="#" data-toggle="tooltip" title="Personal Auto"  @click="createQuote('generalAutoCW')">
                            <div class="card pd-2 m-2 border-dark text-center text-dark" id="PersonalAuto" style="width: 8rem; display: none;">
                                <div class="card-body">
                                    <i class="fa fa-car fa-4x" aria-hidden="true"></i>
                                </div>
                            </div>
                        </a>
                        <a href="#" data-toggle="tooltip" title="Commercial Auto" disabled>
                            <div class="card pd-2 m-2 text-center text-dark" id="CommercialAuto" style="width: 8rem; display: none;">
                                <div class="card-body text-muted">
                                    <i class="fa fa-truck fa-4x" aria-hidden="true"></i>
                                </div>
                            </div>
                        </a>
                        <a href="#" data-toggle="tooltip" title="Personal Umbrella" disabled>
                            <div class="card pd-2 m-2 text-center text-dark" id="Umbrella" style="width: 8rem; display: none;">
                                <div class="card-body text-muted">
                                    <i class="fa fa-umbrella fa-4x" aria-hidden="true"></i>
                                </div>
                            </div>
                        </a>
                        <a href="#" data-toggle="tooltip" title="Pet Insurance" disabled>
                            <div class="card pd-2 m-2 text-center text-dark" id="Pet" style="width: 8rem; display: none;">
                                <div class="card-body text-muted">
                                    <i class="fa fa-paw fa-4x" aria-hidden="true"></i>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `,
    mounted() {
        document.getElementById('quoteHeader').innerHTML = "<h5>Looking for available coverages in " + session.city + ', ' + session.state + "...</h5><br><br><i class=\"fa fa-spinner fa-pulse fa-4x fa-fw\"></i>";
        console.log('GET: ' + '/api/quote/quotable-products/');
        apiClient.get('/api/quote/quotable-products/')
            .then(response => {
                console.log(response.data);
                session.quotable_products = response.data;
                if (session.quotable_products !== null) {
                    document.getElementById('quoteHeader').innerHTML = "<h5>What type of insurance coverage do you need?</h5><br>";
                    for (var key in session.quotable_products) {
                        // Show homeowners
                        if (session.quotable_products[key].label.includes("Homeowners")) {
                            document.getElementById('Homeowners').style.display = "block";
                        }
                        // Show personal auto
                        if (session.quotable_products[key].label.includes("General Auto")) {
                            session.product_version_id = session.quotable_products[key].version['id'];
                            session.product_version_name = session.quotable_products[key].version['name'];
                            document.getElementById('PersonalAuto').style.display = "block";
                        }
                        // Show commercial auto
                        if (session.quotable_products[key].label.includes("Commercial Auto")) {
                            document.getElementById('CommercialAuto').style.display = "block";
                        }
                        // Show personal umbrella
                        if (session.quotable_products[key].label.includes("Umbrella")) {
                            document.getElementById('Umbrella').style.display = "block";
                        }
                        // Show pet insurance
                        if (session.quotable_products[key].label.includes("Pet")) {
                            document.getElementById('Pet').style.display = "block";
                        }
                    }
                } else {
                    document.getElementById('quoteHeader').innerHTML = "<h4>Oops! It looks like we currently have no insurance coverages available.</h4>";
                }

            })
            .catch(error => {
                console.log('There was an error:', error.response);
            });
    },
    methods: {
        createQuote: function(prod_name) {
            session.selected_product = prod_name;
            document.getElementById('quoteHeader').innerHTML = "<h5>Creating personal auto quote...</h5><br><br><i class=\"fa fa-spinner fa-pulse fa-4x fa-fw\"></i>";
            document.getElementById('Homeowners').style.display = "none";
            document.getElementById('PersonalAuto').style.display = "none";
            document.getElementById('CommercialAuto').style.display = "none";
            document.getElementById('Umbrella').style.display = "none";
            document.getElementById('Pet').style.display = "none";
            payload = JSON.stringify({
                "effective_date": session.effective_date,
                "expiration_date": session.expiration_date,
                "product_name": session.selected_product,
            });
            console.log('POST: ' + '/api/quote/');
            console.log('PAYLOAD: ' + payload);
            apiClient.post('/api/quote/', payload)
                .then(response => {
                    console.log(response.data);
                    session.quote_info = response.data;
                    session.quote_number = session.quote_info['quote_number'];
                    this.$router.push('/contact');
                })
                .catch(error => {
                    console.log('There was an error:', error.response);
                });
        }
    }
};

const Contact = {
    template: `
        <div class="text-left w-25 mx-auto mb-3">
            <div id="quoteHeader"><h5>Who is this coverage for?</h5><br></div>
            <div class="form-group">
                <label><b>First Name:</b></label><input type="text" class="form-control" id="contactFirstName" required><br>
                <label>Middle Name: <small class="text-muted">(Optional)</small></label><input type="text" class="form-control" id="contactMiddleName" required><br>
                <label><b>Last Name:</b></label><input type="text" class="form-control" id="contactLastName" required><br>
                <label><b>Street Address:</b></label><input type="text" class="form-control" id="contactStreet" required><br>
                <label><b>City:</b></label><input type="text" class="form-control" id="contactCity" required><br>
                <label><b>State:</b></label><input type="text" class="form-control" id="contactState" minlength="2" maxlength="2" required><br>
                <label><b>Zip Code:</b></label><input type="text" class="form-control" id="contactZip" minlength="5" maxlength="5" required><br>
                <label><b>Phone Number:</b></label><input type="tel" class="form-control" id="contactPhone" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" required><br>
                <label><b>Email:</b></label><input type="email" class="form-control" id="contactEmail" required>
                <hr>
                <button class="btn btn-primary" @click="validateContact">Continue</button>
                <button class="btn btn-normal" @click="$router.push('/products')">Back</button>
            </div>
        </div>
    `,
    mounted() {
        // Prefill partial location info
        document.getElementById('contactFirstName').value = session.contact_first_name;
        document.getElementById('contactMiddleName').value = session.contact_middle_name;
        document.getElementById('contactLastName').value = session.contact_last_name;
        document.getElementById('contactStreet').value = session.street_address;
        document.getElementById('contactCity').value = session.city;
        document.getElementById('contactState').value = session.state;
        document.getElementById('contactZip').value = session.zip_code;
        document.getElementById('contactPhone').value = session.contact_phone_number;
        document.getElementById('contactEmail').value = session.contact_email;

        // Get policy risk types
        console.log('GET: ' + '/api/lines/products/' + session.selected_product + '/risk-types/policy/state/?version_id=' + session.product_version_id + '&type=minimal');
        apiClient.get('/api/lines/products/' + session.selected_product + '/risk-types/policy/state/?version_id=' + session.product_version_id + '&type=minimal')
            .then(response => {
                console.log(response.data);
                session.policy_risk_types = response.data;
            })
            .catch(error => {
                console.log('There was an error:', error.response);
            });
    },
    methods: {
        validateContact: function() {
            session.contact_first_name = document.getElementById('contactFirstName').value;
            session.contact_middle_name = document.getElementById('contactMiddleName').value;
            session.contact_last_name = document.getElementById('contactLastName').value;
            session.street_address = document.getElementById('contactStreet').value;
            session.city = document.getElementById('contactCity').value;
            session.state = document.getElementById('contactState').value;
            session.zip_code = document.getElementById('contactZip').value;
            session.contact_phone_number = document.getElementById('contactPhone').value;
            session.contact_email = document.getElementById('contactEmail').value;
            // Validate contact inputs
            if (session.contact_first_name === '' || session.contact_last_name === '' || session.street_address === '' || session.zip_code === '' || session.city === '' || session.state === '' || session.contact_phone_number === '' || session.contact_email === '') {
                if(session.contact_first_name === '') {
                    document.getElementById('contactFirstName').style.borderColor = "red";
                }
                if(session.contact_last_name === '') {
                    document.getElementById('contactLastName').style.borderColor = "red";
                }
                if(session.street_address === '') {
                    document.getElementById('contactStreet').style.borderColor = "red";
                }
                if(session.city === '') {
                    document.getElementById('contactCity').style.borderColor = "red";
                }
                if(session.state === '') {
                    document.getElementById('contactState').style.borderColor = "red";
                }
                if(session.zip_code ===' ') {
                    document.getElementById('contactZip').style.borderColor = "red";
                }
                if(session.contact_phone_number === '') {
                    document.getElementById('contactPhone').style.borderColor = "red";
                }
                if(session.contact_email === '') {
                    document.getElementById('contactEmail').style.borderColor = "red";
                }
            } else {
                // Proceed to next quoting step
                this.$router.push('/drivers');
            }
        }
    }
};

const Drivers = {
    template: `
        <div class="text-left w-25 mx-auto mb-3">
            <div id="quoteHeader"><h5>Who is the primary driver?</h5><br></div>
            <div class="form-group">
                <label><b>Driver Name:</b></label><input type="text" class="form-control" id="driverName" required><br>
                <label><b>Date of Birth:</b></label><input type="date" class="form-control" style="width: 12rem;" id="driverDOB" required><br>
                <span><b>Gender</b></span><br>
                <div class="btn-group btn-group-toggle mt-2" data-toggle="buttons">
                    <label class="btn btn-normal btn-outline-info" id="genderMale">
                        <input type="radio" autocomplete="off" id="genderMaleCheck" @click="driverQuestion('gender','Male')">Male
                    </label>
                    <label class="btn btn-normal btn-outline-info" id="genderFemale">
                        <input type="radio" autocomplete="off" id="genderFemaleCheck" @click="driverQuestion('gender','Female')">Female
                    </label>
                </div>
                <br><br>
                <span><b>Marital Status</b></span><br>
                <div class="btn-group btn-group-toggle mt-2" data-toggle="buttons">
                    <label class="btn btn-normal btn-outline-info" id="singleStatus">
                        <input type="radio" value="true" autocomplete="off" id="singleStatusCheck" @click="driverQuestion('maritalStatus','Single')">Single
                    </label>
                    <label class="btn btn-normal btn-outline-info" id="marriedStatus">
                        <input type="radio" value ="false" autocomplete="off" id="marriedStatusCheck" @click="driverQuestion('maritalStatus','Married')">Married
                    </label>
                </div>
                <br><br>
                <span><b>Is the driver a student who has maintained a 3.5 GPA for the last two semesters of high school or college?</b></span><br>
                <div class="btn-group btn-group-toggle mt-2" data-toggle="buttons">
                    <label class="btn btn-normal btn-outline-info" id="isGoodStudent">
                        <input type="radio" value="true" autocomplete="off" id="isGoodStudentYes" @click="driverQuestion('goodStudent','true')">Yes
                    </label>
                    <label class="btn btn-normal btn-outline-info" id="isNotGoodStudent">
                        <input type="radio" value ="false" autocomplete="off" id="isGoodStudentNo" @click="driverQuestion('goodStudent','false')">No
                    </label>
                </div>
                <br><br>
                <span><b>Has the driver completed driver training within the last 36 months?</b></span><br>
                <div class="btn-group btn-group-toggle mt-2" data-toggle="buttons">
                    <label class="btn btn-normal btn-outline-info" id="hasTraining">
                        <input type="radio" value="true" autocomplete="off" id="hasTrainingYes" @click="driverQuestion('training','true')">Yes
                    </label>
                    <label class="btn btn-normal btn-outline-info" id="noTraining">
                        <input type="radio" value ="false" autocomplete="off" id="hasTrainingNo" @click="driverQuestion('training','false')">No
                    </label>
                </div>
                <br><br>
                <span><b>Is the driver a senior?</b> <small>(Age 65 and older)</small></span><br>
                <div class="btn-group btn-group-toggle mt-2" data-toggle="buttons">
                    <label class="btn btn-normal btn-outline-info" id="isSenior">
                        <input type="radio" value="true" autocomplete="off" id="isSeniorYes" @click="driverQuestion('senior','true')">Yes
                    </label>
                    <label class="btn btn-normal btn-outline-info" id="isNotSenior">
                        <input type="radio" value ="false" autocomplete="off" id="isSeniorNo" @click="driverQuestion('senior','false')">No
                    </label>
                </div>
                <br>
            </div>
            <hr>
            <button class="btn btn-primary" @click="validateDriver">Continue</button>
            <button class="btn btn-normal" @click="$router.push('/contact')">Back</button>
        </div>
    `,
    mounted() {
        // Prefill partial driver info
        session.driver_name = session.contact_first_name + ' ' + session.contact_last_name;
        document.getElementById('driverName').value = session.driver_name;
        if(session.driver_dob !== null) {
            document.getElementById('driverDOB').value = session.driver_dob;
        } else {
            // Set default date
            var d = new Date();
            d.setFullYear(d.getFullYear() - 20) // 20 years ago
            document.getElementById('driverDOB').valueAsDate = d;
            // Determine age limit date
            var age_date = new Date();
            age_date.setFullYear(age_date.getFullYear() - 16) // 16 years ago
            var dd = age_date.getDate();
            var mm = age_date.getMonth() + 1; //January is 0!
            var yyyy = age_date.getFullYear();
            if(dd < 10){
                dd= '0' + dd;
            }
            if(mm < 10){
               mm = '0' + mm;
            }
            session.driver_age_limit_date = yyyy + '-' + mm + '-' + dd;
            document.getElementById("driverDOB").setAttribute("max", session.driver_age_limit_date);
        }

        // Add load stored values for driver
        if (session.driver_gender == 'Male') {
            document.getElementById("genderMaleCheck").checked = true;
            document.getElementById("genderFemaleCheck").checked = false;
        } else {
            document.getElementById("genderMaleCheck").checked = false;
            document.getElementById("genderFemaleCheck").checked = true;
        }
        if (session.driver_marital_status == 'Single') {
            document.getElementById("singleStatusCheck").checked = true;
            document.getElementById("marriedStatusCheck").checked = false;
        } else {
            document.getElementById("singleStatusCheck").checked = false;
            document.getElementById("marriedStatusCheck").checked = true;
        }
        if (session.driver_good_student == true) {
            document.getElementById("isGoodStudentYes").checked = true;
            document.getElementById("isGoodStudentNo").checked = false;
        } else {
            document.getElementById("isGoodStudentYes").checked = false;
            document.getElementById("isGoodStudentNo").checked = true;
        }
        if (session.driver_training == true) {
            document.getElementById("hasTrainingYes").checked = true;
            document.getElementById("hasTrainingNo").checked = false;
        } else {
            document.getElementById("hasTrainingYes").checked = false;
            document.getElementById("hasTrainingNo").checked = true;
        }
        if (session.driver_senior == true) {
            document.getElementById("isSeniorYes").checked = true;
            document.getElementById("isSeniorNo").checked = false;
        } else {
            document.getElementById("isSeniorYes").checked = false;
            document.getElementById("isSeniorNo").checked = true;
        }

        // Get product risk types for drivers
        console.log('GET: ' + '/api/lines/products/' + session.selected_product + '/risk-types/drivers/state/?version_id=' + session.product_version_id + '&type=minimal');
        apiClient.get('/api/lines/products/' + session.selected_product + '/risk-types/drivers/state/?version_id=' + session.product_version_id + '&type=minimal')
            .then(response => {
                console.log(response.data);
                session.driver_risk_types = response.data;
            })
            .catch(error => {
                console.log('There was an error:', error.response);
            });
    },
    methods: {
        driverQuestion: function (question, response){
            if (question === 'gender') {
                session.driver_gender = response
                document.getElementById('genderMale').style.borderColor = "#306391";
                document.getElementById('genderFemale').style.borderColor = "#306391";
            } else if (question === 'maritalStatus') {
                session.driver_marital_status = response
                document.getElementById('singleStatus').style.borderColor = "#306391";
                document.getElementById('marriedStatus').style.borderColor = "#306391";
            } else if (question === 'goodStudent') {
                session.driver_good_student = response
                document.getElementById('isGoodStudent').style.borderColor = "#306391";
                document.getElementById('isNotGoodStudent').style.borderColor = "#306391";
            } else if (question === 'training') {
                session.driver_training = response
                document.getElementById('hasTraining').style.borderColor = "#306391";
                document.getElementById('noTraining').style.borderColor = "#306391";
            } else if (question === 'senior') {
                session.driver_senior = response
                document.getElementById('isSenior').style.borderColor = "#306391";
                document.getElementById('isNotSenior').style.borderColor = "#306391";
            }
        },
        validateDriver: function () {
            session.driver_name = document.getElementById('driverName').value;
            session.driver_dob = document.getElementById('driverDOB').value;
            if (session.driver_dob > session.age_limit_date) {
                document.getElementById('driverDOB').value = '';
                session.driver_dob = '';
                document.getElementById('driverDOB').style.borderColor = "red";
            }

            // Validate driver inputs
            if (session.driver_name === '' || session.driver_dob === '' || session.driver_gender === null || session.driver_marital_status === null || session.driver_good_student === null || session.driver_training === null || session.driver_senior === null) {
                if (session.driver_name === '') {
                    document.getElementById('driverName').style.borderColor = "red";
                }
                if (session.driver_dob === '') {
                    document.getElementById('driverDOB').style.borderColor = "red";
                }
                if (session.driver_gender=== null) {
                    document.getElementById('genderMale').style.borderColor = "red";
                    document.getElementById('genderFemale').style.borderColor = "red";
                }
                if (session.driver_marital_status === null) {
                    document.getElementById('singleStatus').style.borderColor = "red";
                    document.getElementById('marriedStatus').style.borderColor = "red";
                }
                if (session.driver_good_student === null) {
                    document.getElementById('isGoodStudent').style.borderColor = "red";
                    document.getElementById('isNotGoodStudent').style.borderColor = "red";
                }
                if (session.driver_training === null) {
                    document.getElementById('hasTraining').style.borderColor = "red";
                    document.getElementById('noTraining').style.borderColor = "red";
                }
                if (session.driver_senior === null) {
                    document.getElementById('isSenior').style.borderColor = "red";
                    document.getElementById('isNotSenior').style.borderColor = "red";
                }
            } else {
                this.$router.push('/questions')
            }
        }
    }
};

const Questions = {
    template: `
        <div class="text-left w-50 mx-auto mb-3">
            <div id="quoteHeader"><h5>Please provide an answer for each of the following 6 questions:</h5><br></div>
            <div class="form-group">
                <span><b>1. Are you or any members of your household currently or plan to become a driver/operator for a ride sharing organization or transportation network organization such as, but not limited to, Lyft or Uber?</b></span><br>
                <div class="btn-group btn-group-toggle mt-2" data-toggle="buttons">
                    <label class="btn btn-normal btn-outline-info" id="question1a">
                        <input type="radio" autocomplete="off" id="q1yes" @click="answerQuestion('q1','true')">Yes
                    </label>
                    <label class="btn btn-normal btn-outline-info" id="question1b">
                        <input type="radio" autocomplete="off" id="q1no" @click="answerQuestion('q1','false')">No
                    </label>
                </div>
                <br><hr>
                <span><b>2. Have you or any members of your household rented personal vehicles to others?</b></span><br>
                <div class="btn-group btn-group-toggle mt-2" data-toggle="buttons">
                    <label class="btn btn-normal btn-outline-info" id="question2a">
                        <input type="radio" value="true" autocomplete="off" id="q2yes" @click="answerQuestion('q2','true')">Yes
                    </label>
                    <label class="btn btn-normal btn-outline-info" id="question2b">
                        <input type="radio" value ="false" autocomplete="off" id="q2no" @click="answerQuestion('q2','false')">No
                    </label>
                </div>
                <br><hr>
                <span><b>3. Any coverage declined, cancelled or non-renewed during the past three years?</b></span><br>
                <div class="btn-group btn-group-toggle mt-2" data-toggle="buttons">
                    <label class="btn btn-normal btn-outline-info" id="question3a">
                        <input type="radio" value="true" autocomplete="off" id="q3yes" @click="answerQuestion('q3','true')">Yes
                    </label>
                    <label class="btn btn-normal btn-outline-info" id="question3b">
                        <input type="radio" value ="false" autocomplete="off" id="q3no" @click="answerQuestion('q3','false')">No
                    </label>
                </div>
                <br><hr>
                <span><b>4. Is any vehicle used in business for delivery (pizza, newspaper, food, other)?</b></span><br>
                <div class="btn-group btn-group-toggle mt-2" data-toggle="buttons">
                    <label class="btn btn-normal btn-outline-info" id="question4a">
                        <input type="radio" value="true" autocomplete="off" id="q4yes" @click="answerQuestion('q4','true')">Yes
                    </label>
                    <label class="btn btn-normal btn-outline-info" id="question4b">
                        <input type="radio" value ="false" autocomplete="off" id="q4no" @click="answerQuestion('q4','false')">No
                    </label>
                </div>
                <br><hr>
                <span><b>5. Has any driver’s license been suspended or revoked?</b></span><br>
                <div class="btn-group btn-group-toggle mt-2" data-toggle="buttons">
                    <label class="btn btn-normal btn-outline-info" id="question5a">
                        <input type="radio" value="true" autocomplete="off" id="q5yes" @click="answerQuestion('q5','true')">Yes
                    </label>
                    <label class="btn btn-normal btn-outline-info" id="question5b">
                        <input type="radio" value ="false" autocomplete="off" id="q5no" @click="answerQuestion('q5','false')">No
                    </label>
                </div>
                <br><br>
                <span><b>6. Any financial responsibility filings required (FR-44 or SR-22)?</b></span><br>
                <div class="btn-group btn-group-toggle mt-2" data-toggle="buttons">
                    <label class="btn btn-normal btn-outline-info" id="question6a">
                        <input type="radio" value="true" autocomplete="off" id="q6yes" @click="answerQuestion('q6','true')">Yes
                    </label>
                    <label class="btn btn-normal btn-outline-info" id="question6b">
                        <input type="radio" value ="false" autocomplete="off" id="q6no" @click="answerQuestion('q6','false')">No
                    </label>
                </div>
                <br>
            </div>
                <hr>
                <button class="btn btn-primary" @click="validateQuestions">Continue</button>
                <button class="btn btn-normal" @click="$router.push('/drivers')">Back</button>
            </div>
        </div>
    `,
    mounted() {
        // Add load stored values for questions
        if (session.q1 == true) {
            document.getElementById("q1yes").checked = true;
            //document.getElementById("q1no").checked = false;
        } else {
            //document.getElementById("q1yes").checked = false;
            document.getElementById("q1no").checked = true;
        }
        if (session.q2 == true) {
            document.getElementById("q2yes").checked = true;
            //document.getElementById("q2no").checked = false;
        } else {
            //document.getElementById("q2yes").checked = false;
            document.getElementById("q2no").checked = true;
        }
        if (session.q3 == true) {
            document.getElementById("q3yes").checked = true;
            //document.getElementById("q3no").checked = false;
        } else {
            //document.getElementById("q3yes").checked = false;
            document.getElementById("q3no").checked = true;
        }
        if (session.q4 == true) {
            document.getElementById("q4yes").checked = true;
            //document.getElementById("q4no").checked = false;
        } else {
            //document.getElementById("q4yes").checked = false;
            document.getElementById("q4no").checked = true;
        }
        if (session.q5 == true) {
            document.getElementById("q5yes").checked = true;
            //document.getElementById("q5no").checked = false;
        } else {
            //document.getElementById("q5yes").checked = false;
            document.getElementById("q5no").checked = true;
        }
        if (session.q6 == true) {
            document.getElementById("q6yes").checked = true;
            //document.getElementById("q6no").checked = false;
        } else {
            //document.getElementById("q6yes").checked = false;
            document.getElementById("q6no").checked = true;
        }
    },
    methods: {
        answerQuestion: function (question, response){
            if (question === 'q1') {
                session.q1 = response
                document.getElementById('question1a').style.borderColor = "#306391";
                document.getElementById('question1b').style.borderColor = "#306391";
            } else if (question === 'q2') {
                session.q2 = response
                document.getElementById('question2a').style.borderColor = "#306391";
                document.getElementById('question2b').style.borderColor = "#306391";
            } else if (question === 'q3') {
                session.q3 = response
                document.getElementById('question3a').style.borderColor = "#306391";
                document.getElementById('question3b').style.borderColor = "#306391";
            } else if (question === 'q4') {
                session.q4 = response
                document.getElementById('question4a').style.borderColor = "#306391";
                document.getElementById('question4b').style.borderColor = "#306391";
            } else if (question === 'q5') {
                session.q5 = response
                document.getElementById('question5a').style.borderColor = "#306391";
                document.getElementById('question5b').style.borderColor = "#306391";
            } else if (question === 'q6') {
                session.q6 = response
                document.getElementById('question6a').style.borderColor = "#306391";
                document.getElementById('question6b').style.borderColor = "#306391";
            }
        },
        validateQuestions: function () {
            if (session.q1 === null || session.q2 === null || session.q3 === null || session.q4 === null || session.q5 == null || session.q6 == null) {
                if (session.q1 === null) {
                    document.getElementById('question1a').style.borderColor = "red";
                    document.getElementById('question1b').style.borderColor = "red";
                }
                if (session.q2 === null) {
                    document.getElementById('question2a').style.borderColor = "red";
                    document.getElementById('question2b').style.borderColor = "red";
                }
                if (session.q3 === null) {
                    document.getElementById('question3a').style.borderColor = "red";
                    document.getElementById('question3b').style.borderColor = "red";
                }
                if (session.q4 === null) {
                    document.getElementById('question4a').style.borderColor = "red";
                    document.getElementById('question4b').style.borderColor = "red";
                }
                if (session.q5 === null) {
                    document.getElementById('question5a').style.borderColor = "red";
                    document.getElementById('question5b').style.borderColor = "red";
                }
                if (session.q6 === null) {
                    document.getElementById('question6a').style.borderColor = "red";
                    document.getElementById('question6b').style.borderColor = "red";
                }
            } else {
                this.$router.push('/vehicles')
            }
        }
    }
};

const Vehicles = {
    template: `
        <div class="text-left w-25 mx-auto mb-3">
            <div id="quoteHeader"><h5>What vehicle do you wish to cover?</h5><br></div>
            <div class="form-group">
                <label><b>VIN:</b></label><input type="text" class="form-control" id="vin" maxlength="17" required><br>
                <label><b>Make:</b></label><input type="text" class="form-control" id="make" required><br>
                <label><b>Model:</b></label><input type="text" class="form-control" id="model" required><br>
                <label><b>Model Year:</b></label><input type="text" class="form-control" id="modelYear" required><br>
                <label><b>Mileage:</b></label><input type="text" class="form-control" id="mileage" required><br>
                <label><b>Principal Driver:</b></label><select class="form-control" id="principalDriver" required>
                </select><br>
                <label><b>Rating Tier:</b></label><select class="form-control" id="ratingTier">
                    <option value="ratingTier_standard">Standard</option>
                    <option value="ratingTier_preferred">Preferred</option>
                    <option value="ratingTier_elite">Elite</option>
                </select><br>
                <label><b>Territory:</b></label><select class="form-control" id="territory">
                    <option value="territory_2">2</option>
                    <option value="territory_3">3</option>
                    <option value="territory_9">9</option>
                </select><br>
                <label><b>Use:</b></label><select class="form-control" id="use">
                    <option value="use_business">Business</option>
                    <option value="use_pleasure">Pleasure</option>
                    <option value="use_farm">Farm</option>
                    <option value="use_15MilestoWork">< 15 Miles to Work</option>
                    <option value="use_15MilestoWork_1">>15 Miles to Work</option>
                </select><br>
                <label><b>Performance:</b></label><select class="form-control" id="performance">
                    <option value="performance_standard">Standard</option>
                    <option value="performance_intermediate">Intermediate</option>
                    <option value="performance_high">High</option>
                    <option value="performance_sports">Sports</option>
                    <option value="performance_sportsPremium">Sports Premium</option>
                </select><br>
                <span><b>Does this Vehicle have Anti-lock Brakes?</b></span><br>
                <div class="btn-group btn-group-toggle mt-2" data-toggle="buttons">
                    <label class="btn btn-normal btn-outline-info" id="hasAntilockBrakes">
                        <input type="radio" value="true" autocomplete="off" @click="vehicleQuestion('brakes','true')">Yes
                    </label>
                    <label class="btn btn-normal btn-outline-info" id="noAntilockBrakes">
                        <input type="radio" value ="false" autocomplete="off" @click="vehicleQuestion('brakes','false')">No
                    </label>
                </div>
                <br><br>
            </div>
            <hr>
            <button class="btn btn-primary" @click="validateVehicle">Continue</button>
            <button class="btn btn-normal" @click="$router.push('/questions')">Back</button>
        </div>
    `,
    mounted() {
        // Get data for dropdowns
        if (session.driver_name != null) {
            document.getElementById('principalDriver').innerHTML = "<option id=\"" + session.driver_name +"\">" + session.driver_name +"</option>"
        }

        // Add load stored values for vehicles
        if (session.vehicle_vin != null) {
            document.getElementById('vin').value = session.vehicle_vin;
        }
        if (session.vehicle_make != null) {
            document.getElementById('make').value = session.vehicle_make;
        }
        if (session.vehicle_model != null) {
            document.getElementById('model').value = session.vehicle_model;
        }
        if (session.vehicle_model_year != null) {
            document.getElementById('modelYear').value = session.vehicle_model_year;
        }
        if (session.vehicle_mileage != null) {
            document.getElementById('mileage').value = session.vehicle_mileage;
        }
        if (session.vehicle_rating_tier != null) {
            document.getElementById('ratingTier').value = session.vehicle_rating_tier;
        }
        if (session.vehicle_territory != null) {
            document.getElementById('territory').value = session.vehicle_territory;
        }
        if (session.vehicle_use != null) {
            document.getElementById('use').value = session.vehicle_use;
        }
        if (session.vehicle_performance) {
            document.getElementById('performance').value = session.vehicle_performance;
        }

        // Get product risk types for vehicles
        console.log('GET: ' + '/api/lines/products/' + session.selected_product + '/risk-types/vehicles/state/?version_id=' + session.product_version_id + '&type=minimal');
        apiClient.get('/api/lines/products/' + session.selected_product + '/risk-types/vehicles/state/?version_id=' + session.product_version_id + '&type=minimal')
            .then(response => {
                console.log(response.data);
                session.vehicle_risk_types = response.data;
            })
            .catch(error => {
                console.log('There was an error:', error.response);
            });
    },
    methods: {
        vehicleQuestion: function (question, response){
            if (question === 'brakes') {
                session.vehicle_brakes = response
                document.getElementById('hasAntilockBrakes').style.borderColor = "#306391";
                document.getElementById('noAntilockBrakes').style.borderColor = "#306391";
            }
        },
        validateVehicle: function() {
            session.vehicle_vin = document.getElementById('vin').value;
            session.vehicle_make = document.getElementById('make').value;
            session.vehicle_model = document.getElementById('model').value;
            session.vehicle_model_year = document.getElementById('modelYear').value;
            session.vehicle_mileage = document.getElementById('mileage').value;
            session.vehicle_rating_tier = document.getElementById('ratingTier').value;
            session.vehicle_territory = document.getElementById('territory').value;
            session.vehicle_use = document.getElementById('use').value;
            session.vehicle_performance = document.getElementById('performance').value;

            // Validate vehicle inputs
            if (session.vehicle_vin === '' || session.vehicle_make === '' || session.vehicle_model === null || session.vehicle_model_year === null || session.vehicle_mileage === null || session.vehicle_principal_driver === null || session.vehicle_brakes === null) {
                if (session.vehicle_vin === '') {
                    document.getElementById('vin').style.borderColor = "red";
                }
                if (session.vehicle_make === '') {
                    document.getElementById('make').style.borderColor = "red";
                }
                if (session.vehicle_model === '') {
                    document.getElementById('model').style.borderColor = "red";
                }
                if (session.vehicle_model_year === '') {
                    document.getElementById('modelYear').style.borderColor = "red";
                }
                if (session.vehicle_mileage === '') {
                    document.getElementById('mileage').style.borderColor = "red";
                }
                if (session.vehicle_principal_driver === '') {
                    document.getElementById('principalDriver').style.borderColor = "red";
                }
                if (session.vehicle_brakes === null) {
                    document.getElementById('hasAntilockBrakes').style.borderColor = "red";
                    document.getElementById('noAntilockBrakes').style.borderColor = "red";
                }
            } else {
                this.$router.push('/coverages')
            }
        }
    }
};

const Coverages = {
    template: `
        <div class="row justify-content-center mt-2">
            <div class="col-md-7">
                <div class="text-center" id="quoteHeader"><h5>Getting available coverages...</h5><br><br><i class="fa fa-spinner fa-pulse fa-4x fa-fw"></i></div>
                <div class="form-group" id="policyCoveragesGroup" style="display: none;">
                    <nav class="navbar pl-0 pr-0">
                        <span class="navbar-brand pl-5 mb-0 h4">Policy Coverages</span>
                    </nav>
                    <ul>
                        <li class="list-group-item">
                            <nav class="navbar pl-0 pr-0">
                                <span class="navbar-brand mb-0 h6"><input type="checkbox" checked disabled>&nbsp; Uninsured/Underinsured Motorist</span>
                                <span id="totalUninsuredMotorist" class="text-muted mt-1 pr-1">$0.00</span>
                            </nav>
                            <small>This coverage allows an insured to collect from his or her insurer as if it provided liability coverage for the negligent third party.</small><br><br>
                            <small><b>Bodily Injury Coverage Limit:</b></small><br>
                            <select id="uninsuredBodilyInjuryLimit" class="form-control" @change="updateCoverages('uninsuredBodilyInjury')">
                                <option value="uninsuredMotoristBodilyInjury_2000050000" selected>$20,000 - $50,000</option>
                                <option value="uninsuredMotoristBodilyInjury_50000100000">$50,000 - $100,000</option>
                                <option value="uninsuredMotoristBodilyInjury_100000200000">$100,000 - $250,000</option>
                                <option value="uninsuredMotoristBodilyInjury_250000500000">$250,000 - $500,000</option>
                            </select>
                            <br>
                            <small><b>Property Damage Coverage Limit:</b></small><br>
                            <select id="uninsuredPropertyDamageLimit" class="form-control" @change="updateCoverages('uninsuredPropertyDamge')">
                                <option value="uninsuredMotoristPropertyDamage_25000" selected>$25,000</option>
                                <option value="uninsuredMotoristPropertyDamage_50000">$50,000</option>
                                <option value="uninsuredMotoristPropertyDamage_100000">$100,000</option>
                                <option value="uninsuredMotoristPropertyDamage_250000">$250,000</option>
                                <option value="uninsuredMotoristPropertyDamage_500000">$500,000</option>
                            </select>
                        </li>
                    </ul>
                </div>
                <div class="form-group" id="vehicleCoveragesGroup" style="display: none;">
                    <nav class="navbar pl-0 pr-0">
                        <span class="navbar-brand pl-5 mb-0 h4">Vehicle Coverages</span>
                    </nav>
                    <ul>
                        <li class="list-group-item">
                            <nav class="navbar pl-0 pr-0">
                                <span class="navbar-brand mb-0 h6"><input type="checkbox" checked disabled>&nbsp; Bodily Injury</span>
                                <span id="bodilyInjuryTotal" class="text-muted mt-1 pr-1">$0.00</span>
                            </nav>
                            <small>Coverage that helps you pay for another person's injuries in a car accident for which you are found to be at fault.</small><br><br>
                            <small><b>Coverage Limit:</b></small><br>
                            <select id="bodilyInjuryLimit" class="form-control" @change="updateCoverages('bodilyInjury')">
                                <option value="bodilyInjuryLimit_50000100000" selected>$50,000 - $100,000</option>
                                <option value="bodilyInjuryLimit_100000300000">$100,000 - $250,000</option>
                                <option value="bodilyInjuryLimit_250000500000">$250,000 - $500,000</option>
                            </select>
                        </li>
                        <li class="list-group-item">
                            <nav class="navbar pl-0 pr-0">
                                <span class="navbar-brand mb-0 h6"><input type="checkbox" checked disabled>&nbsp; Property Damage</span>
                                <span id="propertyDamageTotal" class="text-muted mt-1 pr-1">$0.00</span>
                            </nav>
                            <small>Coverage that helps pay to repair damage you cause to another person's vehicle or property.</small><br><br>
                            <small><b>Coverage Limit:</b></small><br>
                            <select id="propertyDamageLimit" class="form-control" @change="updateCoverages('propertyDamage')">
                                <option value="propertyDamageLimit_25000" selected>$25,000</option>
                                <option value="propertyDamageLimit_50000">$50,000</option>
                                <option value="propertyDamageLimit_100000">$100,000</option>
                                <option value="propertyDamageLimit_250000">$250,000</option>
                            </select>
                        </li>
                    </ul>
                </div>
                <div class="form-group" id="optionalCoveragesGroup" style="display: none;">
                    <nav class="navbar pl-0 pr-0">
                        <span class="navbar-brand pl-5 mb-0 h4">Optional Coverages</span>
                    </nav>
                    <ul>
                        <li class="list-group-item">
                            <nav class="navbar pl-0 pr-0">
                                <span class="navbar-brand mb-0 h6"><input type="checkbox" id="medicalCheckbox" @change="updateCoverages('medical')">&nbsp; Medical Expense</span>
                                <span id="medicalExpenseTotal" class="text-muted mt-1 pr-1">---</span>
                            </nav>
                            <small>Coverage for medical expenses for an insured who sustains bodily injury (BI) caused by an auto accident, without regard to fault. Coverage for persons other than the named insured and his or her family members is typically restricted to circumstances when they are occupants of the insured auto.</small><br><br>
                            <small><b>Coverage Limit:</b></small><br>
                            <select id="medicalExpenseLimit" class="form-control" disabled @change="updateCoverages('medical')">
                                <option value="medicalExpenseLimit_1000" selected>$1,000</option>
                                <option value="medicalExpenseLimit_2000">$2,000</option>
                                <option value="medicalExpenseLimit_5000">$5,000</option>
                            </select><br>
                            <small><b>Passive Restraint System:</b></small><br>
                            <select id="passiveRestraintSystemLimit" class="form-control" disabled @change="updateCoverages('medical')">
                                <option value="passiveRestraintSystem_none" selected>None</option>
                                <option value="passiveRestraintSystem_driverSideOnly">Driver Side Only</option>
                                <option value="passiveRestraintSystem_fullyEquipped">Fully Equipped</option>
                            </select>
                        </li>
                        <li class="list-group-item">
                            <nav class="navbar pl-0 pr-0">
                                <span class="navbar-brand mb-0 h6"><input type="checkbox" id="comprehensiveCheckbox" @change="updateCoverages('comprehensive')">&nbsp; Comprehensive</span>
                                <span id="comprehensiveTotal" class="text-muted mt-1 pr-1">---</span>
                            </nav>
                            <small>Coverage under an automobile physical damage policy insuring against loss or damage resulting from any cause, except those specifically precluded. It covers losses such as fire, theft, windstorm, flood, and vandalism, but not loss by collision or upset.</small>
                        </li>
                        <li class="list-group-item">
                            <nav class="navbar pl-0 pr-0">
                                <span class="navbar-brand mb-0 h6"><input type="checkbox" id="collisionCheckbox" @change="updateCoverages('collision')">&nbsp; Collision</span>
                                <span id="collisionTotal" class="text-muted mt-2 pr-1">---</span>
                            </nav>
                            <small>Coverage that provides for reimbursement for loss to a covered automobile due to its colliding with another vehicle or object or the overturn of the automobile. This covers only damage to the automobile itself as defined in the policy.</small>
                        </li>
                        <li class="list-group-item">
                            <nav class="navbar pl-0 pr-0">
                                <span class="navbar-brand mb-0 h6"><input type="checkbox" id="additionalCheckbox" @change="updateCoverages('additional')">&nbsp; Additional Equipment</span>
                                <span id="additionalEquipmentTotal" class="text-muted mt-1 pr-1">---</span>
                            </nav>
                            <small>Custom parts and equipment coverage (CPE) is an endorsement to your policy that covers permanently installed custom parts or equipment, devices, accessories, enhancements and changes other than those installed by the original manufacturer, that alter the performance or appearance of your vehicle.</small><br><br>
                            <small><b>Coverage Limit:</b></small><br>
                            <select id="additionalEquipmentCoverageLimit" class="form-control" disabled @change="updateCoverages('additional')">
                                <option value="additionalEquipmentCoverageLimit_none" selected>None</option>
                                <option value="additionalEquipmentCoverageLimit_0500">$0-$500</option>
                                <option value="additionalEquipmentCoverageLimit_5011000">$501-$1,000</option>
                                <option value="additionalEquipmentCoverageLimit_10001500">$1,000-$1,500</option>
                                <option value="additionalEquipmentCoverageLimit_15012000">$1,501-$2,000</option>
                            </select>
                        </li>
                        <li class="list-group-item">
                            <nav class="navbar pl-0 pr-0">
                                <span class="navbar-brand mb-0 h6"><input type="checkbox" id="transportationCheckbox" @change="updateCoverages('transportation')">&nbsp; Transportation Expenses</span>
                                <span id="transportationExpensesTotal" class="text-muted mt-1 pr-1">---</span>
                            </nav>
                            <small>If your vehicle should be temporarily disabled for more than a day due to a covered auto accident, this coverage will pay $30 per day for up to 30 days, or a maximum of $900, toward the cost of a temporary replacement vehicle such as a rental car.</small><br><br>
                            <small><b>Coverage Limit:</b></small><br>
                            <select id="transportationExpensesLimit" class="form-control" disabled @change="updateCoverages('transportation')">
                                <option value="transportationExpensesLimit_none" selected>None</option>
                                <option value="transportationExpensesLimit_600">$600</option>
                                <option value="transportationExpensesLimit_750">$750</option>
                                <option value="transportationExpensesLimit_900">$900</option>
                                <option value="transportationExpensesLimit_1200">$1,200</option>
                                <option value="transportationExpensesLimit_1500">$1,500</option>
                            </select>
                        </li>
                        <li class="list-group-item">
                            <nav class="navbar pl-0 pr-0">
                                <span class="navbar-brand mb-0 h6"><input type="checkbox" id="towingCheckbox" @change="updateCoverages('towing')">&nbsp; Towing</span>
                                <span id="towingTotal" class="text-muted mt-1 pr-1">---</span>
                            </nav>
                            <small>Coverage that typically pays the cost of towing your car to a repair shop when it is unable to be driven and covers a specified amount of necessary labor charges at the place of the breakdown.</small><br><br>
                            <small><b>Coverage Limit:</b></small><br>
                            <select id="towingLimit" class="form-control" disabled @change="updateCoverages('towing')">
                                <option value="towingLimit_none" selected>None</option>
                                <option value="towingLimit_25">$25</option>
                                <option value="towingLimit_50">$50</option>
                                <option value="towingLimit_75">$75</option>
                                <option value="towingLimit_100">$100</option>
                            </select>
                        </li>
                    </ul>
                    <div class="text-right pr-1 pb-2" id="totalPremiumSection" style="display: none;">
                        <b>Total Premium:</b> <span id="totalPremium" class="text-success">$0.00</span>
                    </div>
                    <div class="pl-5" id="navButtonSection" style="display: none;">
                        <button class="btn btn-primary" id="continueBttn" @click="validateCoverages">Continue</button>
                        <button class="btn btn-normal" @click="$router.push('/vehicles')">Back</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    mounted() {
        // Get quote risks
        console.log('GET: ' + '/api/quote/' + session.quote_number + '/risks/?page=1');
        apiClient.get('/api/quote/' + session.quote_number + '/risks/?page=1')
            .then(response => {
                console.log(response.data);
                session.quote_risks = response.data;
                document.getElementById('policyCoveragesGroup').style.display = "block";
                document.getElementById('vehicleCoveragesGroup').style.display = "block";
                document.getElementById('optionalCoveragesGroup').style.display = "block";
                document.getElementById('totalPremiumSection').style.display = "block";
                document.getElementById('navButtonSection').style.display = "block";
                document.getElementById('continueBttn').disabled = true;
                document.getElementById('quoteHeader').innerHTML = "<h5>Please select the coverages and limits you wish to include:</h5>";
                document.getElementById('totalUninsuredMotorist').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                document.getElementById('bodilyInjuryTotal').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                document.getElementById('propertyDamageTotal').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                if (session.add_driver_risk_response == null) {
                    this.addDriverRisk(true);
                } else {
                    this.updateDriverRisk(true);
                }
            })
            .catch(error => {
                console.log('There was an error:', error.response);
                document.getElementById('quoteHeader').innerHTML = "<h5>There was an error when trying to complete your request.</h5>";
                document.getElementById('policyCoveragesGroup').style.display = "none";
                document.getElementById('vehicleCoveragesGroup').style.display = "none";
                document.getElementById('optionalCoveragesGroup').style.display = "none";
                document.getElementById('totalPremiumSection').style.display = "none";
                document.getElementById('navButtonSection').style.display = "none";
            });
    },
    methods: {
        updateQuoteRisks: function(vehicle, existing_payload){
            uninsuredBodilyInjury = document.getElementById("uninsuredBodilyInjuryLimit");
            uninsuredBodilyInjuryLimit = uninsuredBodilyInjury.options[uninsuredBodilyInjury.selectedIndex].value;
            uninsuredPropertyDamage = document.getElementById("uninsuredPropertyDamageLimit");
            uninsuredPropertyDamgeLimit = uninsuredPropertyDamage.options[uninsuredPropertyDamage.selectedIndex].value;
            field_answers = {
                "uninsuredMotoristBodilyInjury": uninsuredBodilyInjuryLimit,
                "uninsuredMotoristPropertyDamage": uninsuredPropertyDamgeLimit,
                "firstNameNI": session.contact_first_name,
                "middleInitialNI": session.contact_middle_name,
                "lastNameNI": session.contact_last_name,
                "suffixNI": "",
                "socialSecurityNumberNI": "123-45-6789",
                "dateOfBirthNI": session.driver_dob,
                "licenseNumberNI": "",
                "licenseStateNI": "",
                "cityNI": session.city,
                "streetAddressNI": session.street_address,
                "stateOfNI": session.state,
                "zipCodeNI": session.zip_code,
                "emailNI": session.contact_email,
                "uber": session.q1,
                "rentedToOthers": session.q2,
                "coverageDeclinedInThree": session.q3,
                "deliveryUse": session.q4,
                "hasAnyDriversLicenseBeenSuspendedOrRevoked": session.q5,
                "financialFilings": session.q6
            }
            // Update policy risk type for the quote
            risk_id = session.quote_risks.risk_state['id'];
            quote_risks_copy = session.quote_risks;
            quote_risks_copy.risk_state['field_answers'] = field_answers;
            // Remove unecessary keys and values
            delete quote_risks_copy.final_rate;
            delete quote_risks_copy.risk_quotes;
            delete quote_risks_copy.generated_by;
            delete quote_risks_copy.date_added;
            delete quote_risks_copy.date_modified;
            delete quote_risks_copy.meta;

            payload = JSON.stringify(quote_risks_copy, existing_payload);
            console.log('PUT: ' + '/api/quote/risks/' + risk_id + '/');
            console.log('PAYLOAD: ' + payload);
            apiClient.put('/api/quote/risks/' + risk_id + '/', payload)
                .then(response => {
                    console.log(response.data);
                    session.update_quote_risks_response = response.data;
                    if (session.add_vehicle_risk_response != null && vehicle == true) {
                        if(existing_payload != null && existing_payload != '') {
                            this.updateVehicleRisk(existing_payload);
                        } else {
                            this.updateVehicleRisk()
                        }

                    }
                })
                .catch(error => {
                    console.log('There was an error:', error.response);
                });
        },
        addDriverRisk: function(vehicle) {
            // Add driver risk type to the quote
            payload = JSON.stringify({
                "quote": session.quote_info['id'],
                "parent_risk_quote": session.quote_info['root_risk_quote_id'],
                "risk_type_name": "drivers"
            });
            console.log('POST: ' + '/api/quote/risks/');
            console.log('PAYLOAD: ' + payload);
            apiClient.post('/api/quote/risks/', payload)
                .then(response => {
                    console.log(response.data);
                    session.add_driver_risk_response = response.data;
                    session.driver_name_id = session.add_driver_risk_response.risk_state['meta'].static_id;
                    if (session.add_vehicle_risk_response == null && vehicle == true) {
                        this.addVehicleRisk(true);
                    }
                })
                .catch(error => {
                    console.log('There was an error:', error.response);
                    document.getElementById('quoteHeader').innerHTML = "<h5>There was an error when trying to complete your request.</h5>";
                    document.getElementById('policyCoveragesGroup').style.display = "none";
                    document.getElementById('vehicleCoveragesGroup').style.display = "none";
                    document.getElementById('optionalCoveragesGroup').style.display = "none";
                    document.getElementById('totalPremiumSection').style.display = "none";
                    document.getElementById('navButtonSection').style.display = "none";
                });
        },
        updateDriverRisk: function(vehicle) {
            field_answers = {
                'driverName': session.driver_name,
                'dob': session.driver_dob,
                'gender': session.driver_gender,
                'maritalStatus': session.driver_marital_status,
                'driverLicenseNumber': "",
                'goodStudent': session.driver_good_student,
                'driverTraining': session.driver_training,
                'includeSeniorDiscount': session.driver_senior,
                'numberOfYearsLicensed': null
            }
            // Update driver risk type for the quote
            risk_id = session.add_driver_risk_response.risk_state['id'];
            risk_type_response_copy = session.add_driver_risk_response;
            risk_type_response_copy.risk_state['field_answers'] = field_answers;
            // Remove unecessary keys and values
            delete risk_type_response_copy.final_rate;
            delete risk_type_response_copy.risk_quotes;
            delete risk_type_response_copy.generated_by;
            delete risk_type_response_copy.date_added;
            delete risk_type_response_copy.date_modified;
            delete risk_type_response_copy.meta;

            payload = JSON.stringify(risk_type_response_copy);
            console.log('PUT: ' + '/api/quote/risks/' + risk_id + '/');
            console.log('PAYLOAD: ' + payload);
            apiClient.put('/api/quote/risks/' + risk_id + '/', payload)
                .then(response => {
                    console.log(response.data);
                    session.update_driver_risk_response = response.data;
                    if (session.add_vehicle_risk_response != null && vehicle == true) {
                        this.updateVehicleRisk();
                    }
                })
                .catch(error => {
                    console.log('There was an error:', error.response);
                    document.getElementById('quoteHeader').innerHTML = "<h5>There was an error when trying to complete your request.</h5>";
                    document.getElementById('policyCoveragesGroup').style.display = "none";
                    document.getElementById('vehicleCoveragesGroup').style.display = "none";
                    document.getElementById('optionalCoveragesGroup').style.display = "none";
                    document.getElementById('totalPremiumSection').style.display = "none";
                    document.getElementById('navButtonSection').style.display = "none";
                });
        },
        addVehicleRisk: function(driver) {
            // Add vehicle risk type to the quote
            payload = JSON.stringify({
                "quote": session.quote_info['id'],
                "parent_risk_quote": session.quote_info['root_risk_quote_id'],
                "risk_type_name": "vehicles"
            });
            console.log('POST: ' + '/api/quote/risks/');
            console.log('PAYLOAD: ' + payload);
            apiClient.post('/api/quote/risks/', payload)
                .then(response => {
                    console.log(response.data);
                    session.add_vehicle_risk_response = response.data;
                    if (session.update_driver_risk_response == null && driver == true) {
                        this.updateDriverRisk(true);
                    }
                })
                .catch(error => {
                    console.log('There was an error:', error.response);
                    document.getElementById('quoteHeader').innerHTML = "<h5>There was an error when trying to complete your request.</h5>";
                    document.getElementById('policyCoveragesGroup').style.display = "none";
                    document.getElementById('vehicleCoveragesGroup').style.display = "none";
                    document.getElementById('optionalCoveragesGroup').style.display = "none";
                    document.getElementById('totalPremiumSection').style.display = "none";
                    document.getElementById('navButtonSection').style.display = "none";
                });
        },
        updateVehicleRisk: function(existing_payload) {
            bodilyInjury = document.getElementById("bodilyInjuryLimit");
            bodilyInjuryLimit = bodilyInjury.options[bodilyInjury.selectedIndex].value;
            propertyDamage = document.getElementById("propertyDamageLimit");
            propertyDamageLimit = propertyDamage.options[propertyDamage.selectedIndex].value;
            // Medical Expense Coverage Limits
            if (document.getElementById("medicalCheckbox").checked == true) {
                medicalExpense = document.getElementById("medicalExpenseLimit");
                medicalExpenseLimit = medicalExpense.options[medicalExpense.selectedIndex].value;
                passiveRestraint = document.getElementById("passiveRestraintSystemLimit");
                passiveRestraintLimit = passiveRestraint.options[passiveRestraint.selectedIndex].value;
            } else if (document.getElementById("medicalCheckbox").checked == false) {
                medicalExpenseLimit = ""
                passiveRestraintLimit = ""
            }
            // Additional Equipment Coverage Limit
            if (document.getElementById("additionalCheckbox").checked == true) {
                additionalEquipment = document.getElementById("additionalEquipmentCoverageLimit");
                additionalEquipmentCoverageLimit = additionalEquipment.options[additionalEquipment.selectedIndex].value;
            } else if (document.getElementById("additionalCheckbox").checked == false) {
                additionalEquipmentCoverageLimit = ""
            }
            // Transportation Expense Coverage Limit
            if (document.getElementById("transportationCheckbox").checked == true) {
                transportationExpenses = document.getElementById("transportationExpensesLimit");
                transportationExpensesLimit = transportationExpenses.options[transportationExpenses.selectedIndex].value;
            } else if (document.getElementById("transportationCheckbox").checked == false) {
                transportationExpensesLimit = ""
            }
            // Towing Coverage Limit
            if (document.getElementById("towingCheckbox").checked == true) {
                towing = document.getElementById("towingLimit");
                towingLimit = towing.options[towing.selectedIndex].value;
            } else if (document.getElementById("towingCheckbox").checked == false) {
                towingLimit = ""
            }

            field_answers = {
                "territory": session.vehicle_territory,
                "ratingTier": session.vehicle_rating_tier,
                "bodilyInjuryLimit": bodilyInjuryLimit,
                "includeAntiLockBrakes": session.vehicle_brakes,
                "chosenDriver": session.driver_name_id,
                "propertyDamageLimit": propertyDamageLimit,
                "medicalExpenseLimit": medicalExpenseLimit,
                "passiveRestraintSystem": passiveRestraintLimit,
                "additionalEquipmentCoverageLimit": additionalEquipmentCoverageLimit,
                "transportationExpensesLimit": transportationExpensesLimit,
                "towingLimit": towingLimit,
                "vin": session.vehicle_vin,
                "make": session.vehicle_make,
                "model": session.vehicle_model,
                "modelYear": session.vehicle_model_year,
                "mileage": session.vehicle_mileage,
                "use": session.vehicle_use,
                "performance": session.vehicle_performance
            }
            // Update vehicle risk type for the quote
            if (existing_payload != null) {
                risk_id = existing_payload.risk_state['id'];
                existing_payload_copy = existing_payload;
                existing_payload_copy.risk_state['field_answers'] = field_answers;
                // Remove unecessary keys and values
                delete existing_payload_copy.final_rate;
                delete existing_payload_copy.risk_quotes;
                delete existing_payload_copy.generated_by;
                delete existing_payload_copy.date_added;
                delete existing_payload_copy.date_modified;
                delete existing_payload_copy.meta;
                payload = JSON.stringify(existing_payload_copy);
            } else {
                risk_id = session.add_vehicle_risk_response.risk_state['id'];
                risk_type_response_copy = session.add_vehicle_risk_response;
                risk_type_response_copy.risk_state['field_answers'] = field_answers;
                // Remove unecessary keys and values
                delete risk_type_response_copy.final_rate;
                delete risk_type_response_copy.risk_quotes;
                delete risk_type_response_copy.generated_by;
                delete risk_type_response_copy.date_added;
                delete risk_type_response_copy.date_modified;
                delete risk_type_response_copy.meta;
                payload = JSON.stringify(risk_type_response_copy);
            }

            console.log('PUT: ' + '/api/quote/risks/' + risk_id + '/');
            console.log('PAYLOAD: ' + payload);
            apiClient.put('/api/quote/risks/' + risk_id + '/', payload)
                .then(response => {
                    console.log(response.data);
                    session.update_vehicle_risk_response = response.data;
                    document.getElementById('totalUninsuredMotorist').innerHTML = formatter.format(session.update_vehicle_risk_response.risk_state['items'].uninsuredMotorist['premium']);
                    document.getElementById('bodilyInjuryTotal').innerHTML = formatter.format(session.update_vehicle_risk_response.risk_state['items'].bodilyInjury['premium']);
                    document.getElementById('propertyDamageTotal').innerHTML = formatter.format(session.update_vehicle_risk_response.risk_state['items'].propertyDamage['premium']);
                    if (document.getElementById('medicalCheckbox').checked == true) {
                        document.getElementById('medicalExpenseTotal').innerHTML = formatter.format(session.update_vehicle_risk_response.risk_state['items'].medicalExpense['premium']);
                    }
                    if (document.getElementById('additionalCheckbox').checked == true) {
                        document.getElementById('additionalEquipmentTotal').innerHTML = formatter.format(session.update_vehicle_risk_response.risk_state['items'].additionalEquipment['premium']);
                    }
                    if (document.getElementById('transportationCheckbox').checked == true) {
                        document.getElementById('transportationExpensesTotal').innerHTML = formatter.format(session.update_vehicle_risk_response.risk_state['items'].transportationExpenses['premium']);
                    }
                    if (document.getElementById('towingCheckbox').checked == true) {
                        document.getElementById('towingTotal').innerHTML = formatter.format(session.update_vehicle_risk_response.risk_state['items'].towing['premium']);
                    }
                    document.getElementById('totalPremium').innerHTML = formatter.format(session.update_vehicle_risk_response.risk_state['total_premium']);
                    document.getElementById('continueBttn').disabled = false;
                })
                .catch(error => {
                    console.log('There was an error:', error.response);
                    document.getElementById('quoteHeader').innerHTML = "<h5>There was an error when trying to complete your request.</h5>";
                    document.getElementById('policyCoveragesGroup').style.display = "none";
                    document.getElementById('vehicleCoveragesGroup').style.display = "none";
                    document.getElementById('optionalCoveragesGroup').style.display = "none";
                    document.getElementById('totalPremiumSection').style.display = "none";
                    document.getElementById('navButtonSection').style.display = "none";
                });
        },
        updateCoverages: function(coverage_type) {
            if (coverage_type === 'uninsuredBodilyInjury') {
                if (session.quote_risks != null) {
                    document.getElementById('totalUninsuredMotorist').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    this.updateQuoteRisks(true, session.update_vehicle_risk_response);
                }
            } else if (coverage_type === 'uninsuredPropertyDamge') {
                if (session.quote_risks != null) {
                    document.getElementById('totalUninsuredMotorist').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    this.updateQuoteRisks(true, session.update_vehicle_risk_response);
                }
            } else if (coverage_type === 'bodilyInjury') {
                if (session.add_vehicle_risk_response != null) {
                    document.getElementById('bodilyInjuryTotal').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    this.updateVehicleRisk(session.update_vehicle_risk_response);
                }
            } else if (coverage_type === 'propertyDamage') {
                if (session.add_vehicle_risk_response != null) {
                    document.getElementById('propertyDamageTotal').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    this.updateVehicleRisk(session.update_vehicle_risk_response);
                }
            } else if (coverage_type === 'medical') {
                if (document.getElementById('medicalCheckbox').checked == true) {
                    document.getElementById('medicalExpenseLimit').disabled = false;
                    document.getElementById('passiveRestraintSystemLimit').disabled = false;
                    document.getElementById('medicalExpenseTotal').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    if (session.add_vehicle_risk_response != null) {
                        this.updateVehicleRisk(session.update_vehicle_risk_response);
                    }
                } else if (document.getElementById('medicalCheckbox').checked == false) {
                    document.getElementById('medicalExpenseLimit').disabled = true;
                    document.getElementById('passiveRestraintSystemLimit').disabled = true;
                    document.getElementById('medicalExpenseTotal').innerHTML = "---";
                    document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    if (session.add_vehicle_risk_response != null) {
                        this.updateVehicleRisk(session.update_vehicle_risk_response);
                    }
                }
            } else if (coverage_type === 'comprehensive') {
                if (document.getElementById('comprehensiveCheckbox').checked == true) {
                    document.getElementById('comprehensiveTotal').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    // Add Comprehensive Coverage Item
                    payload = JSON.stringify({
                        "risk_quote": session.add_vehicle_risk_response.id,
                        "risk_item_name": "comprehensive"
                    });
                    console.log('POST: ' + '/api/quote/items/');
                    console.log('PAYLOAD: ' + payload);
                    apiClient.post('/api/quote/items/', payload)
                        .then(response => {
                            console.log(response.data);
                            session.add_comprehensive_response = response.data;
                            // Update amounts and total
                            document.getElementById('comprehensiveTotal').innerHTML = formatter.format(session.add_comprehensive_response.risk_state['items'].comprehensive['premium']);
                            if (session.add_vehicle_risk_response != null) {
                                this.updateVehicleRisk(session.add_comprehensive_response);
                            }
                        })
                        .catch(error => {
                            console.log('There was an error:', error.response);
                        });
                } else if (document.getElementById('comprehensiveCheckbox').checked == false) {
                    document.getElementById('comprehensiveTotal').innerHTML = "---";
                    document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    // Remove Comprehensive Coverage Item
                    let data = {
                        'risk_quote': session.add_vehicle_risk_response.id
                    }
                    let config = {
                        headers: {
                            'Authorization': site_token_type + ' ' + site_token,
                            'Data': JSON.stringify(data)
                        }
                    }
                    console.log('DELETE: ' + '/api/quote/items/comprehensive/');
                    console.log('PAYLOAD: ' + JSON.stringify(data));
                    axios.delete(site_url + '/api/quote/items/comprehensive/', config)
                        .then(response => {
                            console.log(response.data);
                            session.remove_comprehensive_response = response.data;
                            // Update amounts and total
                            if (session.add_vehicle_risk_response != null) {
                                this.updateVehicleRisk(session.remove_comprehensive_response);
                            }
                        })
                        .catch(error => {
                            console.log('There was an error:', error.response);
                        });
                }
            } else if (coverage_type === 'collision') {
                if (document.getElementById('collisionCheckbox').checked == true) {
                    document.getElementById('collisionTotal').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    // Add Collision Coverage Item
                    payload = JSON.stringify({
                        "risk_quote": session.add_vehicle_risk_response.id,
                        "risk_item_name": "collision"
                    });
                    console.log('POST: ' + '/api/quote/items/');
                    console.log('PAYLOAD: ' + payload);
                    apiClient.post('/api/quote/items/', payload)
                        .then(response => {
                            console.log(response.data);
                            session.add_collision_response = response.data;
                            // Update amounts and total
                            document.getElementById('collisionTotal').innerHTML = formatter.format(session.add_collision_response.risk_state['items'].collision['premium']);
                            if (session.add_vehicle_risk_response != null) {
                                this.updateVehicleRisk(session.add_collision_response);
                            }
                        })
                        .catch(error => {
                            console.log('There was an error:', error.response);
                        });
                } else if (document.getElementById('collisionCheckbox').checked == false) {
                    document.getElementById('collisionTotal').innerHTML = "---";
                    document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    // Remove Collision Coverage Item
                    let data = {
                        'risk_quote': session.add_vehicle_risk_response.id
                    }
                    let config = {
                        headers: {
                            'Authorization': site_token_type + ' ' + site_token,
                            'Data': JSON.stringify(data)
                        }
                    }
                    console.log('DELETE: ' + '/api/quote/items/collision/');
                    console.log('PAYLOAD: ' + JSON.stringify(data));
                    axios.delete(site_url + '/api/quote/items/collision/', config)
                        .then(response => {
                            console.log(response.data);
                            session.remove_collision_response = response.data;
                            // Update amounts and total
                            if (session.add_vehicle_risk_response != null) {
                                this.updateVehicleRisk(session.remove_collision_response);
                            }
                        })
                        .catch(error => {
                            console.log('There was an error:', error.response);
                        });
                }
            } else if (coverage_type === 'additional') {
                if (document.getElementById('additionalCheckbox').checked == true) {
                    document.getElementById('additionalEquipmentCoverageLimit').disabled = false;
                    document.getElementById('additionalEquipmentTotal').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    // Add Additional Equipment Coverage Item
                    payload = JSON.stringify({
                        "risk_quote": session.add_vehicle_risk_response.id,
                        "risk_item_name": "additionalEquipment"
                    });
                    console.log('POST: ' + '/api/quote/items/');
                    console.log('PAYLOAD: ' + payload);
                    apiClient.post('/api/quote/items/', payload)
                        .then(response => {
                            console.log(response.data);
                            session.add_additional_equipment_response = response.data;
                            // Update amounts and total
                            if (session.add_vehicle_risk_response != null) {
                                this.updateVehicleRisk(session.add_additional_equipment_response);
                            }
                        })
                        .catch(error => {
                            console.log('There was an error:', error.response);
                        });
                } else if (document.getElementById('additionalCheckbox').checked == false) {
                    document.getElementById('additionalEquipmentCoverageLimit').disabled = true;
                    document.getElementById('additionalEquipmentTotal').innerHTML = "---";
                    document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    // Remove Additional Equipment Coverage Item
                    let data = {
                        'risk_quote': session.add_vehicle_risk_response.id
                    }
                    let config = {
                        headers: {
                            'Authorization': site_token_type + ' ' + site_token,
                            'Data': JSON.stringify(data)
                        }
                    }
                    console.log('DELETE: ' + '/api/quote/items/additionalequipment/');
                    console.log('PAYLOAD: ' + JSON.stringify(data));
                    axios.delete(site_url + '/api/quote/items/additionalEquipment/', config)
                        .then(response => {
                            console.log(response.data);
                            session.remove_additional_equipment_response = response.data;
                            // Update amounts and total
                            if (session.add_vehicle_risk_response != null) {
                                this.updateVehicleRisk(session.remove_additional_equipment_response);
                            }
                        })
                        .catch(error => {
                            console.log('There was an error:', error.response);
                        });
                }
            } else if (coverage_type === 'transportation') {
                if (document.getElementById('transportationCheckbox').checked == true) {
                    document.getElementById('transportationExpensesLimit').disabled = false;
                    document.getElementById('transportationExpensesTotal').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    // Add Transportation Expenses Coverage Item
                    payload = JSON.stringify({
                        "risk_quote": session.add_vehicle_risk_response.id,
                        "risk_item_name": "transportationExpenses"
                    });
                    console.log('POST: ' + '/api/quote/items/');
                    console.log('PAYLOAD: ' + payload);
                    apiClient.post('/api/quote/items/', payload)
                        .then(response => {
                            console.log(response.data);
                            session.add_transportation_response = response.data;
                            // Update amounts and total
                            if (session.add_vehicle_risk_response != null) {
                                this.updateVehicleRisk(session.add_transportation_response);
                            }
                        })
                        .catch(error => {
                            console.log('There was an error:', error.response);
                        });
                } else if (document.getElementById('transportationCheckbox').checked == false) {
                    document.getElementById('transportationExpensesLimit').disabled = true;
                    document.getElementById('transportationExpensesTotal').innerHTML = "---";
                    document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    // Remove Transportation Expenses Coverage Item
                    let data = {
                        'risk_quote': session.add_vehicle_risk_response.id
                    }
                    let config = {
                        headers: {
                            'Authorization': site_token_type + ' ' + site_token,
                            'Data': JSON.stringify(data)
                        }
                    }
                    console.log('DELETE: ' + '/api/quote/items/transportationExpenses/');
                    console.log('PAYLOAD: ' + JSON.stringify(data));
                    axios.delete(site_url + '/api/quote/items/transportationExpenses/', config)
                        .then(response => {
                            console.log(response.data);
                            session.remove_transportation_response = response.data;
                            // Update amounts and total
                            if (session.add_vehicle_risk_response != null) {
                                this.updateVehicleRisk(session.remove_transportation_response);
                            }
                        })
                        .catch(error => {
                            console.log('There was an error:', error.response);
                        });
                }
            } else if (coverage_type === 'towing') {
                if (document.getElementById('towingCheckbox').checked == true) {
                    document.getElementById('towingLimit').disabled = false;
                    document.getElementById('towingTotal').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    // Add Towing Coverage Item
                    payload = JSON.stringify({
                        "risk_quote": session.add_vehicle_risk_response.id,
                        "risk_item_name": "towing"
                    });
                    console.log('POST: ' + '/api/quote/items/');
                    console.log('PAYLOAD: ' + payload);
                    apiClient.post('/api/quote/items/', payload)
                        .then(response => {
                            console.log(response.data);
                            session.add_towing_response = response.data;
                            // Update amounts and total
                            if (session.add_vehicle_risk_response != null) {
                                this.updateVehicleRisk(session.add_towing_response);
                            }
                        })
                        .catch(error => {
                            console.log('There was an error:', error.response);
                        });
                } else if (document.getElementById('towingCheckbox').checked == false) {
                    document.getElementById('towingLimit').disabled = true;
                    document.getElementById('towingTotal').innerHTML = "---";
                    document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                    // Remove Towing Coverage Item
                    let data = {
                        'risk_quote': session.add_vehicle_risk_response.id
                    }
                    let config = {
                        headers: {
                            'Authorization': site_token_type + ' ' + site_token,
                            'Data': JSON.stringify(data)
                        }
                    }
                    console.log('DELETE: ' + '/api/quote/items/towing/');
                    console.log('PAYLOAD: ' + JSON.stringify(data));
                    axios.delete(site_url + '/api/quote/items/towing/', config)
                        .then(response => {
                            console.log(response.data);
                            session.remove_towing_response = response.data;
                            // Update amounts and total
                            if (session.add_vehicle_risk_response != null) {
                                this.updateVehicleRisk(session.remove_towing_response);
                            }
                        })
                        .catch(error => {
                            console.log('There was an error:', error.response);
                        });
                }
            }
        },
        validateCoverages: function() {
            ubi_limit = document.getElementById('uninsuredBodilyInjuryLimit');
            upd_limit = document.getElementById('uninsuredPropertyDamageLimit');
            bi_limit = document.getElementById('bodilyInjuryLimit');
            pd_limit = document.getElementById('propertyDamageLimit');
            me_limit = document.getElementById('medicalExpenseLimit');
            prs_limit = document.getElementById('passiveRestraintSystemLimit');
            ae_limit = document.getElementById('additionalEquipmentCoverageLimit');
            te_limit = document.getElementById('transportationExpensesLimit');
            tow_limit = document.getElementById('towingLimit');
            if (document.getElementById('comprehensiveCheckbox').checked == true) {
                comprehensiveLimit = "N/A";
            } else {
                comprehensiveLimit = "None";
            }
            if (document.getElementById('collisionCheckbox').checked == true) {
                collisionLimit = "N/A";
            } else {
                collisionLimit = "None";
            }
            session.summary = {
                "uninsuredBodilyInjuryLimit": ubi_limit.options[ubi_limit.selectedIndex].text,
                "uninsuredPropertyDamageLimit": upd_limit.options[upd_limit.selectedIndex].text,
                "bodilyInjuryLimit": bi_limit.options[bi_limit.selectedIndex].text,
                "propertyDamageLimit": pd_limit.options[pd_limit.selectedIndex].text,
                "comprehensiveLimit": comprehensiveLimit,
                "collisionLimit": collisionLimit,
                "medicalExpenseLimit": me_limit.options[me_limit.selectedIndex].text,
                "passiveRestraintSystemLimit": prs_limit.options[prs_limit.selectedIndex].text,
                "additionalEquipmentCoverageLimit": ae_limit.options[ae_limit.selectedIndex].text,
                "transportationExpensesLimit": te_limit.options[te_limit.selectedIndex].text,
                "towingLimit": tow_limit.options[tow_limit.selectedIndex].text
            }
            this.$router.push('/summary')
        }
    }
};

const Summary = {
    template: `
        <div class="row justify-content-center mt-2">
            <div class="col-md-7">
            <div class="form-group">
                <center>
                    <h5 id="quoteHeader">Please review the information below before submitting your quote:</h5>
                </center>
            </div>
            <div class="form-group" id="policyInfoGroup">
                <ul>
                    <li class="list-group-item">
                        <nav class="navbar pl-0 pr-0">
                            <span class="navbar-brand mb-0 h6">Policy Term:</span>
                            <span id="policyTermText" class="text-muted mt-1 pr-1"></span>
                        </nav>
                        <nav class="navbar pl-0 pr-0">
                            <span class="navbar-brand mb-0 h6">Quote Number:</span>
                            <span id="policyQuoteText" class="text-muted mt-1 pr-1"></span>
                        </nav>
                    </li>
                    <li class="list-group-item">
                        <nav class="navbar pl-0 pr-0">
                            <span class="navbar-brand mb-0 h6">Primary Insured (Driver)</span>
                        </nav>
                        <small class="ml-4"><b>Full Name:</b></small><br>
                        <span class="ml-4" id="primaryInsuredNameText"></span>
                        <br><br>
                        <small class="ml-4"><b>Address:</b></small><br>
                        <span class="ml-4" id="streetAddressText"></span><br>
                        <span class="ml-4" id="cityStateZipText"></span>
                        <br><br>
                        <small class="ml-4"><b>Phone:</b></small><br>
                        <span class="ml-4" id="phoneNumberText"></span>
                        <br><br>
                        <small class="ml-4"><b>Email:</b></small><br>
                        <span class="ml-4" id="emailText"></span>
                        <br><br>
                    </li>
                    <li class="list-group-item">
                        <nav class="navbar pl-0 pr-0">
                            <span class="navbar-brand mb-0 h6">Vehicle</span>
                        </nav>
                        <small class="ml-4"><b>Year / Make / Model:</b></small><br>
                        <span class="ml-4" id="vehicleYearMakeModelText"></span>
                        <br><br>
                        <small class="ml-4"><b>VIN:</b></small><br>
                        <span class="ml-4" id="vehicleVINText"></span>
                        <br><br>
                        <small class="ml-4"><b>Mileage:</b></small><br>
                        <span class="ml-4" id="vehicleMileageText"></span><br><br>
                    </li>
                </ul>
            </div>
            <div class="form-group" id="policyCoveragesGroup">
                <nav class="navbar pl-0 pr-0">
                    <span class="navbar-brand pl-5 mb-0 h4">Policy Coverages</span>
                </nav>
                <ul>
                    <li class="list-group-item">
                        <nav class="navbar pl-0 pr-0">
                            <span class="navbar-brand mb-0 h6">Uninsured/Underinsured Motorist</span>
                            <span id="totalUninsuredMotorist" class="text-muted mt-1 pr-1">$0.00</span>
                        </nav>
                        <small class="ml-4"><b>Bodily Injury Coverage Limit:</b></small><br>
                        <span class="ml-4" id="uninsuredBodilyInjuryLimit">None</span>
                        <br><br>
                        <small class="ml-4"><b>Property Damage Coverage Limit:</b></small><br>
                        <span class="ml-4" id="uninsuredPropertyDamageLimit">None</span><br><br>
                    </li>
                </ul>
                <nav class="navbar pl-0 pr-0">
                    <span class="navbar-brand pl-5 mb-0 h4">Vehicle Coverages</span>
                </nav>
                <ul>
                    <li class="list-group-item">
                        <nav class="navbar pl-0 pr-0">
                            <span class="navbar-brand mb-0 h6">Bodily Injury</span>
                            <span id="bodilyInjuryTotal" class="text-muted mt-1 pr-1">$0.00</span>
                        </nav>
                        <small class="ml-4"><b>Coverage Limit:</b></small><br>
                        <span class="ml-4" id="bodilyInjuryLimit">None</span><br><br>
                    </li>
                    <li class="list-group-item">
                        <nav class="navbar pl-0 pr-0">
                            <span class="navbar-brand mb-0 h6">Property Damage</span>
                            <span id="propertyDamageTotal" class="text-muted mt-1 pr-1">$0.00</span>
                        </nav>
                        <small class="ml-4"><b>Coverage Limit:</b></small><br>
                        <span class="ml-4" id="propertyDamageLimit">None</span><br><br>
                    </li>
                </ul>
                <nav class="navbar pl-0 pr-0">
                    <span class="navbar-brand pl-5 mb-0 h4">Optional Coverages</span>
                </nav>
                <ul>
                    <li class="list-group-item" id="medicalCoverage">
                        <nav class="navbar pl-0 pr-0">
                            <span class="navbar-brand mb-0 h6">Medical Expense</span>
                            <span id="medicalExpenseTotal" class="text-muted mt-1 pr-1">$0.00</span>
                        </nav>
                        <small class="ml-4"><b>Coverage Limit:</b></small><br>
                        <span class="ml-4" id="medicalExpenseLimit">None</span>
                        <br><br>
                        <small class="ml-4"><b>Passive Restraint System:</b></small><br>
                        <span class="ml-4" id="passiveRestraintSystemLimit">None</span><br><br>
                    </li>
                    <li class="list-group-item" id="comprehensiveCoverage">
                        <nav class="navbar pl-0 pr-0">
                            <span class="navbar-brand mb-0 h6">Comprehensive</span>
                            <span id="comprehensiveTotal" class="text-muted mt-1 pr-1">$0.00</span>
                        </nav>
                    </li>
                    <li class="list-group-item" id="collisionCoverage">
                        <nav class="navbar pl-0 pr-0">
                            <span class="navbar-brand mb-0 h6">Collision</span>
                            <span id="collisionTotal" class="text-muted mt-1 pr-1">$0.00</span>
                        </nav>
                    </li>
                    <li class="list-group-item" id="additionalEquipmentCoverage">
                        <nav class="navbar pl-0 pr-0">
                            <span class="navbar-brand mb-0 h6">Additional Equipment</span>
                            <span id="additionalEquipmentTotal" class="text-muted mt-1 pr-1">$0.00</span>
                        </nav>
                        <small class="ml-4"><b>Coverage Limit:</b></small><br>
                        <span class="ml-4" id="additionalEquipmentCoverageLimit">None</span><br><br>
                    </li>
                    <li class="list-group-item" id="transportationCoverage">
                        <nav class="navbar pl-0 pr-0">
                            <span class="navbar-brand mb-0 h6">Transportation Expenses</span>
                            <span id="transportationExpensesTotal" class="text-muted mt-1 pr-1">$0.00</span>
                        </nav>
                        <small class="ml-4"><b>Coverage Limit:</b></small><br>
                        <span class="ml-4" id="transportationExpensesLimit">None</span><br><br>
                    </li>
                    <li class="list-group-item" id="towingCoverage">
                        <nav class="navbar pl-0 pr-0">
                            <span class="navbar-brand mb-0 h6">Towing</span>
                            <span id="towingTotal" class="text-muted mt-1 pr-1">$0.00</span>
                        </nav>
                        <small class="ml-4"><b>Coverage Limit:</b></small><br>
                        <span class="ml-4" id="towingLimit">None</span><br><br>
                    </li>
                    <li class="list-group-item">
                        <div class="text-right pr-1 pt-2 pb-2" id="totalPremiumSection">
                            <b>Total Premium:</b> <span id="totalPremium" class="text-success">$0.00</span>
                        </div>
                    </li>
                </ul>
            </div>
            <div class="form-group ml-5 mr-3" id="submitNav">
                <center>
                    <small class="text-muted">By clicking 'Submit Quote' below you agree to the terms and premium amounts provided and understand that this is only a demonstration and will not result in actual insurance coverage for your vehicle.</small><br><br>
                    <button class="btn btn-primary" id="submitBttn" @click="submitQuote">Submit Quote</button>
                </center>
            </div>
            <div class="form-group ml-5 mr-3" id="printNav" style="display: none;">
                <center>
                    <button class="btn btn-secondary" @click="printSummary">Print Summary</button>
                </center>
            </div>
            </div>
        </div>
    `,
    mounted() {
        // Policy Term
        if (session.effective_date != null && session.expiration_date != null) {
            document.getElementById('policyTermText').innerHTML = session.effective_date + " to " + session.expiration_date;
        } else {
            document.getElementById('policyTermText').innerHTML = "01-01-2020 to 01-01-2021";
        }
        // Quote Number
        if (session.quote_number != null) {
            document.getElementById('policyQuoteText').innerHTML = session.quote_number;
        } else {
            document.getElementById('policyQuoteText').innerHTML = "Q-AUTO-12345";
        }
        // Primary Insured (Driver)
        if (session.contact_first_name != null && session.contact_last_name != null) {
            if (session.contact_middle_name != null) {
                document.getElementById('primaryInsuredNameText').innerHTML = session.contact_first_name + " " + session.contact_middle_name + " " + session.contact_last_name;
            } else {
                document.getElementById('primaryInsuredNameText').innerHTML = session.contact_first_name + " " + session.contact_last_name;
            }
        } else {
            document.getElementById('primaryInsuredNameText').innerHTML = "John Doe";
        }
        // Address
        if (session.street_address != null && session.city != null && session.state != null && session.zip_code != null) {
            document.getElementById('streetAddressText').innerHTML = session.street_address;
            document.getElementById('cityStateZipText').innerHTML = session.city + ", " + session.state + " " + session.zip_code;
            document.getElementById('phoneNumberText').innerHTML = session.contact_phone_number;
            document.getElementById('emailText').innerHTML = session.contact_email;
        } else {
            document.getElementById('streetAddressText').innerHTML = "123 Main Street";
            document.getElementById('cityStateZipText').innerHTML = "Boston, MA 02110";
            document.getElementById('phoneNumberText').innerHTML = "123-456-7890";
            document.getElementById('emailText').innerHTML = "johndoe@mysite.com";
        }
        // Vehicle
        if (session.vehicle_model_year != null && session.vehicle_make != null && session.vehicle_model != null) {
            document.getElementById('vehicleYearMakeModelText').innerHTML = session.vehicle_model_year + " " + session.vehicle_make + " " + session.vehicle_model;
        } else {
            document.getElementById('vehicleYearMakeModelText').innerHTML = "2019 Mazda CX-9";
        }
        if (session.vehicle_vin != null && session.vehicle_mileage != null) {
            document.getElementById('vehicleVINText').innerHTML = session.vehicle_vin;
            document.getElementById('vehicleMileageText').innerHTML = numberFormat.format(session.vehicle_mileage) + " miles";
        } else {
            document.getElementById('vehicleVINText').innerHTML = "A17DIGITVINNUMBER";
            document.getElementById('vehicleMileageText').innerHTML = "22,300 miles";
        }
        // Policy Coverages
        if (session.summary.uninsuredPropertyDamageLimit != 'None') {
            document.getElementById('totalUninsuredMotorist').innerHTML = formatter.format(session.update_vehicle_risk_response.risk_state['items'].uninsuredMotorist['premium']);
            document.getElementById('uninsuredBodilyInjuryLimit').innerHTML = session.summary.uninsuredBodilyInjuryLimit;
            document.getElementById('uninsuredPropertyDamageLimit').innerHTML = session.summary.uninsuredPropertyDamageLimit;
        }
        // Vehicle Coverages
        if (session.summary.bodilyInjuryLimit != 'None') {
            document.getElementById('bodilyInjuryTotal').innerHTML = formatter.format(session.update_vehicle_risk_response.risk_state['items'].bodilyInjury['premium']);
            document.getElementById('bodilyInjuryLimit').innerHTML = session.summary.bodilyInjuryLimit;
        }
        if (session.summary.propertyDamageLimit != 'None') {
            document.getElementById('propertyDamageTotal').innerHTML = formatter.format(session.update_vehicle_risk_response.risk_state['items'].propertyDamage['premium']);
            document.getElementById('propertyDamageLimit').innerHTML = session.summary.propertyDamageLimit;
        }
        // Optional Coverages
        if (session.summary.medicalExpenseLimit != 'None') {
            document.getElementById('medicalExpenseTotal').innerHTML = formatter.format(session.update_vehicle_risk_response.risk_state['items'].medicalExpense['premium']);
            document.getElementById('medicalExpenseLimit').innerHTML = session.summary.medicalExpenseLimit;
            document.getElementById('passiveRestraintSystemLimit').innerHTML = session.summary.passiveRestraintSystemLimit;
        } else {
            document.getElementById('medicalCoverage').style.display = "none";
        }
        if (session.summary.comprehensiveLimit != 'None') {
            document.getElementById('comprehensiveTotal').innerHTML = formatter.format(session.update_vehicle_risk_response.risk_state['items'].comprehensive['premium']);
        } else {
            document.getElementById('comprehensiveCoverage').style.display = "none";
        }
        if (session.summary.collisionLimit != 'None') {
            document.getElementById('collisionTotal').innerHTML = formatter.format(session.update_vehicle_risk_response.risk_state['items'].collision['premium']);
        } else {
            document.getElementById('collisionCoverage').style.display = "none";
        }
        if (session.summary.additionalEquipmentCoverageLimit != 'None') {
            document.getElementById('additionalEquipmentTotal').innerHTML = formatter.format(session.update_vehicle_risk_response.risk_state['items'].additionalEquipment['premium']);
            document.getElementById('additionalEquipmentCoverageLimit').innerHTML = session.summary.additionalEquipmentCoverageLimit;
        } else {
            document.getElementById('additionalEquipmentCoverage').style.display = "none";
        }
        if (session.summary.transportationExpensesLimit != 'None') {
            document.getElementById('transportationExpensesTotal').innerHTML = formatter.format(session.update_vehicle_risk_response.risk_state['items'].transportationExpenses['premium']);
            document.getElementById('transportationExpensesLimit').innerHTML = session.summary.transportationExpensesLimit;
        } else {
            document.getElementById('transportationCoverage').style.display = "none";
        }
        if (session.summary.towingLimit != 'None') {
            document.getElementById('towingTotal').innerHTML = formatter.format(session.update_vehicle_risk_response.risk_state['items'].towing['premium']);
            document.getElementById('towingLimit').innerHTML = session.summary.towingLimit;
        } else {
            document.getElementById('towingCoverage').style.display = "none";
        }
        // Premium Total
        if (session.update_vehicle_risk_response.risk_state['total_premium'] != null) {
            document.getElementById('totalPremium').innerHTML = formatter.format(session.update_vehicle_risk_response.risk_state['total_premium']);
        }
    },
    methods: {
        submitQuote: function() {
            document.getElementById('quoteHeader').innerHTML = "<h5>Submitting your personal auto quote...</h5><br><br><i class=\"fa fa-spinner fa-pulse fa-4x fa-fw\"></i>";
            document.getElementById('policyInfoGroup').style.display = "none";
            document.getElementById('policyCoveragesGroup').style.display = "none";
            document.getElementById('submitNav').style.display = "none";
            apiClient.post('/api/quote/' + session.quote_number + '/submit/')
                .then(response => {
                    console.log(response.data);
                    session.submit_response = response.data;
                    document.getElementById('quoteHeader').innerHTML = "<h4>Thank you for your submission!</h4><br><br><span class=\"text-muted\">Someone will contact you shortly regarding your personal auto quote.</span><br><br>";
                    document.getElementById('policyInfoGroup').style.display = "block";
                    document.getElementById('policyCoveragesGroup').style.display = "block";
                    document.getElementById('printNav').style.display = "block";
                })
                .catch(error => {
                    console.log('There was an error:', error.response);
                    document.getElementById('quoteHeader').innerHTML = "<h5>There was an error completing your request.</h5>";
                });
        },
        printSummary: function() {
            window.print();
        }
    }
};

const routes = [
    {
        path: '/',
        name: 'Start',
        components: {
            default: Start
        }
    },
    {
        path: '/effective',
        name: 'Effective',
        component: Effective,
    },
    {
        path: '/products',
        name: 'Products',
        component: Products,
    },
    {
        path: '/contact',
        name: 'Contact',
        component: Contact,
    },
    {
        path: '/drivers',
        name: 'Drivers',
        component: Drivers,
    },
    {
        path: '/questions',
        name: 'Questions',
        component: Questions,
    },
    {
        path: '/vehicles',
        name: 'Vehicles',
        component: Vehicles,
    },
    {
        path: '/coverages',
        name: 'Coverages',
        component: Coverages,
    },
    {
        path: '/summary',
        name: 'Summary',
        component: Summary,
    }
];

const router = new VueRouter({
    routes
});

new Vue({
  router,
  delimiters: ['[[', ']]'],
  el: '#demoapp'
}).$mount('#demoapp');
