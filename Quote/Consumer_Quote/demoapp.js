if (window.self !== window.top) {
    // Remove the copyright if in an iFrame
    document.getElementById("copyright").innerHTML = "";
}

var session = {}

var formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});
var numberFormat = new Intl.NumberFormat();

const apiClient = createAPIClient();
const axios_auth_type = auth_type;
const axios_api_key = apiKey;

const waitUntil = (condition) => {
    return new Promise((resolve) => {
        let interval = setInterval(() => {
            if (!condition()) {
                return
            }

            clearInterval(interval)
            resolve()
        }, 100)
    })
};

function validateZip() {
    session['zip_code'] = document.getElementById('zipCode').value;

    // Validate zip code
    if(session.zip_code === '') {
        document.getElementById('zipCode').style.borderColor = "red";
        document.getElementById('zipError').style.display = "block";
    } else {
        router.push('/effective');
    }
};

function validateEffectiveDate() {
    session['effective_date'] = document.getElementById('effectiveDate').value;
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
        session['expiration_date'] = [year, month, day].join('-');
    }

    // Validate effective date
    if(session.effective_date === '' || session.effective_date === null) {
        document.getElementById('effectiveDate').style.borderColor = "red";
        document.getElementById('effDateError').style.display = "block";
    } else {
        router.push('/products');
    }
};

function getLocationFromZip() {
    if (session.zip_code !== null) {
        payload = JSON.stringify({
            "zip": session.zip_code
        });
        console.log('POST: ' + '/api/v1/contacts/retrieveAddressInfoFromZip');
        console.log('PAYLOAD: ' + payload);
        apiClient.post('/api/v1/contacts/retrieveAddressInfoFromZip', payload)
            .then(response => {
                console.log(response.data);
                session['address_info'] = response.data;
                for (var key in session.address_info) {
                    // Store the city and state for later
                    if (key === 'cities') {
                        session['city'] = session.address_info[key][0];
                    }
                    if (key === 'stateAbbr') {
                        session['state'] = session.address_info[key];
                    }
                }
                document.getElementById('quoteHeader').innerHTML = "<h5>When do you need coverage to start?</h5><br>";
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
                session['today'] = yyyy + '-' + mm + '-' + dd;
                document.getElementById("effectiveDate").setAttribute("min", session.today);
            })
            .catch(error => {
                console.log('There was an error:', error.response);
            });
    }
};

function createQuote(prod_label, prod_name, prod_version_id) {
    session['product_label'] = prod_label;
    session['selected_product'] = prod_name;
    document.getElementById('quoteHeader').innerHTML = "<h5>Creating " + prod_label + " quote...</h5><br><br><i class=\"fa fa-spinner fa-pulse fa-4x fa-fw\"></i>";
    document.getElementById('productList').style.display = "none";
    payload = JSON.stringify({
        'effective_date': session.effective_date,
        'expiration_date': session.expiration_date,
        'product_name': session.selected_product,
        'agency': {
          'id': '7acc9325-a1d1-4787-9a0c-1d5150551321' // Agency id is Test Agency
        },
        'agents': [
          {
            'id': 'f66d368b-64af-4794-b038-2be3e3bfc598' // Agent id is Test Agent
          }
        ]
    });
    console.log('POST: ' + '/api/quote/');
    console.log('PAYLOAD: ' + payload);
    apiClient.post('/api/quote/', payload)
        .then(response => {
            console.log(response.data);
            session['product_label'] = prod_label;
            session['product_version_id'] = prod_version_id;
            session['quote_info'] = response.data;
            session['quote_number'] = session.quote_info['quote_number'];
            router.push('/contact');
        })
        .catch(error => {
            console.log('There was an error:', error.response);
        });
};

function getProducts() {
  document.getElementById('quoteHeader').innerHTML = "<h5>Looking for available coverages in " + session.city + ', ' + session.state + "...</h5><br><br><i class=\"fa fa-spinner fa-pulse fa-4x fa-fw\"></i>";
  console.log('GET: ' + '/api/quote/quotable-products/');
  apiClient.get('/api/quote/quotable-products/')
      .then(response => {
          console.log(response.data);
          session['quotable_products'] = response.data;
          if (session.quotable_products !== null) {
              document.getElementById('quoteHeader').innerHTML = "<h5>What type of insurance coverage do you need?</h5><br>";
              var product_list_html = "";
              for (var key in session.quotable_products) {
                  var product = session.quotable_products[key];
                  if (product.parent_product == null && product.version.previous == null
                    && product.line.description.includes('Personal')) {
                    var product_label = product.label;
                    var product_name = product.name;
                    var product_version_id = product.version.id;
                    var icon = "fa fa-question"; // Default
                    // Determine which icons to use
                    if (product_label.toLowerCase().includes('homeowners')) {
                      icon = "fa fa-home";
                      product_list_html += "<a href=\"#\" data-toggle=\"tooltip\" title=\"" + product_label + "\" onclick=\"createQuote(\'" + product_label + "\' , \'" + product_name + "\' , \'" + product_version_id + "\')\">";
                      product_list_html += "<div class=\"card pd-2 m-2 border-dark text-center text-dark\" id=\"" + product_name + "\" style=\"width: 8rem;\">";
                      // Personal Auto
                    } else if (product_label.toLowerCase().includes('general auto')) {
                      product_label = product_label.replace('General', 'Personal');
                      icon = "fa fa-car";
                      product_list_html += "<a href=\"#\" data-toggle=\"tooltip\" title=\"" + product_label + "\" onclick=\"createQuote(\'" + product_label + "\' , \'" + product_name + "\' , \'" + product_version_id + "\')\">";
                      product_list_html += "<div class=\"card pd-2 m-2 border-dark text-center text-dark\" id=\"" + product_name + "\" style=\"width: 8rem;\">";
                      // Personal Umbrella
                    } else if (product_label.toLowerCase().includes('umbrella')) {
                      icon = "fa fa-umbrella";
                      product_list_html += "<a href=\"#\" data-toggle=\"tooltip\" title=\"" + product_label + "\" disabled>";
                      product_list_html += "<div class=\"card pd-2 m-2 border-dark text-center text-muted\" id=\"" + product_name + "\" style=\"width: 8rem;\">";
                      // Pet Insurance
                    } else if (product_label.toLowerCase().includes('pet')) {
                      icon = "fa fa-paw";
                      product_list_html += "<a href=\"#\" data-toggle=\"tooltip\" title=\"" + product_label + "\" disabled>";
                      product_list_html += "<div class=\"card pd-2 m-2 border-dark text-center text-muted\" id=\"" + product_name + "\" style=\"width: 8rem;\">";
                      // Personal Inland Marine
                    } else if (product_label.toLowerCase().includes('marine')) {
                      icon = "fa fa-camera";
                      product_list_html += "<a href=\"#\" data-toggle=\"tooltip\" title=\"" + product_label + "\" disabled>";
                      product_list_html += "<div class=\"card pd-2 m-2 border-dark text-center text-muted\" id=\"" + product_name + "\" style=\"width: 8rem;\">";
                    }

                    product_list_html += "<div class=\"card-body\"><i class=\"" + icon + " fa-4x\" aria-hidden=\"true\"></i></div></div></a>";
                  }
              }
              document.getElementById('productList').innerHTML = product_list_html;
          } else {
              document.getElementById('quoteHeader').innerHTML = "<h4>Oops! It looks like there was a problem while retrieving available insurance products. Please try again.</h4>";
          }

      })
      .catch(error => {
          console.log('There was an error:', error.response);
      });
};

function getRiskTypes() {
  document.getElementById('quoteHeader').innerHTML = "<h5>Getting risk types...</h5><br><br><i class=\"fa fa-spinner fa-pulse fa-4x fa-fw\"></i>";
  console.log('GET: ' + 'api/lines/products/' + session.selected_product + '/risk-types/?version_id=' + session.product_version_id);
  apiClient.get('api/lines/products/' + session.selected_product + '/risk-types/?version_id=' + session.product_version_id)
      .then(response => {
          console.log(response.data.children);
          session['risk_types'] = response.data.children;
          if (session.risk_types !== null) {
              document.getElementById('quoteHeader').innerHTML = "<h5>What do you need covered?</h5><br><br>";
              var risk_amounts_html = "";
              // Determine questions to ask regarding how many risks
              // console.log(session.product_label);
              if (session.product_label.toLowerCase().includes('homeowners')) {
                var ask_num_homes = false;
                session.risk_types.forEach(function(risk_type) {
                  // console.log(risk_type);
                  if (risk_type.name.toLowerCase().includes('home')) {
                    // Ask how many homes?
                    ask_num_homes = true;
                  }
                });
                // Generate Questions
                if (ask_num_homes == true) {
                  risk_amounts_html += "<label><b>Number of Homes:</b></label>";
                  risk_amounts_html += "<input type=\"number\" class=\"form-control\" id=\"numberOfHomes\" min=\"1\" max=\"10000\" onKeyUp=\"if(this.value>9999){this.value='10000';}else if(this.value<=0){this.value='1';}\" value=\"1\" required><br>";
                }
              } else if (session.product_label.toLowerCase().includes('auto')) {
                var ask_num_drivers = false;
                var ask_num_vehicles = false;
                session.risk_types.forEach(function(risk_type) {
                  // console.log(risk_type);
                  if (risk_type.name.toLowerCase().includes('driver')) {
                    // Ask how many drivers?
                    ask_num_drivers = true;
                  }
                  if (risk_type.name.toLowerCase().includes('vehicle')) {
                    // Ask how many vehicles?
                    ask_num_vehicles = true;
                  }
                });
                // Generate Questions
                if (ask_num_drivers == true) {
                  risk_amounts_html += "<label><b>Number of Drivers:</b></label>";
                  risk_amounts_html += "<input type=\"number\" class=\"form-control\" id=\"numberOfDrivers\" min=\"1\" max=\"10000\" onKeyUp=\"if(this.value>9999){this.value='10000';}else if(this.value<=0){this.value='1';}\" value=\"1\" required><br>";
                }
                if (ask_num_vehicles == true) {
                  risk_amounts_html += "<label><b>Number of Vehicles:</b></label>";
                  risk_amounts_html += "<input type=\"number\" class=\"form-control\" id=\"numberOfVehicles\" min=\"1\" max=\"10000\" onKeyUp=\"if(this.value>9999){this.value='10000';}else if(this.value<=0){this.value='1';}\" value=\"1\" required><br>";
                }
              } else if (session.product_label.toLowerCase().includes('umbrella')) {
                // Do something
              } else if (session.product_label.toLowerCase().includes('pet')) {
                // Do something
              } else if (session.product_label.toLowerCase().includes('marine')) {
                // Do something
              }
              document.getElementById('howManyRisks').innerHTML = risk_amounts_html;
          } else {
              document.getElementById('quoteHeader').innerHTML = "<h4>Oops! It looks like there was a problem while retrieving available risk types. Please try again.</h4>";
          }

      })
      .catch(error => {
          console.log('There was an error:', error.response);
      });
};

function getRiskFields(risk_type_name, risk_count, order = null) {
  risk_fields = [];
  if (order == null) {
    order = Object.keys(session.risks).legnth + 1;
  }
  session.risks[risk_type_name] = {
    'order': order,
    'risks': []
  };
  console.log('GET: ' + 'api/lines/products/' + session.selected_product + '/risk-types/' + risk_type_name + '/risk-fields/?version_id=' + session.product_version_id);
  apiClient.get('api/lines/products/' + session.selected_product + '/risk-types/' + risk_type_name + '/risk-fields/?version_id=' + session.product_version_id)
      .then(response => {
          console.log(response.data.results);
          session['risk_fields'] = response.data.results;
          session.risk_fields.forEach(function(field) {
            var options = null;
            var isRequired = false;
            if (field.optional == false) {
              isRequired = true;
            } else if (field.optional == true) {
              isRequired = false;
            }
            // Add field to array
            risk_fields.push(
              {
                'name': field.name,
                'label': field.label,
                'default': field.default,
                'options': options,
                'type': field.type,
                'order': field.order,
                'required': isRequired
              }
            );
          });

          // Add default fields to each risk
          var default_fields = {};
          if (risk_fields) {
            risk_fields.forEach(function(risk_field) {
              // TODO: ADD CONDITIONAL HANDLING OF DEFAULT VALUES
              if (!risk_field.name.toLowerCase().includes('customerid')) {
                default_fields[risk_field.order] = {
                  'name': risk_field.name,
                  'label': risk_field.label,
                  'type': risk_field.type,
                  'options': risk_field.options,
                  'value': risk_field.default,
                  'required': risk_field.required
                };
              }
            });
          }
          // Add default_fields to each risk
          for (var i = 0; i < risk_count; i++) {
            session.risks[risk_type_name].risks.push(default_fields);
          }
      })
      .catch(error => {
          console.log('There was an error:', error.response);
      });
};

function getFieldOptions(risk_type_name, field_name, risk_index, field_index) {
  console.log('GET: ' + 'api/lines/products/' + session.selected_product + '/risk-types/' + risk_type_name + '/risk-fields/'+ field_name +'/?version_id=' + session.product_version_id);
  apiClient.get('api/lines/products/' + session.selected_product + '/risk-types/' + risk_type_name + '/risk-fields/'+ field_name +'/?version_id=' + session.product_version_id)
      .then(response => {
          session.risks[risk_type_name].risks[risk_index][field_index].options = response.data.options;
          console.log(response.data.options);
      })
      .catch(error => {
          console.log('There was an error:', error.response);
      });
};

async function getMissingOptions(risk_type_name, keyword = 'limit') {
  // Get all missing options for each coverage
  for (var i = 0; i < Object.keys(session.risks[risk_type_name].risks[0]).length; i++) {
    var name = session.risks[risk_type_name].risks[0][i].name;
    var type = session.risks[risk_type_name].risks[0][i].type;
    var required = session.risks[risk_type_name].risks[0][i].required;
    // Only those with limit in their name
    if (name.toLowerCase().includes(keyword) && type == 'enum' && required == true) {
      var options = session.risks[risk_type_name].risks[0][i].options;
      // If no options exist
      if (options == null) {
        // console.log('No options found for ' + name + '. Getting them now...');
        // Get options
        await getFieldOptions(risk_type_name, name, 0, i);
      }
      // Wait until the options array is available
      await waitUntil(() => session.risks[risk_type_name].risks[0][i].options != null)
    }
  }
};

function getCoverageItems(risk_type_name) {
  console.log('GET: ' + 'api/lines/products/' + session.selected_product + '/risk-types/' + risk_type_name + '/risk-items/?version_id=' + session.product_version_id);
  apiClient.get('api/lines/products/' + session.selected_product + '/risk-types/' + risk_type_name + '/risk-items/?version_id=' + session.product_version_id)
      .then(response => {
          console.log(response.data.results);
          session[risk_type_name +'_coverage_items'] = response.data.results;
      })
      .catch(error => {
          console.log('There was an error:', error.response);
      });
};

function updateFieldAnswers(risk_quote_id, field_answers, attempts = 1) {
  var max_attempts = 3;
  payload = JSON.stringify({
    'field_answers': field_answers
  });
  console.log('PATCH: ' + 'api/quote/risks/' + risk_quote_id + '/fields/');
  console.log('PAYLOAD: ' + payload);
  apiClient.patch('api/quote/risks/' + risk_quote_id + '/fields/', payload)
      .then(response => {
          field_answers = response.data.risk_state.field_answers;
          console.log(field_answers);
      })
      .catch(error => {
          console.log('There was an error:', error.response);
          // If internal server error, try again based on number of attempts
          if (error.response.status == 500 || error.response.status == 504) {
            if (attempts < max_attempts) {
              console.log('Internal Server Error. Trying again...');
              attempts += 1;
              this.updateFieldAnswers(risk_quote_id, field_answers, attempts);
            }
          }
      });
};

