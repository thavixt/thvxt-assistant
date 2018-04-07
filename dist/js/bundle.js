const skills = [
    {
        name: "simons says",
        triggers: [/simon says (.*)/, /simon said (.*)/],
        resolver: (self, match, sentence) => new Promise((resolve) => {
            resolve({
                text: `'${match[1]}'`,
                extra: "",
                success: true,
            });
        })
    },
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
                });
            }
            else {
                resolve({
                    text: `Sorry, I can't access the battery status on this device.`,
                    extra: ""
                });
            }
        })
    },
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
                self.location = position;
                let latitude = position.coords.latitude;
                let longitude = position.coords.longitude;
                let zoom = 16;
                let size = "200x200";
                let img = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${size}&sensor=false&markers=color:blue%7Clabel:You%7C${latitude},${longitude}&key=AIzaSyAeDB_rnFeP2e19E98PD934sjURcGdEwNo`;
                let mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&zoom=${zoom + 2}`;
                let geocoder = new google.maps.Geocoder;
                let result = geocoder.geocode({
                    'location': {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                }, (results, status) => {
                    let address = "Sorry, I couldn't find your address.";
                    if (status === 'OK' && results[0]) {
                        address = "You are at " + results[0].formatted_address;
                    }
                    resolve({
                        text: `${address}`,
                        extra: `<br><a href=${mapUrl} target="_blank"><img src="${img}" /></a><br><small>Click to open Google Maps<small>`
                    });
                });
            }
            function error() {
                resolve({
                    text: `Sorry, I couldn't find your location. Try again in a minute.`,
                    extra: "",
                    success: false
                });
            }
            if (self.location && self.location.timestamp < new Date() - 30000) {
                success(self.location);
            }
            else {
                navigator.geolocation.getCurrentPosition(success, error, {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 30000
                });
            }
        })
    },
    {
        name: "directions",
        triggers: [/directions to (.*)/, /navigate to (.*)/, /navigate me to (.*)/],
        resolver: (self, match, sentence) => new Promise((resolve) => {
            let destination = match[1];
            let origin = self.location ? self.location.coords.latitude + "," + self.location.coords.longitude : "";
            const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&origin=${origin}&travelmode=transit`;
            resolve({
                text: `Sure, here's a path to get to '${destination}':`,
                extra: `<a href="${url}" target="_blank">Navigate to '${destination}'.</a>`
            });
        })
    },
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
                text: `Alright, let me Google '${searchTerm}'.`,
                extra: ""
            });
        })
    },
];
class Assistant {
    constructor(root = "assistant-frame", options = {}, skills = []) {
        this.root = root;
        this.config = Object.assign({ name: "Leah", response: {
                text: "I don't know what to say :(",
                extra: "",
            }, delay: 500, speech: {
                enabled: true,
                rate: 1,
                volume: 1,
                voice: 0,
            }, elements: {
                thinker: "thvxt-chat-thinker",
                messageList: "thvxt-chat-messagelist",
                inputForm: "thvxt-chat-inputarea",
                userInput: "thvxt-chat-type",
                sendButton: "thvxt-chat-send",
                recordButton: "thvxt-chat-record",
                settingsButton: "thvxt-chat-settings",
                settingsDiv: "thvxt-chat-settingsContainer",
                voiceSelect: "thvxt-chat-voiceSelect",
                voiceVolume: "thvxt-chat-voiceVolume",
                voiceRate: "thvxt-chat-voiceRate"
            }, animations: {
                userMessage: "revealUser",
                assistantMessage: "revealAssistant"
            } }, options);
        this.skills = [...skills];
        this.currentlyThinking = false;
        this.previousInputs = {
            history: [],
            index: 0,
            resetTimer: null
        };
        this.location = null;
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.selectedVoice = 0;
    }
    init() {
        let chatFrame = this.parseHTML(`<div class="thvxt-chat-frame">
                <ul id="${this.config.elements.messageList}" class="thvxt-chat-messageList"></ul>
                <div id="${this.config.elements.settingsDiv}" class="thvxt-chat-settings">
                    <h2>Settings</h2>
                    <div>
                        <h3>Voice</h3>
                        <select id="${this.config.elements.voiceSelect}" class="thvxt-chat-voiceSelect">
                            <option default selected>-- loading .. --</selected>
                        </select>
                    </div>
                    <div>
                        <h3>Speech volume</h3>
                        <input id="${this.config.elements.voiceVolume}" class="thvxt-chat-voiceVolume" type="range" value=${this.config.speech.volume}" 
                            min="0" max="2" step="0.1">
                    </div>
                    <div>
                        <h3>Speech rate</h3>
                        <input id="${this.config.elements.voiceRate}" class="thvxt-chat-voiceRate" type="range" value="${this.config.speech.rate}"
                            min="0.5" max="1.5" step="0.1">
                    </div>
                    <div>
                        <p>Made by <a href="https://github.com/thavixt" target="_blank">thavixt@github</a>.<p>
                        <small>2018 &copy; Komlósi Péter</small>
                        <br><br>
                        <p>Icons made by <a href="https://www.flaticon.com/authors/smashicons" title="Smashicons">Smashicons</a> and <a href="https://www.flaticon.com/authors/gregor-cresnar" title="Gregor Cresnar">Gregor Cresnar</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a>, licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a>.</p>
                    </div>
                </div>
                <form id="${this.config.elements.inputForm}" class="thvxt-chat-inputForm">
                    <input id="${this.config.elements.userInput}" type="text" placeholder="Type a message" autocomplete="off" />
                    <button id="${this.config.elements.sendButton}" type="submit">
                        <img src="/assets/svg/send.svg">
                    </button>
                    <button id="${this.config.elements.recordButton}">
                        <img src="/assets/svg/microphone.svg">
                    </button>
                    <button id="${this.config.elements.settingsButton}">
                        <img src="/assets/svg/settings.svg">
                    </button>
                </form>
            </div>`);
        document.getElementById(this.root).appendChild(chatFrame);
        this.updateLocation();
        setInterval(this.updateLocation.bind(this), 60000);
        document.getElementById(this.config.elements.inputForm)
            .addEventListener("submit", this.handleInput.bind(this));
        document.getElementById(this.config.elements.userInput)
            .addEventListener("keydown", this.useInputHistory.bind(this));
        window.speechSynthesis.onvoiceschanged = () => {
            this.voices = this.synth.getVoices();
            let selectList = document.getElementById(this.config.elements.voiceSelect);
            selectList.innerHTML = "";
            let currentIndex = this.selectedVoice;
            this.voices.map((el, i) => {
                let selected = (i == currentIndex) ? "selected" : "";
                let option = this.parseHTML(`<option ${selected} data-index="${i}">${el.name}</option>`);
                selectList.appendChild(option);
            });
            selectList.addEventListener("change", (e) => {
                let target = e.target;
                this.selectedVoice = target.options[target.selectedIndex].dataset.index;
            });
        };
        document.getElementById(this.config.elements.voiceVolume).addEventListener("change", (e) => {
            let target = e.target;
            this.config.speech.volume = target.value;
        });
        document.getElementById(this.config.elements.voiceRate).addEventListener("change", (e) => {
            let target = e.target;
            this.config.speech.rate = target.value;
        });
        document.getElementById(this.config.elements.settingsButton)
            .addEventListener("click", (e) => {
            let settingsDiv = document.getElementById(this.config.elements.settingsDiv);
            let isSettingsOpen = document.getElementById(this.config.elements.settingsDiv)
                .classList.contains("show");
            if (isSettingsOpen) {
                settingsDiv.classList.remove("show");
                this.enableInput(true);
            }
            else {
                this.enableInput(false);
                settingsDiv.classList.add("show");
            }
        });
    }
    getTime() {
        let date = new Date();
        let time = ((date.getHours() < 10) ? "0" : "") + date.getHours() + ":" +
            ((date.getMinutes() < 10) ? "0" : "") + date.getMinutes();
        return time;
    }
    parseHTML(domstring) {
        let html = new DOMParser().parseFromString(domstring, 'text/html');
        return html.body.childNodes[0];
    }
    ;
    updateLocation() {
        navigator.geolocation.getCurrentPosition((position) => {
            this.location = position;
        }, (error) => {
            console.error(`Location update failed due to: ${error.message} (Error code ${error.code})`);
        }, {
            enableHighAccuracy: true,
            timeout: 29000,
            maximumAge: 60000
        });
    }
    enableInput(bool) {
        if (typeof bool === "undefined") {
            return !document.getElementById(this.config.elements.userInput).disabled;
        }
        document.getElementById(this.config.elements.userInput).disabled = !bool;
        document.getElementById(this.config.elements.sendButton).disabled = !bool;
        document.getElementById(this.config.elements.recordButton).disabled = !bool;
        document.getElementById(this.config.elements.userInput).focus();
        return bool;
    }
    handleInput(e) {
        e.preventDefault();
        this.previousInputs.index = -1;
        let inputText = document.getElementById(this.config.elements.userInput).value;
        if (!inputText) {
            return false;
        }
        document.getElementById(this.config.elements.userInput).value = "";
        this.addUserMessage(inputText);
        this.thinking(true);
        this.enableInput(false);
        return this.process(inputText)
            .then(reply => {
            this.thinking(false);
            this.addAssistantReply(reply);
            this.enableInput(true);
        });
    }
    thinking(bool) {
        if (typeof bool === "undefined") {
            let el = document.getElementById(this.config.elements.thinker);
            return this.currentlyThinking;
        }
        this.currentlyThinking = bool;
        if (bool) {
            if (document.getElementById(this.config.elements.thinker)) {
                return this;
            }
            let msgList = document.getElementById(this.config.elements.messageList);
            let newMsg = this.parseHTML(`<div id="${this.config.elements.thinker}">
                    <div class="thvxt-chat-spinner">
                        <div class="bounce1"></div>
                        <div class="bounce2"></div>
                        <div class="bounce3"></div>
                    </div>
                </div>`);
            setTimeout(() => {
                msgList.appendChild(newMsg);
                msgList.scrollTop = msgList.scrollHeight;
            }, 250);
        }
        else {
            let thinker = document.getElementById(this.config.elements.thinker);
            if (thinker) {
                thinker.outerHTML = "";
            }
        }
        return this;
    }
    checkTrigger(skill, sentence) {
        for (const phrase of skill.triggers) {
            let match = sentence.match(new RegExp(phrase, 'i'));
            if (match) {
                return match;
            }
        }
        return false;
    }
    process(sentence) {
        this.previousInputs.history.unshift(sentence);
        if (this.previousInputs.history.length > 10) {
            this.previousInputs.history.pop();
        }
        for (const skill of this.skills) {
            let match = this.checkTrigger(skill, sentence);
            if (match) {
                let delay = skill.delay || this.config.delay;
                return skill.resolver(this, match, sentence)
                    .then((result) => new Promise(resolve => setTimeout(() => resolve(result), delay)))
                    .then((response) => this.reply(Object.assign({ success: true }, response, { matchedSkill: skill, default: false })));
            }
        }
        let defaultReply = Object.assign({}, this.config.response, { success: false, default: true });
        return new Promise(resolve => setTimeout(() => resolve(this.reply(defaultReply)), this.config.delay));
        return this.reply(defaultReply);
    }
    reply(response) {
        let sentence = response.text;
        if (this.config.speech.enabled) {
            this.speak(response.text);
        }
        return response;
    }
    speak(sentence) {
        if (!this.voices.length) {
            this.voices = window.speechSynthesis.getVoices();
        }
        const filtered = sentence.replace(/%/g, ' percent')
            .replace(/[&\/\\()~*<>{}]/g, '');
        const msg = new SpeechSynthesisUtterance(filtered);
        msg.volume = this.config.speech.volume;
        msg.rate = this.config.speech.rate;
        msg.voice = this.voices[this.selectedVoice];
        setTimeout(() => {
            window.speechSynthesis.speak(msg);
        }, 100);
    }
    addAssistantReply(reply) {
        let msgList = document.getElementById(this.config.elements.messageList);
        let newMsg = this.parseHTML(`<li class="message assistant ${this.config.animations.assistantMessage}">
                <img class="image" src="assets/assistant.jpg">
                <div class="arrow"></div>
                <div class="text">
                    <p>${reply.text}</br>${reply.extra}</p>
                    <small>${this.getTime()}</small>
                </div>
            </li>`);
        msgList.appendChild(newMsg);
        msgList.scrollTop = msgList.scrollHeight;
        setTimeout(() => {
            newMsg.classList.remove(this.config.animations.assistantMessage);
        }, 500);
    }
    addUserMessage(message) {
        let msgList = document.getElementById(this.config.elements.messageList);
        let newMsg = this.parseHTML(`<li class="message user ${this.config.animations.userMessage}">
                <img class="image" src="assets/user.png">
                <div class="arrow"></div>
                <div class="text">
                    <p>${message}</p>
                    <small>${this.getTime()}</small>
                </div>
            </li>`);
        msgList.appendChild(newMsg);
        msgList.scrollTop = msgList.scrollHeight;
        setTimeout(() => {
            newMsg.classList.remove(this.config.animations.assistantMessage);
        }, 500);
    }
    useInputHistory(e) {
        let input = document.getElementById(this.config.elements.userInput);
        if ((e.which == 38 || e.which == 40) && input == document.activeElement) {
            clearTimeout(this.previousInputs.resetTimer);
            this.previousInputs.resetTimer = setTimeout(() => {
                this.previousInputs.index = -1;
            }, 3000);
            let futureValue = input.value;
            if (e.which == 40) {
                this.previousInputs.index--;
                if (!this.previousInputs.history[this.previousInputs.index]) {
                    this.previousInputs.index = 0;
                }
                futureValue = this.previousInputs.history[this.previousInputs.index];
            }
            if (e.which == 38) {
                this.previousInputs.index++;
                if (!this.previousInputs.history[this.previousInputs.index]) {
                    this.previousInputs.index = this.previousInputs.history.length - 1;
                }
                futureValue = this.previousInputs.history[this.previousInputs.index];
            }
            input.value = futureValue;
        }
    }
}
const assistant = new Assistant("chat-container", {
    name: "Emma",
    elements: {
        thinker: "my-chat-thinker",
        messageList: "my-chat-messagelist",
        inputForm: "my-chat-inputarea",
        userInput: "my-chat-type",
        sendButton: "my-chat-send",
        recordButton: "my-chat-record",
        settingsButton: "my-chat-settings",
        settingsDiv: "my-chat-settingsContainer",
        voiceSelect: "my-chat-voiceSelect",
        voiceVolume: "my-chat-voiceVolume",
        voiceRate: "my-chat-voiceRate"
    },
    speech: {
        enabled: true,
        rate: 1.2,
        volume: 0.8,
        voice: 0,
    },
}, [...skills]);
assistant.init();
console.log("Assistant: ", assistant);
//# sourceMappingURL=bundle.js.map