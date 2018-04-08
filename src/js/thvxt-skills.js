const skills = [
    // Example skill with triggers and a resolver function
    {
        // Unique name of the skill
        name: "simons says",
        // Triggers must be strings or regexp expressions to match against user input
        triggers: [/simon says (.*)/, /simon said (.*)/],
        resolver: (self, match, sentence) => new Promise((resolve) => {
            // The resolved object must containt a string response (text) and an extra string (extra) with any other data
            resolve({
                text: `'${match[1]}'`, // Required - response text to send back
                extra: `<a href="https://en.wikipedia.org/wiki/Simon_Says" target="_blank">Simon Says - Wikipedia</a>`, // Optional - any valid HTML, can include links, images, video, etc
                success: true, // Optional - only required if you don't get the expected result ('false' in that case)
            });
        })
    },

    // Greet
    {
        name: "greet",
        triggers: [/hi/, /hello/, /whats up/],
        resolver: (self, match, sentence) => new Promise((resolve) => {
            resolve({
                text: `Hi, I'm ${self.config.name}, how can I help you?`,
                extra: ""
            });
        })
    },

    // Time & date
    {
        name: "time",
        triggers: [/clock/, /time/],
        resolver: (self, match, sentence) => new Promise((resolve) => {
            let date = new Date();
            let time = ((date.getHours() < 10) ? "0" : "") + date.getHours() + ":" +
                ((date.getMinutes() < 10) ? "0" : "") + date.getMinutes();
            resolve({
                text: `It's ${time}.`,
                extra: ""
            });
        })
    },
    {
        name: "date",
        triggers: [/date/, /day today/, /what day is it/, /today/],
        resolver: (self, match, sentence) => new Promise((resolve) => {
            let date = new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            resolve({
                text: `Today is ${date}.`,
                extra: ""
            });
        })
    },

    // Battery
    {
        name: "battery",
        triggers: [/my|the|phone'?s battery/],
        resolver: (self, match, sentence) => new Promise((resolve) => {
            if ("getBattery" in navigator) {
                navigator.getBattery().then(function (battery) {
                    let level = (battery.level * 100).toFixed(0);
                    let isCharging = (battery.charging) ? "It's charging." : "It's not charging at the moment.";
                    let comment = (level < 50) ? "You should plug in your charger." : "It's fine for now.";
                    resolve({
                        text: `Your battery is at ${level}%. ${isCharging} ${comment}`,
                        extra: ""
                    });
                })
            } else {
                resolve({
                    text: `Sorry, I can't access the battery status on this device.`,
                    extra: ""
                });
            }
        })
    },

    // Location
    {
        name: "location",
        triggers: [/where am i/, /my address/, /locate me/, /my location/],
        resolver: (self, match, sentence) => new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve({
                    text: `I can't find you unless you enable Geolocation in your browser.`,
                    extra: ""
                });
            }

            function success(position) {
                // Save location for later use
                self.location = position;
                // Grab coords
                let latitude = position.coords.latitude;
                let longitude = position.coords.longitude;
                // Generate a Google Maps url and an image preview for it
                let zoom = 16;
                let size = "200x200";
                let img = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${size}&sensor=false&markers=color:blue%7Clabel:You%7C${latitude},${longitude}&key=AIzaSyAeDB_rnFeP2e19E98PD934sjURcGdEwNo`;
                let mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&zoom=${zoom+2}`;

                if ('google' in window && google.maps.Geocoder) {
                    // Geocode the street adress from the coords
                    let geocoder = new google.maps.Geocoder;
                    let result = geocoder.geocode({
                        'location': {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        }
                    }, (results, status) => {
                        let address = "Sorry, I couldn't find your address.";
                        //console.log(results);
                        if (status === 'OK' && results[0]) {
                            address = "You are at " + results[0].formatted_address;
                        }
                        resolve({
                            text: `${address}`,
                            extra: `<br><a href=${mapUrl} target="_blank"><img src="${img}" /></a><br><small>Click to open Google Maps</small>`
                        });
                    });
                } else {
                    // Google Maps Geocoding is not provided
                    resolve({
                        text: `You are here:`,
                        extra: `<br><a href=${mapUrl} target="_blank"><img src="${img}" /></a><br><small>Click to open Google Maps<small>`
                    });
                }
            }

            function error() {
                resolve({
                    text: `Sorry, I couldn't find your location. Try again in a minute.`,
                    extra: "",
                    success: false
                });
            }

            if (self.location && self.location.timestamp < new Date() - 30000) {
                // Location was cached previously, but only keep it for 0.5 minute
                success(self.location);
            } else {
                // Get position (can be really slow for the first time)
                navigator.geolocation.getCurrentPosition(success, error, {
                    enableHighAccuracy: true, // faster
                    timeout: 15000, // 15 sec
                    maximumAge: 30000 // 0.5 minute
                });
            }


        })
    },
    // Navigation
    {
        name: "directions",
        triggers: [/directions to (.*)/, /navigate to (.*)/, /navigate me to (.*)/],
        resolver: (self, match, sentence) => new Promise((resolve) => {
            let destination = match[1];
            let origin = self.location ? self.location.coords.latitude + "," + self.location.coords.longitude : "";
            const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&origin=${origin}&travelmode=transit`;
            //window.open(url);
            resolve({
                text: `Sure, here's a path to get to '${destination}':`,
                extra: `<a href="${url}" target="_blank">Navigate to '${destination}'.</a>`
            });
        })
    },

    // Searching (google, wikipedia, spotify)
    {
        name: "wikipedia search",
        triggers: [/find wikipedia|wiki for (<searchTerm>.*)/, /search wikipedia|wiki for (.*)/],
        resolver: (self, match, sentence) => new Promise((resolve) => {
            let searchTerm = match[1];
            setTimeout(() => window.open('https://en.wikipedia.org/w/index.php?search=' + searchTerm), 1000);
            resolve({
                text: `Alright, let me search Wikipedia for '${searchTerm}'.`,
                extra: ""
            });
        })
    },
    {
        name: "google search",
        triggers: [/google for? (.*)/, /search for? (.*)/],
        resolver: (self, match, sentence) => new Promise((resolve) => {
            let searchTerm = match[1];
            setTimeout(() => window.open('http://google.com/search?q=' + searchTerm), 1000);
            resolve({
                text: `Alright, let me Google '${searchTerm}'.`,
                extra: ""
            });
        })
    },
    {
        name: "spotify search",
        triggers: [/search spotify for? (<searchTerm>.*)/, /search song called? (.*)/],
        resolver: (self, match, sentence) => new Promise((resolve) => {
            let searchTerm = match[1];
            setTimeout(() => window.open('https://open.spotify.com/search/results/' + searchTerm), 1000);
            resolve({
                text: `Alright, let me search Spotify for '${searchTerm}'.`,
                extra: ""
            });
        })
    },

    // Other

];