function generateContact(last_name = null) {
  var first_names = [
    'Jenny',
    'Jack',
    'Jeff',
    'Susan',
    'Jamie',
    'Sara',
    'Mark',
    'Bill',
    'William',
    'Fred',
    'Pam',
    'Sarah',
    'Anne',
    'Billy',
    'Molly',
    'Wayne',
    'Tom',
    'James',
    'Sam'
  ];
  var last_names = [
    'Smith',
    'Insured',
    'Jones',
    'Miller',
    'Johnson',
    'Thomas',
    'Williams',
    'Brown',
    'Davis',
    'Garcia',
    'Wilson',
    'Anderson',
    'Martin',
    'Harris',
    'Jackson',
    'White',
    'Andrews'
  ];
  var sites = [
    'site.com',
    'test.com',
    'mysite.com',
    'testsite.com',
    'testinsured.com',
    'myisp.com'
  ];
  var dobs = [
    '1978-04-15',
    '1980-06-03',
    '1967-03-08',
    '1948-12-17',
    '1950-07-01',
    '1982-11-14',
    '1990-08-05',
    '1955-05-09',
    '1960-10-02'
  ];
  // Name
  var first_name = first_names[Math.floor(Math.random() * first_names.length)];
  if (last_name == null) {
    last_name = last_names[Math.floor(Math.random() * last_names.length)];
  }

  // Make sure new contact isn't a duplicate of the policy contact
  var contact_name = session.contact_first_name + ' ' + session.contact_last_name;
  var new_contact_name = first_name + ' ' + last_name;
  // Only loop when names are the same and until names are different
  while (new_contact_name == contact_name) {
    // Generate a new first name
    first_name = first_names[Math.floor(Math.random() * first_names.length)];
    new_contact_name = first_name + ' ' + last_name;
  }

  // Email
  var site = sites[Math.floor(Math.random() * sites.length)];
  var email = first_name.toLowerCase() + '.' + last_name.toLowerCase() + '@' + site;

  // DOB
  var dob = dobs[Math.floor(Math.random() * dobs.length)];

  // License Number (8 digits)
  var license = 'DL' + parseInt((Math.random() * 9 + 1) * Math.pow(10, 9-1), 10);

  var new_contact = {
    'contactFirstName': first_name,
    'contactMiddleName': '',
    'contactLastName': last_name,
    'contactStreet': '123 Main Street',
    'contactCity': 'Boston',
    'contactState': 'MA',
    'contactZip': '02110',
    'contactPhone': '123-456-7890',
    'contactEmail': email,
    'contactDOB': dob,
    'contactLicense': license
  };
  return new_contact;
};

function generateRisk(risk_type) {
  // This will generate a random risk based on risk type
  if (risk_type == 'vehicles' || risk_type == 'vehicle') {
    // Generate a random VIN, Make, Model, Model Year and mileage
    var vin = Array(17).fill(0).map(x => Math.random().toString(36).charAt(2)).join('').toUpperCase(); // Random 17 character VIN
    var years = ['2021', '2020', '2019', '2018', '2017', '2016', '2015', '2013', '2012', '2011', '2010']
    var makers = ['Honda', 'Toyota', 'Ford', 'Mazda'];
    var hondaModels = ['Civic', 'CR-V', 'Accord', 'Odyssey', 'Pilot', 'Passport'];
    var toyotaModels = ['Corolla', 'Camry', 'Prius', 'Tacoma', 'Sienna'];
    var fordModels = ['Mustang', 'Fiesta', 'Explorer', 'F-150', 'Fusion', 'Escape', 'Expedition', 'Taurus'];
    var mazdaModels = ['CX-9', 'Miata', 'Tribute', 'CX-3', 'CX-5'];
    var year = years[Math.floor(Math.random() * years.length)];
    var make = makers[Math.floor(Math.random() * makers.length)];
    var model = '';
    if (make == 'Honda') {
        model = hondaModels[Math.floor(Math.random() * hondaModels.length)];
    } else if (make == 'Toyota') {
        model = toyotaModels[Math.floor(Math.random() * toyotaModels.length)];
    } else if (make == 'Ford') {
        model = fordModels[Math.floor(Math.random() * fordModels.length)];
    } else if (make == 'Mazda') {
        model = mazdaModels[Math.floor(Math.random() * mazdaModels.length)];
    }
    var vehicle = {
        "vin": vin,
        "model_year": year,
        "make": make,
        "model": model,
        "mileage": Math.floor(Math.random() * 10000 + 2000)
    };
    return vehicle;
  } else {
    return null;
  }
};

function generateRiskTable(risk_type) {
  var riskTablesHTML = "";
  var risk_name = risk_type.charAt(0).toUpperCase() + risk_type.slice(1);
  if (risk_type == 'homes') {
    // Header
    riskTablesHTML += "<h5>" + risk_name + "</h5>";
    riskTablesHTML += "<table class=\"table table-striped\">"
    riskTablesHTML += "<thead><tr>";
    riskTablesHTML += "<th scope=\"col\"></th>";
    riskTablesHTML += "<th scope=\"col\">Property Address</th>";
    riskTablesHTML += "<th scope=\"col\">Type</th>";
    riskTablesHTML += "</tr></thead>";
    // Risks
    riskTablesHTML += "<tbody>";
    var risks = Object.values(session.risk_state.risk_data)
    risks.forEach(function(risk) {
      var risk_key = Object.keys(risk);
      if (risk_key == 'home') {
        var keys = Object.keys(risk.home);
        var values = Object.values(risk.home);
        riskTablesHTML += "<tr><th scope=\"row\"></th>";
        // Property Address
        var full_address = "Unknown";
        for (var i = 0; i < keys.length; i++) {
          if (keys[i].toLowerCase().includes('riskaddress')) {
            full_address = values[i];
          } else if (keys[i].toLowerCase().includes('city')) {
            full_address += ', ' + values[i];
          } else if (keys[i].toLowerCase().includes('state')) {
            full_address += ', ' + values[i];
          } else if (keys[i].toLowerCase().includes('zipcode')) {
            full_address += ' ' + values[i];
          }
        }
        riskTablesHTML += "<td>" + full_address + "</td>";
        // Type
        var type = "Unknown";
        for (var j = 0; j < keys.length; j++) {
          if (keys[j].toLowerCase().includes('hometype')) {
            var home_type = values[j];
            if (home_type.toLowerCase().includes('primary')) {
              type = "Primary";
            } else if (home_type.toLowerCase().includes('secondary')) {
              type = "Secondary";
            } else {
              type = "Other";
            }
          }
        }
        riskTablesHTML += "<td>" + type + "</td>";
        riskTablesHTML += "</tr>";
      }
    });
    riskTablesHTML += "</tbody></table><br>";
  } else if (risk_type == 'drivers') {
    // Header
    riskTablesHTML += "<h5>" + risk_name + "</h5>";
    riskTablesHTML += "<table class=\"table table-striped\">"
    riskTablesHTML += "<thead><tr>";
    riskTablesHTML += "<th scope=\"col\"></th>";
    riskTablesHTML += "<th scope=\"col\">Name</th>";
    riskTablesHTML += "<th scope=\"col\">Date of Birth</th>";
    riskTablesHTML += "<th scope=\"col\">Gender</th>";
    riskTablesHTML += "</tr></thead>";
    // Risks
    riskTablesHTML += "<tbody>";
    var risks = Object.values(session.risk_state.risk_data)
    risks.forEach(function(risk) {
      var risk_key = Object.keys(risk);
      if (risk_key == 'driver') {
        var keys = Object.keys(risk.driver);
        var values = Object.values(risk.driver);
        riskTablesHTML += "<tr><th scope=\"row\"></th>";
        // Name
        for (var i = 0; i < keys.length; i++) {
          if (keys[i].toLowerCase().includes('name')) {
            riskTablesHTML += "<td>" + values[i] + "</td>";
          }
        }
        // Date of Birth
        for (var j = 0; j < keys.length; j++) {
          if (keys[j].toLowerCase().includes('dob')) {
            var date = formatDate(values[j]);
            riskTablesHTML += "<td>" + date + "</td>";
          }
        }
        // Gender
        for (var k = 0; k < keys.length; k++) {
          if (keys[k].toLowerCase().includes('gender')) {
            var gender = 'Unknown';
            if (values[k].toLowerCase().includes('female')) {
              gender = 'Female';
            } else {
              gender = 'Male';
            }
            riskTablesHTML += "<td>" + gender + "</td>";
          }
        }
        riskTablesHTML += "</tr>";
      }
    });
    riskTablesHTML += "</tbody></table><br>";
  } else if (risk_type == 'vehicles') {
    // Risk Table
    riskTablesHTML += "<h5>" + risk_name + "</h5>";
    riskTablesHTML += "<table class=\"table table-striped\">"
    riskTablesHTML += "<thead><tr>";
    riskTablesHTML += "<th scope=\"col\"></th>";
    riskTablesHTML += "<th scope=\"col\">Name</th>";
    riskTablesHTML += "<th scope=\"col\">VIN</th>";
    riskTablesHTML += "<th scope=\"col\">Principal Driver</th>";
    riskTablesHTML += "</tr></thead>";
    // Risks
    riskTablesHTML += "<tbody>";
    var risks = Object.values(session.risk_state.risk_data)
    risks.forEach(function(risk) {
      var risk_key = Object.keys(risk);
      if (risk_key == 'vehicle') {
        var keys = Object.keys(risk.vehicle);
        var values = Object.values(risk.vehicle);
        riskTablesHTML += "<tr><th scope=\"row\"></th>";
        // Name (Model Year + Make + Model)
        var year = '';
        var make = '';
        var model = '';
        for (var i = 0; i < keys.length; i++) {
          if (keys[i].toLowerCase().includes('year')) {
            year = values[i];
          }
          if (keys[i].toLowerCase() == 'make') {
            make = values[i];
          }
          if (keys[i].toLowerCase() == 'model') {
            model = values[i];
          }
        }
        riskTablesHTML += "<td>" + year + ' ' + make + ' ' + model + "</td>";
        // VIN
        for (var j = 0; j < keys.length; j++) {
          if (keys[j].toLowerCase().includes('vin')) {
            riskTablesHTML += "<td>" + values[j] + "</td>";
          }
        }
        // Principal Driver
        for (var k = 0; k < keys.length; k++) {
          if (keys[k].toLowerCase().includes('driver') || keys[k].toLowerCase().includes('principal')) {
            var driver_name = values[k].name;
            riskTablesHTML += "<td>" + driver_name + "</td>";
          }
        }
        riskTablesHTML += "</tr>";
      }
    });
    riskTablesHTML += "</tbody></table><br>";
  } else {
    // Risk Table
    riskTablesHTML += "<h5>" + risk_name + "</h5>";
    riskTablesHTML += "<table class=\"table table-striped\">"
    riskTablesHTML += "<thead><tr>";
    riskTablesHTML += "<th scope=\"col\">Name</th>";
    riskTablesHTML += "</tr></thead>";
    // Risks
    riskTablesHTML += "<tbody>";
    riskTablesHTML += "<td>This has not been done yet!</td>";
    riskTablesHTML += "</tbody></table><br>";
  }
  return riskTablesHTML;
};

async function generateCoverageGroup(risk_type, number = null, items = null, read_only=false) {
  var coverageGroupHTML = "";
  var singular_risk_type = risk_type;
  // Get current risk type name (in singular form)
  if (pluralize.isPlural(risk_type)) {
    singular_risk_type = pluralize.singular(risk_type);
  }
  // Capitalize first letter of risk type name
  var risk_type_name = singular_risk_type.charAt(0).toUpperCase() + singular_risk_type.slice(1);
  // console.log(risk_type);
  // console.log(singular_risk_type);
  // console.log(risk_type_name);
  if (number != null) {
    coverageGroupHTML += "<div class=\"form-group\" id=\"" + singular_risk_type + "_" + number + "_CoveragesGroup\">";
  } else {
    // This is likely a policy risk type
    coverageGroupHTML += "<div class=\"form-group\" id=\"" + singular_risk_type + "CoveragesGroup\">";
  }
  coverageGroupHTML += "<nav class=\"navbar pl-0 pr-0\">";
  coverageGroupHTML += "<span class=\"navbar-brand pl-0 mb-0 h4\">" + risk_type_name + " Coverages</span>";
  coverageGroupHTML += "</nav>";

  var risk_quotes = session.quote_risks.risk_quotes;
  var product_label = session.product_label;

  // Determine which risk_type to use then check for missing options
  var use_risk_type = null;
  if (risk_type == 'policy') {
    use_risk_type = risk_type;
    // await getMissingOptions(use_risk_type, 'uninsured');
  } else if (risk_type == 'homes') {
    use_risk_type = risk_type;
  } else if (risk_type == 'vehicles') {
    use_risk_type = risk_type;
    await getMissingOptions(use_risk_type, 'uninsured');
    await getMissingOptions(use_risk_type, 'bodilyinjury');
    await getMissingOptions(use_risk_type, 'propertydamage');
  } else if (risk_type == 'optional') {
    if (product_label.toLowerCase().includes('homeowners')) {
      use_risk_type = risk_type;
    } else if (product_label.toLowerCase().includes('auto')) {
      use_risk_type = 'vehicles';
      await getMissingOptions(use_risk_type, 'limit');
    }
  } else {
    use_risk_type = risk_type;
    await getMissingOptions(use_risk_type, 'limit');
  }

  // Policy Level Coverages
  if (risk_type == 'policy') {
    // console.log(session.risks[risk_type].risks);

  // Home Coverages
  } else if (risk_type == 'homes') {
    // console.log(session.risks[risk_type].risks);
    await getCoverageItems('homes');
    await waitUntil(() => 'homes_coverage_items' in session);
    var homes_coverage_items = session.homes_coverage_items;

    // Sort by order
    homes_coverage_items.sort((a,b)=> (a.order > b.order ? 1 : -1));
    // console.log(homes_coverage_items)

    // Defaults

    // Default premium values
    var home_premiums = {};
    homes_coverage_items.forEach(function(coverage) {
      if (coverage.presence.toLowerCase().includes('mandatory')) {
        home_premiums[coverage.name] = 0;
      }
    });

    if (items != null) {
      // console.log(items);
      homes_coverage_items.forEach(function(coverage) {
        if (coverage.presence.toLowerCase().includes('mandatory')) {
          // console.log(coverage.name)
          home_premiums[coverage.name] = items[coverage.name].premium;
        }
      });
    } else {
      risk_quotes.forEach(function(risk_quote) {
        if (risk_quote.risk_state.type.name.toLowerCase().includes('homes')) {
          homes_coverage_items.forEach(function(coverage) {
            if (coverage.presence.toLowerCase().includes('mandatory')) {
              home_premiums[coverage.name] = risk_quote.risk_state.items[coverage.name].premium;
            }
          });
        }
      });
    }
    // console.log(home_premiums);

    coverageGroupHTML += "<ul style=\"padding-inline-start: 0;\">";
    homes_coverage_items.forEach(async function(item) {
      // Only get mandatory coverages
      if (item.presence == 'mandatory' && item.type == 'coverage') {
        coverageGroupHTML += "<li class=\"list-group-item\">";
        coverageGroupHTML += "<nav class=\"navbar pl-0 pr-0\">";
        coverageGroupHTML += "<span class=\"navbar-brand mb-0 h6\"><input type=\"checkbox\" checked disabled>&nbsp; " + item.label + "</span>";
        coverageGroupHTML += "<span id=\"" + item.name + "Total" + number + "\" class=\"text-muted mt-1 pr-1\">" + formatter.format(home_premiums[item.name]) + "</span></nav>";
        // Coverage Descriptions
        if (item.label.toLowerCase().includes('coverage a')) {
          coverageGroupHTML += "<small>Covers damage to the house. The face amount of the policy (for example $100,000) is the most you will receive if your house is totally destroyed.</small>";
        } else if (item.label.toLowerCase().includes('coverage b')) {
          coverageGroupHTML += "<small>Covers damage to other structures or buildings, such as a detached garage, work shed, or fencing.</small>";
        } else if (item.label.toLowerCase().includes('coverage c')) {
          coverageGroupHTML += "<small>Covers damage to, or loss of personal property. Personal property includes household contents and other personal belongings used, owned or worn by you and your family.</small>";
        } else if (item.label.toLowerCase().includes('coverage d')) {
          coverageGroupHTML += "<small>Covers additional living expenses when incurred. This means that the policy covers the necessary living expenses up to the stated limit, incurred by the insured to continue, as nearly as possible, the normal standard of living when the house cannot be occupied due to a covered loss.</small>";
        } else if (item.label.toLowerCase().includes('coverage e')) {
          coverageGroupHTML += "<small>Covers personal liability. This coverage protects you against claims arising from accidents to others on property that you own or rent. With a few exceptions, such as auto or boating accidents, it is an all purpose liability policy that follows you wherever you go.</small>";
        } else if (item.label.toLowerCase().includes('coverage f')) {
          coverageGroupHTML += "<small>Covers medical expenses. Coverage is limited to an amount per person and per accident for injuries occurring on your premises to persons other than an insured, or elsewhere, if caused by you, a member of your family, or your pets. An important feature of this coverage is that payment is made regardless of legal liability.</small>";
        } else if  (item.label.toLowerCase().includes('loss')) {
          coverageGroupHTML += "<small>Covers any increases in living expenses, like the cost of a hotel, while your home is being rebuilt or restored. It also reimburses you for lost rental income, and it may also reimburse you for lost rental income or additional living expenses if a local authority prohibits you or your tenants from returning to your property.</small>";
        }
        coverageGroupHTML += "</li>";
      }
    });
    coverageGroupHTML += "</ul>";

  // Vehicle Coverages (For personal auto only)
  } else if (risk_type == 'vehicles') {
    // console.log(session.risks[risk_type].risks);
    await getCoverageItems('vehicles');
    await waitUntil(() => 'vehicles_coverage_items' in session);
    var vehicles_coverage_items = session.vehicles_coverage_items;

    // Sort by order
    vehicles_coverage_items.sort((a,b)=> (a.order > b.order ? 1 : -1));
    // console.log(vehicles_coverage_items)

    // Defaults
    var name = null;
    var type = null;
    var required = null;
    var value = null;
    var options = null;
    var uninsuredMotorist_index = 0;
    var bodilyInjury_index = 0;
    var propertyDamage_index = 0;

    // Default premium values
    var bodilyInjuryPremium = 0;
    var propertyDamagePremium = 0;

    if (items != null) {
      uninsuredMotoristPremium = items.uninsuredMotorist.premium;
      bodilyInjuryPremium = items.bodilyInjury.premium;
      propertyDamagePremium = items.propertyDamage.premium;
    } else {
      risk_quotes.forEach(function(risk_quote) {
        if (risk_quote.risk_state.type.name.toLowerCase().includes('vehicles')) {
          uninsuredMotoristPremium = risk_quote.risk_state.items.uninsuredMotorist.premium;
          bodilyInjuryPremium = risk_quote.risk_state.items.bodilyInjury.premium;
          propertyDamagePremium = risk_quote.risk_state.items.propertyDamage.premium;

        }
      });
    }

    var risk_count = Object.values(session.risks[risk_type].risks[0]).length;
    for (var i = 0; i < risk_count; i++) {
      name = session.risks[risk_type].risks[0][i].name;
      type = session.risks[risk_type].risks[0][i].type;
      required = session.risks[risk_type].risks[0][i].required;
      value = session.risks[risk_type].risks[0][i].value;
      options = session.risks[risk_type].risks[0][i].options;

      // Get array indexes of bodilyInjury and propertyDamage
      if (name.toLowerCase().includes('uninsured') && type == 'enum' && required == true) {
        uninsuredMotorist_index = i;
      } else if (name.toLowerCase().includes('bodilyinjury') && type == 'enum' && required == true) {
        bodilyInjury_index = i;
      } else if (name.toLowerCase().includes('propertydamage') && type == 'enum' && required == true) {
        propertyDamage_index = i;
      }
    }

    coverageGroupHTML += "<ul style=\"padding-inline-start: 0;\">";
    vehicles_coverage_items.forEach(async function(item) {
      // Only get mandatory coverages
      if (item.presence == 'mandatory' && item.type == 'coverage') {
        // Uninsured Motorist
        if (item.name.toLowerCase().includes('uninsured')) {
          coverageGroupHTML += "<ul style=\"padding-inline-start: 0;\"><li class=\"list-group-item\">";
          coverageGroupHTML += "<nav class=\"navbar pl-0 pr-0\">";
          coverageGroupHTML += "<span class=\"navbar-brand mb-0 h6\"><input type=\"checkbox\" checked disabled>&nbsp; " + item.label + "</span>";
          coverageGroupHTML += "<span id=\"" + item.name + "Total" + number + "\" class=\"text-muted mt-1 pr-1\">" + formatter.format(uninsuredMotoristPremium) + "</span></nav>";
          coverageGroupHTML += "<small>This coverage allows an insured to collect from his or her insurer as if it provided ";
          coverageGroupHTML += "liability coverage for the negligent third party.</small><br><br>";

          for (var i = 0; i < Object.keys(session.risks[risk_type].risks[0]).length; i++) {
            var name = session.risks[risk_type].risks[0][i].name;
            var type = session.risks[risk_type].risks[0][i].type;
            var required = session.risks[risk_type].risks[0][i].required;
            // For personal auto policies only
            if (name.toLowerCase().includes('uninsured') && type == 'enum' && required == true) {
              var label = session.risks[risk_type].risks[0][i].label;
              var value = session.risks[risk_type].risks[0][i].value;

              if (label.toLowerCase().includes('bodily')) {
                coverageGroupHTML += "<span class=\"mb-1\"><small><b>Bodily Injury Coverage Limit:</b></small></span><br>";
                coverageGroupHTML += "<select id=\"" + name + number + "\" class=\"form-control\" onchange=\"updateCoverages('" + name + "', " + number + ")\">";
              } else if (label.toLowerCase().includes('property')) {
                coverageGroupHTML += "<span class=\"mb-1\"><small><b>Property Damage Coverage Limit:</b></small></span><br>";
                coverageGroupHTML += "<select id=\"" + name + number + "\" class=\"form-control\" onchange=\"updateCoverages('" + name + "', " + number + ")\">";
              }
              var options = session.risks[risk_type].risks[0][uninsuredMotorist_index].options;
              for (var j = 0; j < options.length; j++) {
                // Reformat using US currency
                var new_label = null;
                if (options[j].label.includes('-')) {
                  var values = options[j].label.split('-');
                  values[0] = formatter.format(values[0]);
                  values[1] = formatter.format(values[1]);
                  new_label = values[0] + ' - ' + values[1];
                } else {
                  new_label = formatter.format(options[j].label)
                }
                if (options[j].value == value) {
                  coverageGroupHTML += "<option value=\"" + options[j].name + "\" selected>" + new_label + "</option>"
                } else {
                  coverageGroupHTML += "<option value=\"" + options[j].name + "\">" + new_label + "</option>"
                }
              }
              coverageGroupHTML += "</select><br>";
            }
          }
          coverageGroupHTML += "</li>";
          // Bodily Injury Limit
        } else if (item.name.toLowerCase().includes('bodilyinjury')) {
          coverageGroupHTML += "<li class=\"list-group-item\">";
          coverageGroupHTML += "<nav class=\"navbar pl-0 pr-0\">";
          coverageGroupHTML += "<span class=\"navbar-brand mb-0 h6\"><input type=\"checkbox\" checked disabled>&nbsp; " + item.label + "</span>";
          coverageGroupHTML += "<span id=\"" + item.name + "Total" + number + "\" class=\"text-muted mt-1 pr-1\">" + formatter.format(bodilyInjuryPremium) + "</span></nav>";
          coverageGroupHTML += "<small>Coverage that helps you pay for another person's injuries in a car accident ";
          coverageGroupHTML += "for which you are found to be at fault.</small><br><br>";
          coverageGroupHTML += "<span class=\"mb-1\"><small><b>Coverage Limit:</b></small></span><br>";
          coverageGroupHTML += "<select id=\"" + item.name + number + "\" class=\"form-control\" onchange=\"updateCoverages('" + item.name + "', " + number + ")\">";

          var bi_options = session.risks[risk_type].risks[0][bodilyInjury_index].options;
          for (var j = 0; j < bi_options.length; j++) {
            // Reformat using US currency
            var new_label = null;
            if (bi_options[j].label.includes('-')) {
              var values = bi_options[j].label.split('-');
              values[0] = formatter.format(values[0]);
              values[1] = formatter.format(values[1]);
              new_label = values[0] + ' - ' + values[1];
            } else {
              new_label = formatter.format(bi_options[j].label)
            }
            if (bi_options[j].value == value) {
              coverageGroupHTML += "<option value=\"" + bi_options[j].name + "\" selected>" + new_label + "</option>";
            } else {
              coverageGroupHTML += "<option value=\"" + bi_options[j].name + "\">" + new_label + "</option>";
            }
          }
          coverageGroupHTML += "</select><br>";
          coverageGroupHTML += "</li>";
          // Property Damage Limit
        } else if (item.name.toLowerCase().includes('propertydamage')) {
          coverageGroupHTML += "<li class=\"list-group-item\">";
          coverageGroupHTML += "<nav class=\"navbar pl-0 pr-0\">";
          coverageGroupHTML += "<span class=\"navbar-brand mb-0 h6\"><input type=\"checkbox\" checked disabled>&nbsp; " + item.label + "</span>";
          coverageGroupHTML += "<span id=\"" + item.name + "Total" + number + "\" class=\"text-muted mt-1 pr-1\">" + formatter.format(propertyDamagePremium) + "</span></nav>";
          coverageGroupHTML += "<small>Coverage that helps pay to repair damage you cause to another person's vehicle or property.</small><br><br>";
          coverageGroupHTML += "<span class=\"mb-1\"><small><b>Coverage Limit:</b></small><span><br>";
          coverageGroupHTML += "<select id=\"" + item.name + number + "\" class=\"form-control\" onchange=\"updateCoverages('" + item.name + "', " + number + ")\">";

          var pd_options = session.risks[risk_type].risks[0][propertyDamage_index].options;
          for (var j = 0; j < pd_options.length; j++) {
            // Reformat using US currency
            var new_label = null;
            if (pd_options[j].label.includes('-')) {
              var values = bi_options[j].label.split('-');
              values[0] = formatter.format(values[0]);
              values[1] = formatter.format(values[1]);
              new_label = values[0] + ' - ' + values[1];
            } else {
              new_label = formatter.format(pd_options[j].label)
            }
            if (pd_options[j].value == value) {
              coverageGroupHTML += "<option value=\"" + pd_options[j].name + "\" selected>" + new_label + "</option>";
            } else {
              coverageGroupHTML += "<option value=\"" + pd_options[j].name + "\">" + new_label + "</option>";
            }
          }
          coverageGroupHTML += "</select><br>";
          coverageGroupHTML += "</li>";
        }
      }
    });
    coverageGroupHTML += "</ul>";
  // Optional Coverages
  } else if (risk_type == 'optional') {
    if (product_label.toLowerCase().includes('homeowners')) {
      if (!'homes_coverage_items' in session) {
        await getCoverageItems('homes');
        await waitUntil(() => 'homes_coverage_items' in session);
      }
      var homes_coverage_items = session.homes_coverage_items;

      // Sort by order
      homes_coverage_items.sort((a,b)=> (a.order > b.order ? 1 : -1));
      // console.log(homes_coverage_items)

      coverageGroupHTML += "<ul style=\"padding-inline-start: 0;\">";
      homes_coverage_items.forEach(async function(item) {
        if (item.presence == 'optional' && item.type == 'coverage' || item.type == 'fee') {
          var premium = '---';
          if (item.name in items) {
            premium = formatter.format(items[item.name].premium);
          }
          coverageGroupHTML += "<li class=\"list-group-item\">";
          coverageGroupHTML += "<nav class=\"navbar pl-0 pr-0\">";
          if (read_only == false) {
            coverageGroupHTML += "<span class=\"navbar-brand mb-0 h6\"><input type=\"checkbox\" id=\"" + item.name + "Checkbox" + number + "\" onchange=\"updateCoverages('" + item.name + "', " + number + ")\">&nbsp; " + item.label + "</span>";
          } else {
            coverageGroupHTML += "<span class=\"navbar-brand mb-0 h6\"><input type=\"checkbox\" id=\"" + item.name + "Checkbox" + number + "\" disabled>&nbsp; " + item.label + "</span>";
          }

          coverageGroupHTML += "<span id=\"" + item.name + "Total" + number + "\" class=\"text-muted mt-1 pr-1\">"  + premium + "</span></nav>";
          // Coverage Descriptions
          if (item.label.toLowerCase().includes('snowmobile')) {
            coverageGroupHTML += "<small>May help pay to repair damage to your sled or prevent you from paying out of pocket if you injure another person or damage their property while riding your snowmobile.</small>";
          } else if (item.label.toLowerCase().includes('woodstove')) {
            coverageGroupHTML += "<small>This fee is required only if your home has a woodburning stove or fireplace.</small>";
          }
          coverageGroupHTML += "</li>";
        }
      });
      coverageGroupHTML += "</ul>";
    } else if (product_label.toLowerCase().includes('auto')) {
      if (!'vehicles_coverage_items' in session) {
        await getCoverageItems('vehicles');
        await waitUntil(() => 'vehicles_coverage_items' in session);
      }
      var vehicles_coverage_items = session.vehicles_coverage_items;

      // Sort by order
      vehicles_coverage_items.sort((a,b)=> (a.order > b.order ? 1 : -1));
      // console.log(vehicles_coverage_items)

      coverageGroupHTML += "<ul style=\"padding-inline-start: 0;\">";
      vehicles_coverage_items.forEach(async function(item) {
        // If coverage should be checked by default
        if (item.presence == 'default' && item.type == 'coverage') {
          var premium = '---';
          if (item.name in items) {
            premium = formatter.format(items[item.name].premium);
          }
          coverageGroupHTML += "<li class=\"list-group-item\">";
          coverageGroupHTML += "<nav class=\"navbar pl-0 pr-0\">";
          coverageGroupHTML += "<span class=\"navbar-brand mb-0 h6\"><input type=\"checkbox\" id=\"" + item.name + "Checkbox" + number + "\" checked onchange=\"updateCoverages('" + item.name + "', " + number + ")\" disabled>&nbsp; " + item.label + "</span>";
          coverageGroupHTML += "<span id=\"" + item.name + "Total" + number + "\" class=\"text-muted mt-1 pr-1\">" + premium + "</span></nav>";
          if (item.name.toLowerCase().includes('medical')) {
            coverageGroupHTML += "<small>Coverage for medical expenses for an insured who sustains bodily injury (BI) caused by an auto accident, without regard to fault. Coverage for persons other than the named insured and his or her family members is typically restricted to circumstances when they are occupants of the insured auto.</small><br><br>";
            for (var i = 0; i < Object.keys(session.risks[use_risk_type].risks[0]).length; i++) {
              var name = session.risks[use_risk_type].risks[0][i].name;
              var type = session.risks[use_risk_type].risks[0][i].type;
              var required = session.risks[use_risk_type].risks[0][i].required;
              if (name.toLowerCase().includes('medical') && type == 'enum' && required == true) {
                var label = session.risks[use_risk_type].risks[0][i].label;
                var value = session.risks[use_risk_type].risks[0][i].value;
                var options = session.risks[use_risk_type].risks[0][i].options;

                coverageGroupHTML += "<span class=\"mb-1\"><small><b>Coverage Limit:</b></small></span><br>";
                coverageGroupHTML += "<select id=\"" + name + number + "\" class=\"form-control\" onchange=\"updateCoverages('" + name + "', " + number + ")\">";
                for (var j = 0; j < options.length; j++) {
                  // Reformat using US currency
                  var new_label = null;
                  new_label = formatter.format(options[j].label)
                  if (options[j].name == value) {
                    coverageGroupHTML += "<option value=\"" + options[j].name + "\" selected>" + new_label + "</option>"
                  } else {
                    coverageGroupHTML += "<option value=\"" + options[j].name + "\">" + new_label + "</option>"
                  }
                }
                coverageGroupHTML += "</select><br>";
              } else if (name.toLowerCase().includes('passiverestraint') && type == 'enum' && required == true) {
                var label = session.risks[use_risk_type].risks[0][i].label;
                var value = session.risks[use_risk_type].risks[0][i].value;
                var options = session.risks[use_risk_type].risks[0][i].options;

                coverageGroupHTML += "<span class=\"mb-1\"><small><b>Passive Restraint System:</b></small></span><br>";
                coverageGroupHTML += "<select id=\"" + name + number + "\" class=\"form-control\" onchange=\"updateCoverages('" + name + "', " + number + ")\">"
                for (var j = 0; j < options.length; j++) {
                  if (options[j].name == value) {
                    coverageGroupHTML += "<option value=\"" + options[j].name + "\" selected>" + options[j].label + "</option>"
                  } else {
                    coverageGroupHTML += "<option value=\"" + options[j].name + "\">" + options[j].label + "</option>"
                  }
                }
                coverageGroupHTML += "</select><br>";
              }
            }
          }
          coverageGroupHTML += "</li>";
          // Optional Coverages
        } else if (item.presence == 'optional' && item.type == 'coverage') {
          var premium = '---';
          if (item.name in items) {
            premium = formatter.format(items[item.name].premium);
          }
          coverageGroupHTML += "<li class=\"list-group-item\">";
          coverageGroupHTML += "<nav class=\"navbar pl-0 pr-0\">";
          if (read_only == false) {
            coverageGroupHTML += "<span class=\"navbar-brand mb-0 h6\"><input type=\"checkbox\" id=\"" + item.name + "Checkbox" + number + "\" onchange=\"updateCoverages('" + item.name + "', " + number + ")\">&nbsp; " + item.label + "</span>";
          } else {
            coverageGroupHTML += "<span class=\"navbar-brand mb-0 h6\"><input type=\"checkbox\" id=\"" + item.name + "Checkbox" + number + "\" disabled>&nbsp; " + item.label + "</span>";
          }

          coverageGroupHTML += "<span id=\"" + item.name + "Total" + number + "\" class=\"text-muted mt-1 pr-1\">"  + premium + "</span></nav>";

          if (item.name.toLowerCase().includes('comprehensive')) {
            coverageGroupHTML += "<small>Coverage under an automobile physical damage policy insuring against loss or damage resulting from any cause, except those specifically precluded. It covers losses such as fire, theft, windstorm, flood, and vandalism, but not loss by collision or upset.</small>";
          } else if (item.name.toLowerCase().includes('collision')) {
            coverageGroupHTML += "<small>Coverage that provides for reimbursement for loss to a covered automobile due to its colliding with another vehicle or object or the overturn of the automobile. This covers only damage to the automobile itself as defined in the policy.</small>";
          } else if (item.name.toLowerCase().includes('additional')) {
            coverageGroupHTML += "<small>Custom parts and equipment coverage (CPE) is an endorsement to your policy that covers permanently installed custom parts or equipment, devices, accessories, enhancements and changes other than those installed by the original manufacturer, that alter the performance or appearance of your vehicle.</small><br><br>";
            for (var i = 0; i < Object.keys(session.risks[use_risk_type].risks[0]).length; i++) {
              var name = session.risks[use_risk_type].risks[0][i].name;
              var type = session.risks[use_risk_type].risks[0][i].type;
              var required = session.risks[use_risk_type].risks[0][i].required;
              if (name.toLowerCase().includes('additional') && type == 'enum' && required == true) {
                var label = session.risks[use_risk_type].risks[0][i].label;
                var value = session.risks[use_risk_type].risks[0][i].value;
                var options = session.risks[use_risk_type].risks[0][i].options;
              }
            }
            coverageGroupHTML += "<span class=\"mb-1\"><small><b>Coverage Limit:</b></small></span><br>";
            coverageGroupHTML += "<select id=\"" + item.name + number + "\" class=\"form-control\" onchange=\"updateCoverages('" + item.name + "', " + number + ")\" disabled>";
            for (var j = 0; j < options.length; j++) {
              // Reformat using US currency
              var new_label = null;
              if (options[j].label.includes('-')) {
                var values = options[j].label.split('-');
                values[0] = formatter.format(values[0]);
                values[1] = formatter.format(values[1]);
                new_label = values[0] + ' - ' + values[1];
              } else {
                if (options[j].label == 'None') {
                  new_label = options[j].label;
                } else {
                  new_label = formatter.format(options[j].label);
                }
              }
              if (options[j].name == value) {
                coverageGroupHTML += "<option value=\"" + options[j].name + "\" selected>" + new_label + "</option>"
              } else {
                coverageGroupHTML += "<option value=\"" + options[j].name + "\">" + new_label + "</option>"
              }
            }
            coverageGroupHTML += "</select><br>";
          } else if (item.name.toLowerCase().includes('towing')) {
            coverageGroupHTML += "<small>Coverage that typically pays the cost of towing your car to a repair shop when it is unable to be driven and covers a specified amount of necessary labor charges at the place of the breakdown.</small><br><br>";
            for (var i = 0; i < Object.keys(session.risks[use_risk_type].risks[0]).length; i++) {
              var name = session.risks[use_risk_type].risks[0][i].name;
              var type = session.risks[use_risk_type].risks[0][i].type;
              var required = session.risks[use_risk_type].risks[0][i].required;
              if (name.toLowerCase().includes('towing') && type == 'enum' && required == true) {
                var label = session.risks[use_risk_type].risks[0][i].label;
                var value = session.risks[use_risk_type].risks[0][i].value;
                var options = session.risks[use_risk_type].risks[0][i].options;
              }
            }
            coverageGroupHTML += "<span class=\"mb-1\"><small><b>Coverage Limit:</b></small></span><br>";
            coverageGroupHTML += "<select id=\"" + item.name + number + "\" class=\"form-control\" onchange=\"updateCoverages('" + item.name + "', " + number + ")\" disabled>";
            for (var j = 0; j < options.length; j++) {
              // Reformat using US currency
              var new_label = null;
              if (options[j].label.includes('-')) {
                var values = options[j].label.split('-');
                values[0] = formatter.format(values[0]);
                values[1] = formatter.format(values[1]);
                new_label = values[0] + ' - ' + values[1];
              } else {
                if (options[j].label == 'None') {
                  new_label = options[j].label;
                } else {
                  new_label = formatter.format(options[j].label);
                }
              }
              if (options[j].name == value) {
                coverageGroupHTML += "<option value=\"" + options[j].name + "\" selected>" + new_label + "</option>"
              } else {
                coverageGroupHTML += "<option value=\"" + options[j].name + "\">" + new_label + "</option>"
              }
            }
            coverageGroupHTML += "</select><br>";
          }
          coverageGroupHTML += "</li>";
        }
      });
      coverageGroupHTML += "</ul>";
    }
  } else {
    coverageGroupHTML += "There are no " + risk_type + " coverages available.";
  }
  coverageGroupHTML += "</div>";

  // Update Total Premium
  var risk_quotes = session.quote_risks.risk_quotes;
  var totalPremium = 0;
  var totalFees = 0;
  var showFeeNotice = false;
  risk_quotes.forEach(function(risk_quote) {
    if (risk_quote.risk_state.type.name.toLowerCase().includes('homes')) {
      totalPremium += risk_quote.risk_state.total_premium;
    } else if (risk_quote.risk_state.type.name.toLowerCase().includes('vehicles')) {
      if ('stateFee' in risk_quote.risk_state.items) {
        showFeeNotice = true;
        totalFees += risk_quote.risk_state.items.stateFee.premium;
      }
      totalPremium += risk_quote.risk_state.total_premium;
    }
  });

  if (showFeeNotice == true) {
    var feeNoticeHTML = "<small><em>Includes " + formatter.format(totalFees) + " in state fees.</em></small>";
    document.getElementById('totalPremium').innerHTML = formatter.format(totalPremium);
    document.getElementById('feeNotice').innerHTML = feeNoticeHTML;
  } else {
    document.getElementById('totalPremium').innerHTML = formatter.format(totalPremium);
    document.getElementById('feeNotice').innerHTML = "";
  }

  // Return Coverage Group HTML
  return coverageGroupHTML;
};

function updateRateAndTotals(risk_type, number, totals = null) {
  // Re-Rate Quote
  console.log('POST: ' + 'api/quote/' + session.quote_number + '/rate/');
  apiClient.post('api/quote/' + session.quote_number + '/rate/')
      .then(response => {
          session.rate_response = response.data;
          console.log(response.data);
          // Get updated quote risks
          console.log('GET: ' + '/api/quote/' + session.quote_number + '/risks/?page=1');
          apiClient.get('/api/quote/' + session.quote_number + '/risks/?page=1')
              .then(response => {
                  console.log(response.data);
                  session.quote_risks = response.data;
                  var risk_quotes = session.quote_risks.risk_quotes;
                  var premium_total = 0;
                  if (totals != null) {
                    risk_quotes.forEach(function(risk_quote) {
                      var final_rate = risk_quote.final_rate;
                      var items = risk_quote.risk_state.items;
                      var adjusted_rate = final_rate;
                      if ('stateFee' in items) {
                        var state_fee = risk_quote.risk_state.items.stateFee.premium;
                        adjusted_rate -= state_fee;
                      }
                      // If risk type matches
                      if (risk_quote.risk_state.type.name.toLowerCase().includes(risk_type)) {
                        premium_total += risk_quote.risk_state.total_premium;
                        // If risk number matches
                        if (risk_quote.risk_state.number == number) {
                          // Update Totals
                          totals.forEach(function(total) {
                            if (total.includes('_Total')) {
                              document.getElementById(total).innerHTML = formatter.format(adjusted_rate);
                            } else {
                              if (total != 'totalPremium') {
                                // console.log(total);
                                var replace_this = 'Total' + number;
                                var original_item = total;
                                var root_item = original_item.replace(replace_this, '');
                                if (root_item in items) {
                                  // console.log(root_item + ' was found in items!');
                                  // console.log(items);
                                  document.getElementById(total).innerHTML = formatter.format(items[root_item].premium);
                                } else {
                                  // console.log(root_item + ' was NOT found in items!');
                                  var alt_replace_this = 'Total';
                                  var alt_original_item = total;
                                  var alt_root_item = alt_original_item.replace(alt_replace_this, '');
                                  if (alt_root_item in items) {
                                    // console.log(alt_root_item + ' was found in items!');
                                    // console.log(items);
                                    document.getElementById(total).innerHTML = formatter.format(items[alt_root_item].premium);
                                  }
                                }
                              }
                            }
                          });
                        }
                      }
                    });
                    if (totals.includes('totalPremium')) {
                      document.getElementById('totalPremium').innerHTML = formatter.format(premium_total);
                    }
                  }
              })
              .catch(error => {
                  console.log('There was an error:', error.response);
              });
      })
      .catch(error => {
          console.log('There was an error:', error.response);
      });
};

async function updateCoverages(coverage_type, number = null) {
  if (session.product_label.toLowerCase().includes('auto')) {
    // For personal auto quotes only
    if (coverage_type.toLowerCase().includes('medical')) {
      // If checkbox exists
      if ($("input[id='" + coverage_type + "Checkbox" + number + "']").length > 0) {
        if (document.getElementById(coverage_type + 'Checkbox' + number).checked == true) {
            document.getElementById('medicalExpenseLimit' + number).disabled = false;
            document.getElementById('passiveRestraintSystem' + number).disabled = false;
            document.getElementById('medicalExpenseTotal' + number).innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
            document.getElementById('vehicle' + number + '_Total').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
            document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
        } else if (document.getElementById(coverage_type + 'Checkbox' + number).checked == false) {
            document.getElementById('medicalExpenseLimit' + number).disabled = true;
            document.getElementById('passiveRestraintSystem' + number).disabled = true;
            document.getElementById('medicalExpenseTotal' + number).innerHTML = "---";
            document.getElementById('vehicle' + number + '_Total').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
            document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
            // Persist selected choice by updating field answers
            if ($("select[id='" + coverage_type + number + "']").length > 0) {
              var risk_quotes = session.quote_risks.risk_quotes;
              var temp_field_answers = {};
              risk_quotes.forEach(async function(risk_quote) {
                // If the risk type is a vehicle
                if (risk_quote.risk_state.type.name == 'vehicles') {
                  // If the risk number matches the number
                  if (risk_quote.risk_state.number == number) {
                    // Get risk id
                    var current_risk_id = risk_quote.risk_state.id;
                    var temp_select = document.getElementById('passiveRestraintSystem' + number);
                    // Get default option which should be None
                    if (temp_select.options[0].text.toLowerCase().includes('none')) {
                      temp_field_answers['passiveRestraintSystem'] = temp_select.options[0].value;
                    } else {
                      temp_field_answers['passiveRestraintSystem'] = "";
                    }

                    // Update the field answer
                    await updateFieldAnswers(current_risk_id, temp_field_answers, 1);
                    updateRateAndTotals('vehicles', number, ['medicalExpenseTotal','vehicle' + number + '_Total','totalPremium'])
                  }
                }
              });
            }
        }
      }
      // Persist selected choice by updating field answers
      if ($("select[id='" + coverage_type + number + "']").length > 0) {
        var risk_quotes = session.quote_risks.risk_quotes;
        var temp_field_answers = {};
        risk_quotes.forEach(async function(risk_quote) {
          // If the risk type is a vehicle
          if (risk_quote.risk_state.type.name == 'vehicles') {
            // If the risk number matches the number
            if (risk_quote.risk_state.number == number) {

              // Get risk id
              var current_risk_id = risk_quote.risk_state.id;
              temp_field_answers[coverage_type] = $("select[id='" + coverage_type + number + "'] option").filter(':selected').val();

              // Update the field answer
              await updateFieldAnswers(current_risk_id, temp_field_answers, 1);
              updateRateAndTotals('vehicles', number, ['medicalExpenseTotal','vehicle' + number + '_Total','totalPremium'])
            }
          }
        });
      }
    } else if (coverage_type.toLowerCase().includes('comprehensive')) {
      if (document.getElementById(coverage_type + 'Checkbox' + number).checked == true) {
          document.getElementById('comprehensiveTotal' + number).innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
          document.getElementById('vehicle' + number + '_Total').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
          document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
          var risk_quotes = session.quote_risks.risk_quotes;
          risk_quotes.forEach(function(risk_quote) {
            // If the risk type is a vehicle
            if (risk_quote.risk_state.type.name == 'vehicles') {
              // If the risk number matches the number
              if (risk_quote.risk_state.number == number) {

                // Get risk id
                var current_risk_id = risk_quote.risk_state.id;

                // Add Comprehensive Coverage Item
                payload = JSON.stringify({
                    "risk_quote": current_risk_id,
                    "risk_item_name": "comprehensive"
                });
                console.log('POST: ' + '/api/quote/items/');
                console.log('PAYLOAD: ' + payload);
                apiClient.post('/api/quote/items/', payload)
                    .then(response => {
                        console.log(response.data);
                        // Update amounts and total
                        updateRateAndTotals('vehicles', number, ['comprehensiveTotal' + number,'vehicle' + number + '_Total','totalPremium'])
                        // document.getElementById('comprehensiveTotal' + number).innerHTML = formatter.format(response.data.risk_state['items'].comprehensive['premium']);
                    })
                    .catch(error => {
                        console.log('There was an error:', error.response);
                    });
              }
            }
          });
      } else if (document.getElementById(coverage_type + 'Checkbox' + number).checked == false) {
          document.getElementById('comprehensiveTotal' + number).innerHTML = "---";
          document.getElementById('vehicle' + number + '_Total').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
          document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
          var risk_quotes = session.quote_risks.risk_quotes;
          risk_quotes.forEach(function(risk_quote) {
            // If the risk type is a vehicle
            if (risk_quote.risk_state.type.name == 'vehicles') {
              // If the risk number matches the number
              if (risk_quote.risk_state.number == number) {

                // Get risk id
                var current_risk_id = risk_quote.risk_state.id;

                // Remove Comprehensive Coverage Item
                let data = {
                    'risk_quote': current_risk_id
                }
                let config = {
                    headers: {
                        'Authorization': axios_auth_type + ' ' + axios_api_key,
                        'Data': JSON.stringify(data)
                    }
                }
                console.log('DELETE: ' + '/api/quote/items/comprehensive/');
                console.log('PAYLOAD: ' + JSON.stringify(data));
                axios.delete(site_url + '/api/quote/items/comprehensive/', config)
                    .then(response => {
                        console.log(response.data);
                        updateRateAndTotals('vehicles', number, ['vehicle' + number + '_Total','totalPremium'])
                    })
                    .catch(error => {
                        console.log('There was an error:', error.response);
                    });
              }
            }
          });
      }
    } else if (coverage_type.toLowerCase().includes('collision')) {
        if (document.getElementById(coverage_type + 'Checkbox' + number).checked == true) {
            document.getElementById('collisionTotal' + number).innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
            document.getElementById('vehicle' + number + '_Total').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
            document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
            var risk_quotes = session.quote_risks.risk_quotes;
            risk_quotes.forEach(function(risk_quote) {
              // If the risk type is a vehicle
              if (risk_quote.risk_state.type.name == 'vehicles') {
                // If the risk number matches the number
                if (risk_quote.risk_state.number == number) {

                  // Get risk id
                  var current_risk_id = risk_quote.risk_state.id;

                  // Add Collision Coverage Item
                  payload = JSON.stringify({
                      "risk_quote": current_risk_id,
                      "risk_item_name": "collision"
                  });
                  console.log('POST: ' + '/api/quote/items/');
                  console.log('PAYLOAD: ' + payload);
                  apiClient.post('/api/quote/items/', payload)
                      .then(response => {
                          console.log(response.data);
                          // Update amounts and total
                          updateRateAndTotals('vehicles', number, ['collisionTotal' + number,'vehicle' + number + '_Total','totalPremium'])
                          // document.getElementById('collisionTotal' + number).innerHTML = formatter.format(response.data.risk_state['items'].collision['premium']);
                      })
                      .catch(error => {
                          console.log('There was an error:', error.response);
                      });
                }
              }
            });
        } else if (document.getElementById(coverage_type + 'Checkbox' + number).checked == false) {
            document.getElementById('collisionTotal' + number).innerHTML = "---";
            document.getElementById('vehicle' + number + '_Total').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
            document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
            var risk_quotes = session.quote_risks.risk_quotes;
            risk_quotes.forEach(function(risk_quote) {
              // If the risk type is a vehicle
              if (risk_quote.risk_state.type.name == 'vehicles') {
                // If the risk number matches the number
                if (risk_quote.risk_state.number == number) {

                  // Get risk id
                  var current_risk_id = risk_quote.risk_state.id;

                  // Remove Collision Coverage Item
                  let data = {
                      'risk_quote': current_risk_id
                  }
                  let config = {
                      headers: {
                          'Authorization': axios_auth_type + ' ' + axios_api_key,
                          'Data': JSON.stringify(data)
                      }
                  }
                  console.log('DELETE: ' + '/api/quote/items/collision/');
                  console.log('PAYLOAD: ' + JSON.stringify(data));
                  axios.delete(site_url + '/api/quote/items/collision/', config)
                      .then(response => {
                          console.log(response.data);
                          updateRateAndTotals('vehicles', number, ['vehicle' + number + '_Total','totalPremium'])
                      })
                      .catch(error => {
                          console.log('There was an error:', error.response);
                      });
                }
              }
            });
        }
    } else if (coverage_type.toLowerCase().includes('additional')) {
      if (document.getElementById(coverage_type + 'Checkbox' + number).checked == true) {
          document.getElementById('additionalEquipment' + number).disabled = false;
          document.getElementById('additionalEquipmentTotal' + number).innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
          document.getElementById('vehicle' + number + '_Total').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
          document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
          // Persist selected choice by updating field answers
          if ($("select[id='" + coverage_type + number + "']").length > 0) {
            var risk_quotes = session.quote_risks.risk_quotes;
            var temp_field_answers = {};
            risk_quotes.forEach(async function(risk_quote) {
              // If the risk type is a vehicle
              if (risk_quote.risk_state.type.name == 'vehicles') {
                // If the risk number matches the number
                if (risk_quote.risk_state.number == number) {

                  // Get risk id
                  var current_risk_id = risk_quote.risk_state.id;
                  temp_field_answers[coverage_type + 'CoverageLimit'] = $("select[id='" + coverage_type + number + "'] option").filter(':selected').val();

                  // Update the field answer
                  await updateFieldAnswers(current_risk_id, temp_field_answers, 1);

                  // Add Towing Coverage Item
                  payload = JSON.stringify({
                      "risk_quote": current_risk_id,
                      "risk_item_name": "additionalEquipment"
                  });
                  console.log('POST: ' + '/api/quote/items/');
                  console.log('PAYLOAD: ' + payload);
                  apiClient.post('/api/quote/items/', payload)
                      .then(response => {
                          console.log(response.data);
                          // Update amounts and total
                          updateRateAndTotals('vehicles', number, ['additionalEquipmentTotal' + number,'vehicle' + number + '_Total','totalPremium'])
                      })
                      .catch(error => {
                          console.log('There was an error:', error.response);
                      });
                }
              }
            });
          }
      } else if (document.getElementById(coverage_type + 'Checkbox' + number).checked == false) {
          document.getElementById('additionalEquipment' + number).disabled = true;
          document.getElementById('additionalEquipmentTotal' + number).innerHTML = "---";
          document.getElementById('vehicle' + number + '_Total').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
          document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
          // Persist selected choice by updating field answers
          if ($("select[id='" + coverage_type + number + "']").length > 0) {
            var risk_quotes = session.quote_risks.risk_quotes;
            var temp_field_answers = {};
            risk_quotes.forEach(async function(risk_quote) {
              // If the risk type is a vehicle
              if (risk_quote.risk_state.type.name == 'vehicles') {
                // If the risk number matches the number
                if (risk_quote.risk_state.number == number) {

                  // Get risk id
                  var current_risk_id = risk_quote.risk_state.id;

                  var temp_select = document.getElementById(coverage_type + number);
                  // Get default option which should be None
                  if (temp_select.options[0].text.toLowerCase().includes('none')) {
                    temp_field_answers[coverage_type + 'CoverageLimit'] = temp_select.options[0].value;
                  } else {
                    temp_field_answers[coverage_type + 'CoverageLimit'] = "";
                  }

                  // Update the field answer
                  await updateFieldAnswers(current_risk_id, temp_field_answers, 1);

                  // Remove Additional Equipment Coverage Item
                  let data = {
                      'risk_quote': current_risk_id
                  }
                  let config = {
                      headers: {
                          'Authorization': axios_auth_type + ' ' + axios_api_key,
                          'Data': JSON.stringify(data)
                      }
                  }
                  console.log('DELETE: ' + '/api/quote/items/additionalequipment/');
                  console.log('PAYLOAD: ' + JSON.stringify(data));
                  axios.delete(site_url + '/api/quote/items/additionalequipment/', config)
                      .then(response => {
                          console.log(response.data);
                          updateRateAndTotals('vehicles', number, ['vehicle' + number + '_Total','totalPremium'])
                      })
                      .catch(error => {
                          console.log('There was an error:', error.response);
                      });
                }
              }
            });
          }
      }
    } else if (coverage_type.toLowerCase().includes('towing')) {
      if (document.getElementById(coverage_type + 'Checkbox' + number).checked == true) {
          document.getElementById('towing' + number).disabled = false;
          document.getElementById('towingTotal' + number).innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
          document.getElementById('vehicle' + number + '_Total').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
          document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
          // Persist selected choice by updating field answers
          if ($("select[id='" + coverage_type + number + "']").length > 0) {
            var risk_quotes = session.quote_risks.risk_quotes;
            var temp_field_answers = {};
            risk_quotes.forEach(async function(risk_quote) {
              // If the risk type is a vehicle
              if (risk_quote.risk_state.type.name == 'vehicles') {
                // If the risk number matches the number
                if (risk_quote.risk_state.number == number) {

                  // Get risk id
                  var current_risk_id = risk_quote.risk_state.id;
                  temp_field_answers[coverage_type + 'Limit'] = $("select[id='" + coverage_type + number + "'] option").filter(':selected').val();

                  // Update the field answer
                  await updateFieldAnswers(current_risk_id, temp_field_answers, 1);

                  // Add Towing Coverage Item
                  payload = JSON.stringify({
                      "risk_quote": current_risk_id,
                      "risk_item_name": "towing"
                  });
                  console.log('POST: ' + '/api/quote/items/');
                  console.log('PAYLOAD: ' + payload);
                  apiClient.post('/api/quote/items/', payload)
                      .then(response => {
                          console.log(response.data);
                          // Update amounts and total
                          updateRateAndTotals('vehicles', number, ['towingTotal' + number,'vehicle' + number + '_Total','totalPremium'])
                      })
                      .catch(error => {
                          console.log('There was an error:', error.response);
                      });
                }
              }
            });
          }
      } else if (document.getElementById(coverage_type + 'Checkbox' + number).checked == false) {
          document.getElementById('towing' + number).disabled = true;
          document.getElementById('towingTotal' + number).innerHTML = "---";
          document.getElementById('vehicle' + number + '_Total').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
          document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
          // Persist selected choice by updating field answers
          if ($("select[id='" + coverage_type + number + "']").length > 0) {
            var risk_quotes = session.quote_risks.risk_quotes;
            var temp_field_answers = {};
            risk_quotes.forEach(async function(risk_quote) {
              // If the risk type is a vehicle
              if (risk_quote.risk_state.type.name == 'vehicles') {
                // If the risk number matches the number
                if (risk_quote.risk_state.number == number) {

                  // Get risk id
                  var current_risk_id = risk_quote.risk_state.id;
                  var temp_select = document.getElementById(coverage_type + number);

                  // Get default option which should be None
                  if (temp_select.options[0].text.toLowerCase().includes('none')) {
                    temp_field_answers[coverage_type + 'Limit'] = temp_select.options[0].value;
                  } else {
                    temp_field_answers[coverage_type + 'Limit'] = "";
                  }

                  // Update the field answer
                  await updateFieldAnswers(current_risk_id, temp_field_answers, 1);

                  // Remove Towing Coverage Item
                  let data = {
                      'risk_quote': current_risk_id
                  }
                  let config = {
                      headers: {
                          'Authorization': axios_auth_type + ' ' + axios_api_key,
                          'Data': JSON.stringify(data)
                      }
                  }
                  console.log('DELETE: ' + '/api/quote/items/towing/');
                  console.log('PAYLOAD: ' + JSON.stringify(data));
                  axios.delete(site_url + '/api/quote/items/towing/', config)
                      .then(response => {
                          console.log(response.data);
                          updateRateAndTotals('vehicles', number, ['vehicle' + number + '_Total','totalPremium'])
                      })
                      .catch(error => {
                          console.log('There was an error:', error.response);
                      });
                }
              }
            });
          }
      }
    } else {
      console.log('Updating ' + coverage_type + number);
      // Bodily Injury, Property Damage, Uninsured Motorist
      document.getElementById('vehicle' + number + '_Total').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
      document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
      // Persist selected choice by updating field answers
      if ($("select[id='" + coverage_type + number + "']").length > 0) {
        var risk_quotes = session.quote_risks.risk_quotes;
        var temp_field_answers = {};
        risk_quotes.forEach(async function(risk_quote) {
          // Only for personal auto quotes
          if (coverage_type.toLowerCase().includes('uninsured')) {
            // If the risk type is a vehicle policy
            if (session.quote_risks.risk_state.type.name == 'policy') {
              // If the risk number matches the number
              if (session.quote_risks.risk_state.number == number) {
                document.getElementById(coverage_type + 'Total' + number).innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                // Get risk id
                var current_risk_id = session.quote_risks.risk_state.id;
                temp_field_answers[coverage_type] = $("select[id='" + coverage_type + number + "'] option").filter(':selected').val();
                // Update the field answer
                await updateFieldAnswers(current_risk_id, temp_field_answers, 1);
                updateRateAndTotals('vehicles', number, [coverage_type + 'Total' + number, 'vehicle' + number + '_Total','totalPremium'])
              }
            }
          } else {
            // If the risk type is a vehicle
            if (risk_quote.risk_state.type.name == 'vehicles') {
              // If the risk number matches the number
              if (risk_quote.risk_state.number == number) {
                if (coverage_type.toLowerCase().includes('passive')) {
                  document.getElementById('medicalExpenseTotal' + number).innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                } else {
                  document.getElementById(coverage_type + 'Total' + number).innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
                }
                // Get risk id
                var current_risk_id = risk_quote.risk_state.id;
                if (coverage_type.toLowerCase().includes('bodily') || coverage_type.toLowerCase().includes('property')) {
                  temp_field_answers[coverage_type + 'Limit'] = $("select[id='" + coverage_type + number + "'] option").filter(':selected').val();
                } else {
                  temp_field_answers[coverage_type] = $("select[id='" + coverage_type + number + "'] option").filter(':selected').val();
                }
                // Update the field answer
                await updateFieldAnswers(current_risk_id, temp_field_answers, 1);
                if (coverage_type.toLowerCase().includes('passive')) {
                  updateRateAndTotals('vehicles', number, ['medicalExpenseTotal' + number, 'vehicle' + number + '_Total','totalPremium'])
                } else {
                  updateRateAndTotals('vehicles', number, [coverage_type + 'Total' + number, 'vehicle' + number + '_Total','totalPremium'])
                }
              }
            }
          }
        });
      }
    }
  } else if (session.product_label.toLowerCase().includes('home')) {
    if (coverage_type.toLowerCase().includes('coverage') || coverage_type.toLowerCase().includes('surcharge')) {
      if (document.getElementById(coverage_type + 'Checkbox' + number).checked == true) {
          document.getElementById(coverage_type + 'Total' + number).innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
          document.getElementById('home' + number + '_Total').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
          document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
          var risk_quotes = session.quote_risks.risk_quotes;
          risk_quotes.forEach(function(risk_quote) {
            // If the risk type is a home
            if (risk_quote.risk_state.type.name == 'homes') {
              // If the risk number matches the number
              if (risk_quote.risk_state.number == number) {
                // Get risk id
                var current_risk_id = risk_quote.risk_state.id;
                // Add Coverage Item
                payload = JSON.stringify({
                    "risk_quote": current_risk_id,
                    "risk_item_name": coverage_type
                });
                console.log('POST: ' + '/api/quote/items/');
                console.log('PAYLOAD: ' + payload);
                apiClient.post('/api/quote/items/', payload)
                    .then(response => {
                        console.log(response.data);
                        // Update amounts and total
                        updateRateAndTotals('homes', number, [coverage_type + 'Total' + number,'home' + number + '_Total','totalPremium'])
                    })
                    .catch(error => {
                        console.log('There was an error:', error.response);
                    });
              }
            }
          });
      } else if (document.getElementById(coverage_type + 'Checkbox' + number).checked == false) {
          document.getElementById(coverage_type + 'Total' + number).innerHTML = "---";
          document.getElementById('home' + number + '_Total').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
          document.getElementById('totalPremium').innerHTML = "<i class=\"fa fa-spinner fa-pulse fa-1x fa-fw\"></i>";
          var risk_quotes = session.quote_risks.risk_quotes;
          risk_quotes.forEach(function(risk_quote) {
            // If the risk type is a home
            if (risk_quote.risk_state.type.name == 'homes') {
              // If the risk number matches the number
              if (risk_quote.risk_state.number == number) {
                // Get risk id
                var current_risk_id = risk_quote.risk_state.id;
                // Remove Coverage Item
                let data = {
                    'risk_quote': current_risk_id
                }
                let config = {
                    headers: {
                        'Authorization': axios_auth_type + ' ' + axios_api_key,
                        'Data': JSON.stringify(data)
                    }
                }
                console.log('DELETE: ' + '/api/quote/items/' + coverage_type.toLowerCase() + '/');
                console.log('PAYLOAD: ' + JSON.stringify(data));
                axios.delete(site_url + '/api/quote/items/' + coverage_type.toLowerCase() + '/', config)
                    .then(response => {
                        console.log(response.data);
                        updateRateAndTotals('homes', number, ['home' + number + '_Total','totalPremium'])
                    })
                    .catch(error => {
                        console.log('There was an error:', error.response);
                    });
              }
            }
          });
      }
    }
  }
};

function formatDate(inputDate) {
    var date = new Date(inputDate);
    if (!isNaN(date.getTime())) {
        return (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getFullYear();
    }
};

const Zip = {
    template: `
        <div class="row justify-content-center mt-2">
            <div class="col-md-7">
                <div class="form-group">
                    <center>
                        <h5 class="text-center" id="quoteHeader">Enter your Zip Code to get started...</h5><br>
                        <input type="text" class="form-control input-lg" style="text-align:center; width: 8rem;" id="zipCode" minlength="5" maxlength="5" required>
                        <small class="text-danger" style="display: none;" id="zipError">Enter 5 digit zip code</small><br>
                        <button class="btn btn-primary" id="getQuoteBttn" onClick="validateZip()">Get Quote</button>
                    </center>
                </div>
            </div>
        </div>
    `,
    mounted() {
        // Get the input field
        var input = document.getElementById("zipCode");
        // Execute a function when the user releases a key on the keyboard
        input.addEventListener("keyup", function(event) {
          // Number 13 is the "Enter" key on the keyboard
          if (event.keyCode === 13) {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            document.getElementById("getQuoteBttn").click();
          }
        });
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
                        <button class="btn btn-primary" autofocus id="effBtn" style="display: none;" onclick="validateEffectiveDate()">Continue</button>
                    </center>
                </div>
            </div>
        </div>
    `,
    created() {
        getLocationFromZip();
    },
    mounted() {
        // Set default to today
        document.getElementById('effectiveDate').valueAsDate = new Date();
        // Get the input field
        var input = document.getElementById("effectiveDate");
        // Add event listener for Entr keypress
        input.addEventListener("keyup", function(event) {
          if (event.keyCode === 13) {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            document.getElementById("effBtn").click();
          }
        });
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
                    <div id="productList" class="card-deck justify-content-center"></div>
                </div>
            </div>
        </div>
    `,
    mounted() {
        getProducts();
    }
};

const Contact = {
    template: `
        <div class="text-left w-25 mx-auto mb-3">
            <div id="quoteHeader"><h5>Who is this coverage for?</h5><br></div>
            <div class="form-group" id="contactForm">
                <label><b>First Name:</b> <span style="color: darkred;">*</span></label><input type="text" class="form-control" id="contactFirstName" required>
                <span id="contactFirstNameError" style="color: red; display: none;">Please enter a first name</span><br>

                <label>Middle Name: <small class="text-muted">(Optional)</small></label><input type="text" class="form-control" id="contactMiddleName" required><br>

                <label><b>Last Name:</b> <span style="color: darkred;">*</span></label><input type="text" class="form-control" id="contactLastName" required>
                <span id="contactLastNameError" style="color: red; display: none;">Please enter a last name</span><br>

                <label><b>Street Address:</b> <span style="color: darkred;">*</span></label><input type="text" class="form-control" id="contactStreet" required>
                <span id="contactStreetError" style="color: red; display: none;">Please enter a street address</span><br>

                <label><b>City:</b> <span style="color: darkred;">*</span></label><input type="text" class="form-control" id="contactCity" required>
                <span id="contactCityError" style="color: red; display: none;">Please enter a city</span><br>

                <label><b>State:</b> <span style="color: darkred;">*</span></label><input type="text" class="form-control" id="contactState" minlength="2" maxlength="2" required>
                <span id="contactStateError" style="color: red; display: none;">Please enter a state</span><br>

                <label><b>Zip Code:</b> <span style="color: darkred;">*</span></label><input type="text" class="form-control" id="contactZip" minlength="5" maxlength="5" required>
                <span id="contactZipError" style="color: red; display: none;">Please enter a zip code</span><br>

                <label><b>Phone Number:</b> <span style="color: darkred;">*</span></label><input type="tel" class="form-control" id="contactPhone" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" required>
                <span id="contactPhoneError" style="color: red; display: none;">Please enter a phone number</span><br>

                <label><b>Email:</b> <span style="color: darkred;">*</span></label><input type="email" class="form-control" id="contactEmail" required>
                <span id="contactEmailError" style="color: red; display: none;">Please enter a an email address</span><br>

                <input type="hidden" id="contactDOB">
                <input type="hidden" id="contactLicense">

                <hr>
                <button class="btn btn-primary" @click="validateContact">Continue</button>
                <button class="btn btn-normal" @click="$router.push('/products')">Back</button>
            </div>
        </div>
    `,
    mounted() {
        document.getElementById('contactForm').addEventListener("keydown", function(event) {
          // Control + F (Autofill Contact Information)
          if (event.ctrlKey && event.keyCode === 70) {
            var new_contact = generateContact();
            document.getElementById('contactFirstName').value = new_contact.contactFirstName;
            document.getElementById('contactMiddleName').value = new_contact.contactMiddleName;
            document.getElementById('contactLastName').value = new_contact.contactLastName;
            document.getElementById('contactStreet').value = new_contact.contactStreet;
            document.getElementById('contactCity').value = new_contact.contactCity;
            document.getElementById('contactState').value = new_contact.contactState;
            document.getElementById('contactZip').value = new_contact.contactZip;
            document.getElementById('contactPhone').value = new_contact.contactPhone;
            document.getElementById('contactEmail').value = new_contact.contactEmail;
            document.getElementById('contactDOB').value = new_contact.contactDOB;
            document.getElementById('contactLicense').value = new_contact.contactLicense;
          }
        });
        // Prefill contact info from stored values (if keys exist)
        if ('contact_first_name' in session) {
          document.getElementById('contactFirstName').value = session.contact_first_name;
        }
        if ('contact_middle_name' in session) {
          document.getElementById('contactMiddleName').value = session.contact_middle_name;
        }
        if ('contact_last_name' in session) {
          document.getElementById('contactLastName').value = session.contact_last_name;
        }
        if ('street_address' in session) {
          document.getElementById('contactStreet').value = session.street_address;
        }
        if ('city' in session) {
          document.getElementById('contactCity').value = session.city;
        }
        if ('state' in session) {
          document.getElementById('contactState').value = session.state;
        }
        if ('zip_code' in session) {
          document.getElementById('contactZip').value = session.zip_code;
        }
        if ('contact_phone_number' in session) {
          document.getElementById('contactPhone').value = session.contact_phone_number;
        }
        if ('contact_email' in session) {
          document.getElementById('contactEmail').value = session.contact_email;
        }
        if ('contact_dob' in session) {
          document.getElementById('contactDOB').value = session.contact_dob;
        }
        if ('contact_license' in session) {
          document.getElementById('contactLicense').value = session.contact_license;
        }
    },
    methods: {
        validateContact: async function() {
            // Store contact inputs
            session['contact_first_name'] = document.getElementById('contactFirstName').value;
            session['contact_middle_name'] = document.getElementById('contactMiddleName').value;
            session['contact_last_name'] = document.getElementById('contactLastName').value;
            session['street_address'] = document.getElementById('contactStreet').value;
            session['city'] = document.getElementById('contactCity').value;
            session['state'] = document.getElementById('contactState').value;
            session['zip_code'] = document.getElementById('contactZip').value;
            session['contact_phone_number'] = document.getElementById('contactPhone').value;
            session['contact_email'] = document.getElementById('contactEmail').value;
            session['contact_dob'] = document.getElementById('contactDOB').value;
            session['contact_license'] = document.getElementById('contactLicense').value;

            // Validate contact inputs
            if (session.contact_first_name === ''
              || session.contact_last_name === ''
              || session.street_address === ''
              || session.zip_code === ''
              || session.city === ''
              || session.state === ''
              || session.contact_phone_number === ''
              || session.contact_email === '') {
                if (session.contact_first_name === '') {
                    document.getElementById('contactFirstName').style.borderColor = "red";
                    document.getElementById('contactFirstNameError').style.display = "block";
                }
                if (session.contact_last_name === '') {
                    document.getElementById('contactLastName').style.borderColor = "red";
                    document.getElementById('contactLastNameError').style.display = "block";
                }
                if (session.street_address === '') {
                    document.getElementById('contactStreet').style.borderColor = "red";
                    document.getElementById('contactStreetError').style.display = "block";
                }
                if (session.city === '') {
                    document.getElementById('contactCity').style.borderColor = "red";
                    document.getElementById('contactCityError').style.display = "block";
                }
                if (session.state === '') {
                    document.getElementById('contactState').style.borderColor = "red";
                    document.getElementById('contactStateError').style.display = "block";
                }
                if (session.zip_code ==='') {
                    document.getElementById('contactZip').style.borderColor = "red";
                    document.getElementById('contactZipError').style.display = "block";
                }
                if (session.contact_phone_number === '') {
                    document.getElementById('contactPhone').style.borderColor = "red";
                    document.getElementById('contactPhoneError').style.display = "block";
                }
                if (session.contact_email === '') {
                    document.getElementById('contactEmail').style.borderColor = "red";
                    document.getElementById('contactEmailError').style.display = "block";
                }
                window.scrollTo(0,0); // Return to top of page
            } else {
                // Persist contact info by adding it to policy
                risk_quote_id = session.quote_info['root_risk_quote_id'];
                console.log('GET: ' + 'api/quote/risks/' + risk_quote_id + '/');
                await apiClient.get('api/quote/risks/' + risk_quote_id + '/')
                    .then(response => {
                        field_answers = response.data.risk_state.field_answers;
                        console.log(field_answers);
                        for (let k in field_answers) {
                          if (k.toLowerCase().includes('firstname')) {
                            field_answers[k] = session.contact_first_name;
                          } else if (k.toLowerCase().includes('lastname')) {
                            field_answers[k] = session.contact_last_name;
                          } else if (k.toLowerCase().includes('streetaddress')) {
                            field_answers[k] = session.street_address;
                          } else if (k.toLowerCase().includes('city')) {
                            field_answers[k] = session.city;
                          } else if (k.toLowerCase().includes('state')) {
                            field_answers[k] = session.state;
                          } else if (k.toLowerCase().includes('zip')) {
                            field_answers[k] = session.zip_code;
                          } else if (k.toLowerCase().includes('phone')) {
                            field_answers[k] = session.contact_phone_number;
                          } else if (k.toLowerCase().includes('email')) {
                            field_answers[k] = session.contact_email;
                          } else if (k.toLowerCase().includes('dateofbirth')) {
                            field_answers[k] = session.contact_dob;
                          } else {
                            // Likely a knockout question
                            if (field_answers[k] == null) {
                              field_answers[k] = false;
                            }
                          }
                        }
                        updateFieldAnswers(risk_quote_id, field_answers, 1)
                    })
                    .catch(error => {
                        console.log('There was an error:', error.response);
                    });
                // Proceed to next quoting step
                this.$router.push('/risks-count');
            }
        }
    }
};

const HowManyRisks = {
    template: `
        <div class="text-left w-25 mx-auto mb-3">
          <div class="text-center" id="quoteHeader"><h5>Gathering information...</h5><br><br><i class="fa fa-spinner fa-pulse fa-4x fa-fw"></i></div>
          <div class="form-group">
              <div id="howManyRisks"></div>
              <hr>
              <button class="btn btn-primary" @click="validateRiskCounts">Continue</button>
              <button class="btn btn-normal" @click="$router.push('/contact')">Back</button>
          </div>
        </div>
    `,
    mounted() {
        getRiskTypes();
    },
    methods: {
      validateRiskCounts: async function() {
        session['risks'] = {};
        if (session.product_label.toLowerCase().includes('homeowners')) {
          var home_count = document.getElementById('numberOfHomes').value;
          if (home_count == null || home_count == '') {
            home_count = 1;
          }
          // Only get home risk types
          session.risk_types.forEach(async function(risk_type) {
            // Homes
            if (risk_type.name.toLowerCase().includes('home') && home_count > 0) {
              await getRiskFields(risk_type.name, home_count, 1);
            }
          });
        } else if (session.product_label.toLowerCase().includes('auto')) {
          var driver_count = document.getElementById('numberOfDrivers').value;
          if (driver_count == null || driver_count == '') {
            driver_count = 1;
          }
          var vehicle_count = document.getElementById('numberOfVehicles').value;
          if (vehicle_count == null || vehicle_count == '') {
            vehicle_count = 1;
          }
          // Only get driver and vehicle risk types
          session.risk_types.forEach(async function(risk_type) {
            // Drivers
            if (risk_type.name.toLowerCase().includes('driver') && driver_count > 0) {
              await getRiskFields(risk_type.name, driver_count, 1);
            }
            // Vehicles
            if (risk_type.name.toLowerCase().includes('vehicle') && vehicle_count > 0) {
              await getRiskFields(risk_type.name, vehicle_count, 2);
            }
          });
        } else if (session.product_label.toLowerCase().includes('umbrella')) {
          // Do something
        } else if (session.product_label.toLowerCase().includes('pet')) {
          // Do something
        } else if (session.product_label.toLowerCase().includes('marine')) {
          // Do something
        }

        // Set default risk state based on order
        index = 0;
        for (let risk_type in session.risks) {
          if (session.risks[risk_type].order == 1) {
            var index = Object.keys(session.risks).indexOf(risk_type);
          }
        }
        // Wait until the risks array is available
        await waitUntil(() => Object.values(session.risks)[index].risks.length >= 1)

        session['risk_state'] = {
          'current_risk': 0, // Index of current risk type array
          'current_risk_order': 1, // Current risk order number
          'current_risk_type': index, // Index of key/value in risks dictionary
          'current_risk_type_name': Object.keys(session.risks)[index], // Name of current risk type
          'total_risks_in_type': Object.values(session.risks)[index].risks.length, // Count of current risk type array
          'total_risk_types': Object.keys(session.risks).length, // Count of total risk type keys
          'previous_risk': 0,
          'previous_risk_order': null,
          'previous_risk_type': 0,
          'previous_risk_type_name': null,
          'risk_data': []
        };

        // Proceed to next quoting step
        this.$router.push('/risk');
      }
    }
};

const Risk = {
    template: `
        <div class="text-left w-25 mx-auto mb-3">
            <div id="quoteHeader"><h4>Risk</h4><br></div>
            <div class="form-group">
                <hr>
                <div id="loadingFieldsMsg" style="display: block;"><center><br><h5>Loading...</h5><br><br><i class="fa fa-spinner fa-pulse fa-4x fa-fw"></i><br><br></center></div>
                <form id="riskForm">
                  <div id="riskFields" style="display: none;"></div>
                </form>
                <hr>
                <button class="btn btn-primary" @click="validateRisk">Continue</button>
                <button class="btn btn-normal" @click="previousRisk" disabled>Back</button>
            </div>

        </div>
    `,
    mounted() {
      this.initialRisk();
      document.getElementById('riskForm').addEventListener("keydown", function(event) {
        // Control + F (Autofill Contact Information)
        if (event.ctrlKey && event.keyCode === 70) {
          var current_risk_name = session.risk_state.current_risk_type_name;
          var current_risk_index = session.risk_state.current_risk;
          var total_risks_in_type = session.risk_state.total_risks_in_type;
          if (current_risk_name.toLowerCase().includes('home')) {
            // TODO: Redo this by adding homes to generateRisk()
            $("input[type='text'][id*='riskAddress']:visible").each(function() {
              this.value = session.street_address;
            });
            $("input[type='text'][id*='city']:visible").each(function() {
              this.value = session.city;
            });

            $('#state').val(session.state);

            $("input[type='text'][id*='zipCode']:visible").each(function() {
              this.value = session.zip_code;
            });
            var county = "";
            if (session.city.toLowerCase().includes('boston')) {
              county = "Suffolk";
            }
            $("input[type='text'][id*='county']:visible").each(function() {
              this.value = county;
            });
          } else if (current_risk_name.toLowerCase().includes('driver')) {
            // If there is just one driver
            // if (total_risks_in_type == 1) {
            //   // TODO: Name should be valid without without a capital N.
            //   $("input[type='text'][id*='Name']:visible").each(function() {
            //     // Use policy contact info
            //     var contact_name = session.contact_first_name + ' ' + session.contact_last_name;
            //     this.value=contact_name;
            //   });
            //   $("input[type='date'][id*='dob']:visible").each(function() {
            //     // Use policy contact info
            //     this.value = session.contact_dob;
            //   });
            //   $("input[type='text'][id*='driverLicenseNumber']:visible").each(function() {
            //     // Use policy contact license number
            //     this.value = session.contact_license;
            //   });
            // } else {
              // If there are two or more drivers, the first one should be the policy contact
              // if (current_risk_index == 0 && total_risks_in_type > 1) {
              //   // TODO: Name should be valid without without a capital N.
              //   $("input[type='text'][id*='Name']:visible").each(function() {
              //     // Use policy contact info
              //     var contact_name = session.contact_first_name + ' ' + session.contact_last_name;
              //     this.value=contact_name;
              //   });
              //   $("input[type='date'][id*='dob']:visible").each(function() {
              //     // Use policy contact info
              //     this.value = session.contact_dob;
              //   });
              //   $("input[type='text'][id*='driverLicenseNumber']:visible").each(function() {
              //     // Use policy contact license number
              //     this.value = session.contact_license;
              //   });
              // } else {
                // Generate a new contact using the same last name as policy contact
                var new_contact = generateContact(session.contact_last_name);
                // TODO: Name should be valid without without a capital N.
                $("input[type='text'][id*='Name']:visible").each(function() {
                  // Use new contact name
                  var new_contact_name = new_contact.contactFirstName + ' ' +  new_contact.contactLastName;
                  this.value=new_contact_name;
                });
                $("input[type='date'][id*='dob']:visible").each(function() {
                  // Use new contact dob
                  this.value = new_contact.contactDOB;
                });
                $("input[type='text'][id*='driverLicenseNumber']:visible").each(function() {
                  // Use new contact license number
                  this.value = new_contact.contactLicense;
                });
              // }
            // }
            // Vehicle Risk
          } else if (current_risk_name.toLowerCase().includes('vehicle')) {
            // Generate a new vehicle
            var new_vehicle = generateRisk('vehicle');
            $("input[type='text'][id*='vin']:visible").each(function() {
              this.value=new_vehicle.vin;
            });
            $("input[type='text'][id*='make']:visible").each(function() {
              this.value = new_vehicle.make;
            });
            $("input[type='text'][id*='model']:visible").each(function() {
              this.value = new_vehicle.model;
            });
            $("input[type='number'][id*='modelYear']:visible").each(function() {
              this.value = new_vehicle.model_year;
            });
            $("input[type='number'][id*='mileage']:visible").each(function() {
              this.value = new_vehicle.mileage;
            });
          }
        }
      });
    },
    methods: {
      initialRisk: async function() {
        if (session.risk_state.total_risk_types > 0) {
          var risk_type_index = session.risk_state.current_risk_type;
          var current_risk_index = session.risk_state.current_risk;
          var total_risks_in_type = session.risk_state.total_risks_in_type;
          // Get current risk type name (in singular form)
          var risk_name = session.risk_state.current_risk_type_name;
          if (pluralize.isPlural(risk_name)) {
            risk_name = pluralize.singular(risk_name);
          }
          // Capitalize first letter of risk type name
          risk_name = risk_name.charAt(0).toUpperCase() + risk_name.slice(1);
          // Update Quote Header with current risk name and number (i.e. Driver 1, Vehicle 1)
          if (total_risks_in_type > 1) {
            document.getElementById('quoteHeader').innerHTML = "<h4>" + risk_name + " " + (current_risk_index + 1) + "</h4>";
          } else {
            document.getElementById('quoteHeader').innerHTML = "<h4>" + risk_name + "</h4>";
          }

          if (current_risk_index <= total_risks_in_type) {
            await this.generateRiskFields(risk_type_index, current_risk_index);
          }
        }
      },
      validateRisk: function() {
        // Validate fields
        var inputs = document.getElementById('riskForm').elements;
        var passedValidation = true;
        // Iterate over the inputs
        for (i = 0; i < inputs.length; i++) {99
          if (inputs[i].nodeName === "INPUT" || inputs[i].nodeName === "SELECT") {
            if (inputs[i].hasAttribute('required')) {
              if (inputs[i].value == '' || inputs[i].value == null) {
                document.getElementById(inputs[i].id).style.borderColor = "red";
                document.getElementById(inputs[i].id + 'Error').style.display = "block";
                passedValidation = false;
              }
            }
          }
        }

        if (passedValidation) {
          var risk_name = session.risk_state.current_risk_type_name;
          var risk_order = session.risk_state.current_risk_order;
          var risk_type_index = session.risk_state.current_risk_type;
          var current_risk_index = session.risk_state.current_risk;

          // Store the previous risk info in risk state
          session.risk_state.previous_risk_type_name = risk_name;
          session.risk_state.previous_risk_order = risk_order;
          session.risk_state.previous_risk_type = risk_type_index;
          session.risk_state.previous_risk = current_risk_index;

          // Persist data in risks array and in risk quote
          this.persistRiskData(risk_name, risk_type_index, current_risk_index);
        } else {
          window.scrollTo(0,0); // Return to top of page
        }
      },
      previousRisk: function() {
        // TODO: go back to previous risk

        // else go back to previous step
        this.$router.push('/risks-count');
      },
      generateRiskFields: async function(risk_type_index, current_risk_index) {
        document.getElementById('loadingFieldsMsg').style.display = "block";
        document.getElementById('riskFields').style.display = "none";
        var current_risk_fields = Object.values(session.risks)[risk_type_index].risks[current_risk_index];
        var max_fields = 25; // Maximum fields to include per risk
        var riskFieldsHTML = "";
        for (var i = 0; i < max_fields; i++) {
          // if field order exists
          if (current_risk_fields[i]) {
            var name = current_risk_fields[i].name;
            var label = current_risk_fields[i].label;
            var type = current_risk_fields[i].type;
            var options = current_risk_fields[i].options;
            var value = current_risk_fields[i].value;
            var required = current_risk_fields[i].required;
            var maxlength = 100;

            // Skip fields with lookup in the name
            if (name.toLowerCase().includes('lookup')) {
              continue;
            }

            // Special field length exceptions for auto
            if (name.toLowerCase().includes('vin')) {
              maxlength = 17;
            } else if (name.toLowerCase().includes('year')) {
              maxlength = 4;
            } else if (name.toLowerCase().includes('mileage')) {
              maxlength = 6;
            }
            // Generate the riskFields
            if (type == 'string') {
              if (required) {
                riskFieldsHTML += "<label><b>" + label + ":</b> <span style=\"color: darkred;\">*</span></label><input type=\"text\" class=\"form-control\" id=\"" + name + "\" maxlength=\"" + maxlength + "\" required>";
                riskFieldsHTML += "<span id=\"" + name + "Error\" style=\"color: red; display: none;\">Please enter a " + label.toLowerCase() + "</span><br>";
              } else {
                riskFieldsHTML += "<label>" + label + ": <small class=\"text-muted\">(Optional)</small></label><input type=\"text\" class=\"form-control\" id=\"" + name + "\" maxlength=\"" + maxlength + "\"><br>";
              }
            } else if (type == 'number') {
              if (required) {
                riskFieldsHTML += "<label><b>" + label + ":</b> <span style=\"color: darkred;\">*</span></label><input type=\"number\" class=\"form-control\" id=\"" + name + "\" maxlength=\"" + maxlength + "\" required>";
                riskFieldsHTML += "<span id=\"" + name + "Error\" style=\"color: red; display: none;\">Please enter a " + label.toLowerCase() + "</span><br>";
              } else {
                riskFieldsHTML += "<label>" + label + ": <small class=\"text-muted\">(Optional)</small></label><input type=\"number\" class=\"form-control\" id=\"" + name + "\" maxlength=\"" + maxlength + "\"><br>";
              }
            } else if (type == 'date') {
              if (required) {
                riskFieldsHTML += "<label><b>" + label + ":</b> <span style=\"color: darkred;\">*</span></label><input type=\"date\" class=\"form-control\" id=\"" + name + "\" required>";
                riskFieldsHTML += "<span id=\"" + name + "Error\" style=\"color: red; display: none;\">Please select a " + label.toLowerCase() + "</span><br>";
              } else {
                riskFieldsHTML += "<label>" + label + ": <small class=\"text-muted\">(Optional)</small></label><input type=\"date\" class=\"form-control\" id=\"" + name + "\"><br>";
              }
            } else if (type == 'boolean') {
              if (required) {
                riskFieldsHTML += "<label><b>" + label + ":</b></label><br>";
              } else {
                riskFieldsHTML += "<label>" + label + ": <small class=\"text-muted\">(Optional)</small></label><br>";
              }
              riskFieldsHTML += "<div class=\"btn-group btn-group-toggle mt-2\" data-toggle=\"buttons\">";
              riskFieldsHTML += "<label class=\"btn btn-normal btn-outline-info\">";
              if (value == true) {
                riskFieldsHTML += "<input type=\"radio\" value=\"true\" name=\"" + name + "Choice\" checked>Yes</label>";
                riskFieldsHTML += "<label class=\"btn btn-normal btn-outline-info\">";
                riskFieldsHTML += "<input type=\"radio\" value=\"false\" name=\"" + name + "Choice\">No</label>";
              } else {
                riskFieldsHTML += "<input type=\"radio\" value=\"true\" name=\"" + name + "Choice\">Yes</label>";
                riskFieldsHTML += "<label class=\"btn btn-normal btn-outline-info\">";
                riskFieldsHTML += "<input type=\"radio\" value=\"false\" name=\"" + name + "Choice\" checked>No</label>";
              }
              riskFieldsHTML += "</div><br><br>";
            } else if (type == 'enum') {
              // Only if not a coverage limit. These will be handled in coverages summary.
              if (!name.toLowerCase().includes('limit')) {
                if (options == null) {
                  await getFieldOptions(session.risk_state.current_risk_type_name, name, current_risk_index, i);
                }
                await waitUntil(() => session.risks[session.risk_state.current_risk_type_name].risks[current_risk_index][i].options != null);
                // console.log(session.risks[session.risk_state.current_risk_type_name].risks[current_risk_index][i].options);
                if (required) {
                  riskFieldsHTML += "<label><b>" + label + ":</b> <span style=\"color: darkred;\">*</span></label><select class=\"form-control\" id=\"" + name + "\" required>";
                  riskFieldsHTML += "<span id=\"" + name + "Error\" style=\"color: red; display: none;\">Please choose a " + label.toLowerCase() + "</span>";
                } else {
                  riskFieldsHTML += "<label>" + label + ": <small class=\"text-muted\">(Optional)</small></label><select class=\"form-control\" id=\"" + name + "\">";
                }
                // Special exception for principal driver dropdown
                if (name == 'chosenDriver') {
                  for (var k = 0; k < session.risk_state.risk_data.length; k++) {
                    var risk_key = Object.keys(session.risk_state.risk_data[k]);
                    if (risk_key.includes('driver')) {
                      driver_name = session.risk_state.risk_data[k][risk_key].driverName;
                      driver_id = session.risk_state.risk_data[k][risk_key].id;
                      riskFieldsHTML += "<option value=\"" + driver_id + "\">" + driver_name + "</option>";
                    }
                  }
                } else {
                  // console.log(session.risks[session.risk_state.current_risk_type_name].risks[current_risk_index][i].options.length + ' options!');
                  for (var j = 0; j < session.risks[session.risk_state.current_risk_type_name].risks[current_risk_index][i].options.length; j++) {
                    var option = session.risks[session.risk_state.current_risk_type_name].risks[current_risk_index][i].options[j];
                    // console.log(option);
                    riskFieldsHTML += "<option value=\"" + option.name + "\">" + option.label + "</option>";
                  }
                }
                riskFieldsHTML += "</select><br>";
              }
            }
          }
        }
        document.getElementById('loadingFieldsMsg').style.display = "none";
        document.getElementById('riskFields').innerHTML = riskFieldsHTML;
        document.getElementById('riskFields').style.display = "block";
        window.scrollTo(0,0); // Return to top of page
      },
      persistRiskData: function(current_risk_type_name, risk_type_index, current_risk_index) {
        // Persist data into risks array
        var current_risk_fields = Object.values(session.risks)[risk_type_index].risks[current_risk_index];
        var current_risk_fields_count = Object.keys(session.risks[current_risk_type_name].risks[current_risk_index]).length;
        var total_risks_in_type = session.risk_state.total_risks_in_type;
        var riskFields = document.getElementById('riskFields');
        var max_fields = 25;

        // Get current risk type name (in singular form)
        var risk_name = current_risk_type_name;
        if (pluralize.isPlural(risk_name)) {
          risk_name = pluralize.singular(risk_name);
        }
        // if (total_risks_in_type > 1) {
        //   risk_name += '_' + (current_risk_index + 1)
        // }
        var risk = {};
        risk[risk_name] = {};

        for (var i = 0; i < max_fields; i++) {
          // if field order exists
          if (current_risk_fields[i]) {
            var name = current_risk_fields[i].name;
            var type = current_risk_fields[i].type;
            // Text or Date Input
            if (type == 'string' || type == 'number' || type == 'date') {
              // Skip fields with lookup in the name
              if (name.toLowerCase().includes('lookup')) {
                continue;
              }
              // session.risks['drivers'].risks[0][0].value
              var temp_field_value = document.getElementById(name).value;
              session.risks[current_risk_type_name].risks[current_risk_index][i].value = temp_field_value;
              risk[risk_name][name] = temp_field_value;
              // Yes / No Boolean Radio Toggle Buttons
            } else if (type == 'boolean') {
              var temp_field = riskFields.querySelectorAll('input[name="' + name + 'Choice"]');
              var temp_value = false;
              for (var rb of temp_field) {
                if (rb.checked) {
                  temp_value = rb.value;
                  break;
                }
              }
              session.risks[current_risk_type_name].risks[current_risk_index][i].value = temp_value;
              risk[risk_name][name] = temp_value;
              // Select Dropdowns
            } else if (type == 'enum') {
              // Only if not a coverage limit. These will be handled in coverages summary.
              if (!name.toLowerCase().includes('limit')) {
                var temp_field = document.getElementById(name);
                var temp_field_value = temp_field.options[temp_field.selectedIndex].value;
                // Handle special principal driver field
                if (name.includes('chosenDriver')) {
                  var temp_field_text = temp_field.options[temp_field.selectedIndex].text;
                  var temp_field_dict = {
                    'name': temp_field_text,
                    'id': temp_field_value
                  }
                  session.risks[current_risk_type_name].risks[current_risk_index][i].value = temp_field_dict;
                  risk[risk_name][name] = temp_field_dict;
                } else {
                  session.risks[current_risk_type_name].risks[current_risk_index][i].value = temp_field_value;
                  risk[risk_name][name] = temp_field_value;
                }
              }

            }
          }
        }

        // Persist the data to the quote
        var quote_id = session.quote_info['id'];
        var parent_risk_quote_id = session.quote_info['root_risk_quote_id'];
        var temp_field_answers = {};
        var temp_risk_fields = session.risks[current_risk_type_name].risks[current_risk_index];

        for (j = 0; j < current_risk_fields_count; j++) {
          if (temp_risk_fields[j]) {
            // Handle special principal driver case by getting just the id
            if (temp_risk_fields[j].name.toLowerCase().includes('chosendriver')) {
              temp_field_answers[temp_risk_fields[j].name] = temp_risk_fields[j].value.id;
            } else {
              temp_field_answers[temp_risk_fields[j].name] = temp_risk_fields[j].value;
            }
          }
        };
        var payload = JSON.stringify({
          "quote": quote_id,
          "parent_risk_quote": parent_risk_quote_id,
          "risk_type_name": current_risk_type_name
        });
        console.log('POST: ' + '/api/quote/risks/');
        console.log('PAYLOAD: ' + payload);
        apiClient.post('/api/quote/risks/', payload)
            .then(response => {
                console.log(response);
                var risk_state_id = response.data.risk_state.id;
                risk[risk_name]['id'] = risk_state_id;
                updateFieldAnswers(risk_state_id, temp_field_answers, 1);
                // Add risk to risk state as risk data
                session.risk_state.risk_data.push(risk);
                // console.log(session.risk_state.risk_data);

            })
            .then(() => {
              // Advance to next risk in array and/or dictionary of risks
              this.advanceRisk(current_risk_type_name, risk_type_index, current_risk_index);
            })
            .catch(error => {
                console.log('There was an error:', error.response);
            });
      },
      advanceRisk: async function(risk_name, risk_type_index, current_risk_index) {
        // Advance to next risk in array and/or dictionary of risks
        if ((current_risk_index + 1) < session.risk_state.total_risks_in_type) {
          session.risk_state.current_risk += 1;
          current_risk_index += 1;

          // Get current risk type name (in singular form)
          if (pluralize.isPlural(risk_name)) {
            risk_name = pluralize.singular(risk_name);
          }
          // Capitalize first letter of risk type name
          risk_name = risk_name.charAt(0).toUpperCase() + risk_name.slice(1);
          // Update Quote Header with current risk name and number (i.e. Driver 1, Vehicle 1)
          document.getElementById('quoteHeader').innerHTML = "<h4>" + risk_name + " " + (current_risk_index + 1) + "</h4>";

          if (current_risk_index < session.risk_state.total_risks_in_type) {
            await this.generateRiskFields(risk_type_index, current_risk_index);
          }
        } else if ((current_risk_index + 1) == session.risk_state.total_risks_in_type) {
          // Move to next risk type
          if (session.risk_state.current_risk_order < session.risk_state.total_risk_types) {
            // Determine new index based on order
            var index = 0;
            for (let risk_type in session.risks) {
              if (session.risks[risk_type].order == (session.risk_state.current_risk_order + 1)) {
                var index = Object.keys(session.risks).indexOf(risk_type);
              }
            }
            // Update risk state values
            session.risk_state.current_risk = 0;
            if ((session.risk_state.current_risk_order + 1) <= session.risk_state.total_risk_types) {
              session.risk_state.current_risk_order += 1;
            }
            session.risk_state.current_risk_type = index;
            session.risk_state.current_risk_type_name = Object.keys(session.risks)[index];
            session.risk_state.total_risks_in_type = Object.values(session.risks)[index].risks.length;

            var risk_type_index = session.risk_state.current_risk_type;
            var current_risk_index = session.risk_state.current_risk;
            var total_risks_in_type = session.risk_state.total_risks_in_type;
            // Get current risk type name (in singular form)
            var risk_name = session.risk_state.current_risk_type_name;
            if (pluralize.isPlural(risk_name)) {
              risk_name = pluralize.singular(risk_name);
            }
            // Capitalize first letter of risk type name
            risk_name = risk_name.charAt(0).toUpperCase() + risk_name.slice(1);
            // Update Quote Header with current risk name and number (i.e. Driver 1, Vehicle 1)
            if (total_risks_in_type > 1) {
              document.getElementById('quoteHeader').innerHTML = "<h4>" + risk_name + " " + (current_risk_index + 1) + "</h4>";
            } else {
              document.getElementById('quoteHeader').innerHTML = "<h4>" + risk_name + "</h4>";
            }

            if (current_risk_index <= total_risks_in_type) {
              await this.generateRiskFields(risk_type_index, current_risk_index);
            }
          } else {
            // Move to risks summary screen
            this.$router.push('/risks-summary');
          }
        }
      }
    }
};

const Risks = {
    template: `
        <div class="text-left w-50 mx-auto mb-3">
          <div id="quoteHeader"><h3>Review</h3></div>
          <hr>
          Here is what we have so far.. please click continue to see available coverages.<br><br>
          <div id="riskTables"></div>
          <div class="form-group">
              <hr>
              <button class="btn btn-primary" @click="validateRisks">Continue</button>
              <button class="btn btn-normal" @click="$router.push('/contact')" disabled>Back</button>
          </div>
        </div>
    `,
    mounted() {
      // Get risk types
      var risk_types = Object.keys(session.risks);
      var riskTablesHTML = "";

      // Policy
      if (!risk_types.includes('policy')) {
        // Add policy risk type fields (if they don't exist)
        if (typeof session.risks.policy == 'undefined') {
          getRiskFields('policy', 1, null);
        }
      }

      // Homes Table
      if (risk_types.includes('homes')) {
        riskTablesHTML += generateRiskTable('homes');
      }

      // Drivers Table
      if (risk_types.includes('drivers')) {
        riskTablesHTML += generateRiskTable('drivers');
      }

      // Vehicles Table
      if (risk_types.includes('vehicles')) {
        riskTablesHTML += generateRiskTable('vehicles');
      }

      // Other Risk Types Tables
      // risk_types.forEach(function(risk_type) {
      //   // Exclude drivers and vehicles
      //   if (risk_type != 'drivers' && risk_type != 'vehicles') {
      //     riskTablesHTML += generateRiskTable(risk_type);
      //   }
      // });
      document.getElementById('riskTables').innerHTML = riskTablesHTML;
    },
    methods: {
      validateRisks: function() {
        // Rate Quote
        console.log('POST: ' + 'api/quote/' + session.quote_number + '/rate/');
        apiClient.post('api/quote/' + session.quote_number + '/rate/')
            .then(response => {
                session['rate_response'] = response.data;
                console.log(response.data);
                // Review Coverages
                this.$router.push('/coverages');
            })
            .catch(error => {
                console.log('There was an error:', error.response);
            });
      }
    }
};

const Coverages = {
    template: `
        <div class="row justify-content-center mt-2">
            <div class="col-md-7">
                <div class="text-center" id="quoteHeader"><h5>Getting available coverages...</h5><br><br><i class="fa fa-spinner fa-pulse fa-4x fa-fw"></i></div>
                <div id="coveragesSection" style="display: none;"></div>
                <div class="form-group" id="summaryGroup" style="display: none;">
                    <div class="text-right pr-1 pt-2 pb-2" id="totalPremiumSection">
                        <h6><b>Total Premium:</b> <span id="totalPremium" class="text-success">---</span></h6>
                        <div class=\"text-muted\" id="feeNotice"></div>
                    </div>
                    <div class="pl-0" id="navButtonSection">
                        <button class="btn btn-primary" id="continueBttn" @click="validateCoverages">Continue</button>
                        <button class="btn btn-normal" @click="$router.push('/risks-summary')">Back</button>
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
                session['quote_risks'] = response.data;
                this.initializeCoverages(response.data);
            })
            .catch(error => {
                console.log('There was an error:', error.response);
            });
    },
    methods: {
      initializeCoverages: async function(quote_risks) {
        var coveragesHTML = "";
        if (quote_risks.risk_state.type.name.includes('policy')) {
            // if (Object.keys(session.quote_risks.risk_state.items).length > 0) {
            //   coveragesHTML += await generateCoverageGroup('policy');
            // }
            coveragesHTML += "<div id=\"accordion\">";
            // Update the HTML displayed
            document.getElementById('coveragesSection').innerHTML = coveragesHTML;
            var riskQuotes = quote_risks.risk_quotes;
            var risk_quote_count = riskQuotes.length;
            var current_index = 0;
            riskQuotes.forEach(async function(risk_quote) {
              if (risk_quote.risk_state.type.name.includes('homes')) {
                var number = risk_quote.number;
                var final_rate = risk_quote.final_rate;
                var items = risk_quote.risk_state.items;
                var name = risk_quote.risk_state.name;
                var adjusted_rate = final_rate;
                if (number == 1) {
                  coveragesHTML = "<div class=\"card\"><div class=\"card-header pl-1\" id=\"heading" + number + "\">";
                  coveragesHTML += "<nav class=\"navbar pl-0 pr-0\">";
                  coveragesHTML += "<button class=\"btn btn-link\" data-toggle=\"collapse\" data-target=\"#collapse" + number + "\" aria-expanded=\"true\" aria-controls=\"collapse" + number + "\">";
                  coveragesHTML += "<span class=\"navbar-brand mb-0 h5\">Home " + number + " - " + name + "</span></button>";
                  coveragesHTML += "<span id=\"home" + number + "_Total\" class=\"text-right text-muted mt-1 pr-1\">" + formatter.format(adjusted_rate) + "</span>";
                  coveragesHTML += "</nav></div>";
                  coveragesHTML += "<div id=\"collapse" + number + "\" class=\"collapse show\" aria-labelledby=\"heading" + number + "\" data-parent=\"#accordion\">";
                  coveragesHTML += "<div class=\"card-body\">";
                  coveragesHTML += await generateCoverageGroup('homes', number, items, false);
                  coveragesHTML += await generateCoverageGroup('optional', number, items, false);
                  coveragesHTML += "</div></div></div>";
                  document.getElementById('coveragesSection').innerHTML += coveragesHTML;
                } else {
                  coveragesHTML = "<div class=\"card\"><div class=\"card-header pl-1\" id=\"heading" + number + "\">";
                  coveragesHTML += "<nav class=\"navbar pl-0 pr-0\">";
                  coveragesHTML += "<button class=\"btn btn-link collapsed\" data-toggle=\"collapse\" data-target=\"#collapse" + number + "\" aria-expanded=\"false\" aria-controls=\"collapse" + number + "\">";
                  coveragesHTML += "<span class=\"navbar-brand mb-0 h5\">Home " + number + " - " + name + "</span></button>";
                  coveragesHTML += "<span id=\"home" + number + "_Total\" class=\"text-right text-muted mt-1 pr-1\">" + formatter.format(adjusted_rate) + "</span>";
                  coveragesHTML += "</nav></div>";
                  coveragesHTML += "<div id=\"collapse" + number + "\" class=\"collapse\" aria-labelledby=\"heading" + number + "\" data-parent=\"#accordion\">";
                  coveragesHTML += "<div class=\"card-body\">";
                  coveragesHTML += await generateCoverageGroup('homes', number, items, false);
                  coveragesHTML += await generateCoverageGroup('optional', number, items, false);
                  coveragesHTML += "</div></div></div>";
                  document.getElementById('coveragesSection').innerHTML += coveragesHTML;
                }
              } else if (risk_quote.risk_state.type.name.includes('vehicles')) {
                var number = risk_quote.number;
                var final_rate = risk_quote.final_rate;
                var items = risk_quote.risk_state.items;
                var name = risk_quote.risk_state.name;
                var adjusted_rate = final_rate;
                // if ('uninsuredMotorist' in items) {
                //   var policy_premium = risk_quote.risk_state.items.uninsuredMotorist.premium;
                //   adjusted_rate = final_rate - policy_premium;
                // }
                if ('stateFee' in items) {
                  var state_fee = risk_quote.risk_state.items.stateFee.premium;
                  adjusted_rate -= state_fee;
                }
                if (number == 1) {
                  coveragesHTML = "<div class=\"card\"><div class=\"card-header pl-1\" id=\"heading" + number + "\">";
                  coveragesHTML += "<nav class=\"navbar pl-0 pr-0\">";
                  coveragesHTML += "<button class=\"btn btn-link\" data-toggle=\"collapse\" data-target=\"#collapse" + number + "\" aria-expanded=\"true\" aria-controls=\"collapse" + number + "\">";
                  coveragesHTML += "<span class=\"navbar-brand mb-0 h5\">Vehicle " + number + " - " + name + "</span></button>";
                  coveragesHTML += "<span id=\"vehicle" + number + "_Total\" class=\"text-right text-muted mt-1 pr-1\">" + formatter.format(adjusted_rate) + "</span>";
                  coveragesHTML += "</nav></div>";
                  coveragesHTML += "<div id=\"collapse" + number + "\" class=\"collapse show\" aria-labelledby=\"heading" + number + "\" data-parent=\"#accordion\">";
                  coveragesHTML += "<div class=\"card-body\">";
                  coveragesHTML += await generateCoverageGroup('vehicles', number, items, false);
                  coveragesHTML += await generateCoverageGroup('optional', number, items, false);
                  coveragesHTML += "</div></div></div>";
                  document.getElementById('coveragesSection').innerHTML += coveragesHTML;
                } else {
                  coveragesHTML = "<div class=\"card\"><div class=\"card-header pl-1\" id=\"heading" + number + "\">";
                  coveragesHTML += "<nav class=\"navbar pl-0 pr-0\">";
                  coveragesHTML += "<button class=\"btn btn-link collapsed\" data-toggle=\"collapse\" data-target=\"#collapse" + number + "\" aria-expanded=\"false\" aria-controls=\"collapse" + number + "\">";
                  coveragesHTML += "<span class=\"navbar-brand mb-0 h5\">Vehicle " + number + " - " + name + "</span></button>";
                  coveragesHTML += "<span id=\"vehicle" + number + "_Total\" class=\"text-right text-muted mt-1 pr-1\">" + formatter.format(adjusted_rate) + "</span>";
                  coveragesHTML += "</nav></div>";
                  coveragesHTML += "<div id=\"collapse" + number + "\" class=\"collapse\" aria-labelledby=\"heading" + number + "\" data-parent=\"#accordion\">";
                  coveragesHTML += "<div class=\"card-body\">";
                  coveragesHTML += await generateCoverageGroup('vehicles', number, items, false);
                  coveragesHTML += await generateCoverageGroup('optional', number, items, false);
                  coveragesHTML += "</div></div></div>";
                  document.getElementById('coveragesSection').innerHTML += coveragesHTML;
                }
              }
              if (current_index == risk_quote_count - 1) {
                // last risk quote so close out accordion
                coveragesHTML = "</div>";
                // Update the HTML displayed
                document.getElementById('coveragesSection').innerHTML += coveragesHTML;
                // Show summary and premium total
                document.getElementById('summaryGroup').style.display = "block";
                if (document.getElementById('totalPremium').innerHTML == '---') {
                  document.getElementById('continueBttn').disabled = true;
                } else {
                  document.getElementById('continueBttn').disabled = false;
                }
                document.getElementById('quoteHeader').innerHTML = "<h5>Please select the coverages and limits you wish to include:</h5>";
                document.getElementById('coveragesSection').style.display = "block";
              }
              current_index += 1;
            });
        }
      },
      validateCoverages: function() {
        // Do something
        // Proceed to next quoting step
        this.$router.push('/summary');
      }
    }
};

const Billing = {
    template: `
        <div class="text-left w-25 mx-auto mb-3">
            <div id="quoteHeader"><h5>Billing</h5><br></div>
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
                <button class="btn btn-normal" @click="$router.push('/coverages')">Back</button>
            </div>
        </div>
    `,
    mounted() {
    },
    methods: {
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
                            <span class="navbar-brand mb-0 h6">Policy Owner</span>
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
                      <div id="risksTables"><center>A summary of risks is not available at this time.</center></div>
                    </li>
                </ul>
            </div>
            <div class="form-group" id="policyCoveragesGroup">
              <ul>
                <li class="list-group-item">
                  <nav class="navbar pl-0 pr-0">
                      <span class="navbar-brand mb-0 h6">Coverages Overview</span>
                  </nav>
                  <div id="coveragesSummary"><center>A summary of coverages is not available at this time.</center></div>
                </li>
              </ul>
            </div>
            <div class="text-right pr-1 pt-2 pb-2" id="totalPremiumSection">
                <h6><b>Total Premium:</b> <span id="totalPremium" class="text-success">---</span></h6>
                <div class=\"text-muted\" id="feeNotice"></div>
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
            document.getElementById('policyTermText').innerHTML = "01-01-2021 to 01-01-2022";
        }
        // Quote Number
        if (session.quote_number != null) {
            document.getElementById('policyQuoteText').innerHTML = session.quote_number;
        } else {
            document.getElementById('policyQuoteText').innerHTML = "Q-DEMO-12345";
        }
        // Primary Insured (Policy Owner)
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

        // RISK TABLES
        var risk_types = Object.keys(session.risks);
        var riskTablesHTML = "<br>";

        // Homes Table
        if (risk_types.includes('homes')) {
          riskTablesHTML += generateRiskTable('homes');
        }

        // Drivers Table
        if (risk_types.includes('drivers')) {
          riskTablesHTML += generateRiskTable('drivers');
        }

        // Vehicles Table
        if (risk_types.includes('vehicles')) {
          riskTablesHTML += generateRiskTable('vehicles');
        }

        document.getElementById('risksTables').innerHTML = riskTablesHTML;

        // COVERAGES
        var coveragesHTML = "";
        var quote_risks = session.quote_risks;
        if (quote_risks.risk_state.type.name.includes('policy')) {
            // if (Object.keys(session.quote_risks.risk_state.items).length > 0) {
            //   coveragesHTML += await generateCoverageGroup('policy');
            // }
            // Update the HTML displayed
            document.getElementById('coveragesSummary').innerHTML = coveragesHTML;
            var riskQuotes = quote_risks.risk_quotes;
            var risk_quote_count = riskQuotes.length;
            // var current_index = 0;
            riskQuotes.forEach(async function(risk_quote) {
              if (risk_quote.risk_state.type.name.includes('homes')) {
                var number = risk_quote.number;
                var final_rate = risk_quote.final_rate;
                var items = risk_quote.risk_state.items;
                var name = risk_quote.risk_state.name;
                var adjusted_rate = final_rate;
                if (number == 1) {
                  coveragesHTML = "<div class=\"card\"><div class=\"card-header pl-1\" id=\"heading" + number + "\">";
                  coveragesHTML += "<nav class=\"navbar pl-0 pr-0\">";
                  coveragesHTML += "<span class=\"navbar-brand mb-0 ml-2 h6\">Home " + number + " - " + name + "</span>";
                  coveragesHTML += "<span id=\"home" + number + "_Total\" class=\"text-right text-muted mt-1 pr-1\">" + formatter.format(adjusted_rate) + "</span>";
                  coveragesHTML += "</nav></div>";
                  coveragesHTML += "<div class=\"card-body\">";
                  coveragesHTML += await generateCoverageGroup('homes', number, items, true);
                  coveragesHTML += await generateCoverageGroup('optional', number, items, true);
                  coveragesHTML += "</div>";
                  document.getElementById('coveragesSummary').innerHTML += coveragesHTML;
                } else {
                  coveragesHTML = "<div class=\"card\"><div class=\"card-header pl-1\" id=\"heading" + number + "\">";
                  coveragesHTML += "<nav class=\"navbar pl-0 pr-0\">";
                  coveragesHTML += "<span class=\"navbar-brand mb-0 ml-2 h6\">Home " + number + " - " + name + "</span>";
                  coveragesHTML += "<span id=\"home" + number + "_Total\" class=\"text-right text-muted mt-1 pr-1\">" + formatter.format(adjusted_rate) + "</span>";
                  coveragesHTML += "</nav></div>";
                  coveragesHTML += "<div class=\"card-body\">";
                  coveragesHTML += await generateCoverageGroup('homes', number, items, true);
                  coveragesHTML += await generateCoverageGroup('optional', number, items, true);
                  coveragesHTML += "</div>";
                  document.getElementById('coveragesSummary').innerHTML += coveragesHTML;
                }
              } else if (risk_quote.risk_state.type.name.includes('vehicles')) {
                var number = risk_quote.number;
                var final_rate = risk_quote.final_rate;
                var items = risk_quote.risk_state.items;
                var name = risk_quote.risk_state.name;
                var adjusted_rate = final_rate;

                if ('stateFee' in items) {
                  var state_fee = risk_quote.risk_state.items.stateFee.premium;
                  adjusted_rate -= state_fee;
                }
                if (number == 1) {
                  coveragesHTML = "<div class=\"card\"><div class=\"card-header pl-1\" id=\"heading" + number + "\">";
                  coveragesHTML += "<nav class=\"navbar pl-0 pr-0\">";
                  coveragesHTML += "<span class=\"navbar-brand mb-0 ml-2 h6\">Vehicle " + number + " - " + name + "</span>";
                  coveragesHTML += "<span id=\"vehicle" + number + "_Total\" class=\"text-right text-muted mt-1 pr-1\">" + formatter.format(adjusted_rate) + "</span>";
                  coveragesHTML += "</nav></div>";
                  coveragesHTML += "<div class=\"card-body\">";
                  coveragesHTML += await generateCoverageGroup('vehicles', number, items, true);
                  coveragesHTML += await generateCoverageGroup('optional', number, items, true);
                  coveragesHTML += "</div>";
                  document.getElementById('coveragesSummary').innerHTML += coveragesHTML;
                } else {
                  coveragesHTML = "<div class=\"card\"><div class=\"card-header pl-1\" id=\"heading" + number + "\">";
                  coveragesHTML += "<nav class=\"navbar pl-0 pr-0\">";
                  coveragesHTML += "<span class=\"navbar-brand mb-0 ml-2 h6\">Vehicle " + number + " - " + name + "</span>";
                  coveragesHTML += "<span id=\"vehicle" + number + "_Total\" class=\"text-right text-muted mt-1 pr-1\">" + formatter.format(adjusted_rate) + "</span>";
                  coveragesHTML += "</nav></div>";
                  coveragesHTML += "<div class=\"card-body\">";
                  coveragesHTML += await generateCoverageGroup('vehicles', number, items, true);
                  coveragesHTML += await generateCoverageGroup('optional', number, items, true);
                  coveragesHTML += "</div>";
                  document.getElementById('coveragesSummary').innerHTML += coveragesHTML;
                }
              }
            });
        }
    },
    methods: {
        submitQuote: function() {
            document.getElementById('quoteHeader').innerHTML = "<h5>Submitting your quote...</h5><br><br><i class=\"fa fa-spinner fa-pulse fa-4x fa-fw\"></i>";
            document.getElementById('policyInfoGroup').style.display = "none";
            document.getElementById('policyCoveragesGroup').style.display = "none";
            document.getElementById('totalPremiumSection').style.display = "none";
            document.getElementById('submitNav').style.display = "none";
            // Submit Request
            apiClient.post('/api/quote/' + session.quote_number + '/submit/')
                .then(response => {
                    console.log(response);
                    // Request Review
                    apiClient.post('/api/quote/' + session.quote_number + '/status/triggers/request_review/')
                        .then(response => {
                            console.log(response);
                            document.getElementById('quoteHeader').innerHTML = "<h4>Thank you for your submission!</h4><br><br><span class=\"text-muted\">Someone will contact you shortly regarding your quote.</span><br><br>";
                            document.getElementById('policyInfoGroup').style.display = "block";
                            document.getElementById('policyCoveragesGroup').style.display = "block";
                            document.getElementById('totalPremiumSection').style.display = "block";
                            document.getElementById('printNav').style.display = "block";
                        })
                        .catch(error => {
                            console.log('There was an error:', error.response);
                            document.getElementById('quoteHeader').innerHTML = "<h5>There was an error completing your request. Please try again.</h5>";
                            document.getElementById('policyInfoGroup').style.display = "block";
                            document.getElementById('policyCoveragesGroup').style.display = "block";
                            document.getElementById('totalPremiumSection').style.display = "block";
                            document.getElementById('submitNav').style.display = "block";
                        });
                })
                .catch(error => {
                    console.log('There was an error:', error.response);
                    document.getElementById('quoteHeader').innerHTML = "<h5>There was an error completing your request. Please try again.</h5>";
                    document.getElementById('policyInfoGroup').style.display = "block";
                    document.getElementById('policyCoveragesGroup').style.display = "block";
                    document.getElementById('totalPremiumSection').style.display = "block";
                    document.getElementById('submitNav').style.display = "block";
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
        name: 'Zip',
        components: {
            default: Zip
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
        path: '/risks-count',
        name: 'How Many Risks',
        component: HowManyRisks,
    },
    {
        path: '/risks-summary',
        name: 'Risks',
        component: Risks,
    },
    {
        path: '/risk',
        name: 'Risk',
        component: Risk,
    },
    {
        path: '/coverages',
        name: 'Coverages',
        component: Coverages,
    },
    {
        path: '/billing',
        name: 'Billing',
        component: Billing,
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
