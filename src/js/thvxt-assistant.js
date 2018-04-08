/**
 * @typedef {Object} ResponseObject
 * @property {string} text
 * @property {Object} extra
 */

/**
 * Personalizable assistant that reacts to text or speech input
 * @class Assistant
 */
class Assistant {

    /**
     * Creates an instance of Assistant.
     * @param {string} [root]
     * @param {any} [options] 
     * @param {any} [skills]
     * @memberof Assistant
     */
    constructor(root = "assistant-frame", options = {}, skills = []) {
        this.root = root; // Id of the root div element
        this.config = {
            // Default config for the Assistant class
            name: "Leah",
            // Default answer - no matching skill
            response: {
                text: "Sorry, I don't know what to say. :(",
                extra: "",
            },
            // Welcome message - triggers automatically on load
            welcome: {
                text: `Hi, ask me anything!`,
                extra: "",
            },
            // To disable:
            //welcome: false,
            // Delay before the Assistant answers, even if the response is ready
            delay: 500,
            speech: {
                enabled: true,
                rate: 1,
                volume: 0.35,
                // Set the first as default voice (usually device/OS dependent, not browser)
                voice: 0,
            },
            // Element IDs
            elements: {
                header: "thvxt-chat-header",
                thinker: "thvxt-chat-thinker",
                messageList: "thvxt-chat-messagelist",
                inputForm: "thvxt-chat-inputarea",
                userInput: "thvxt-chat-type",
                sendButton: "thvxt-chat-send",
                recordButton: "thvxt-chat-record",
                settingsButton: "thvxt-chat-settings",
                settingsDiv: "thvxt-chat-settingsContainer",
                voiceToggle: "thvxt-chat-voiceToggle",
                voiceSelect: "thvxt-chat-voiceSelect",
                voiceVolume: "thvxt-chat-voiceVolume",
                voiceRate: "thvxt-chat-voiceRate"
            },
            animations: {
                userMessage: "revealUser",
                assistantMessage: "revealAssistant"
            },
            // Enable saving and loading the settings from the browser
            persistSettings: true,
            // Overwrite defaults
            // NOTE: If you overwrite part of the default config object,
            //       you have to include ALL of it's properties
            ...options
        };
        this.skills = [...skills];
        this.currentlyThinking = false;
        this.previousInputs = {
            history: [],
            index: 0,
            resetTimer: null
        };
        this.location = null;
        // Speech Synthetizer and available voices to choose from
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.initialized = false;
    }

    /**
     * Initialize the Assistant: set up the HTML, precache frequently used objects and keep them updated. 
     * @memberof Assistant
     */
    init() {
        if (this.initialized) {
            return true;
        }
        //console.log("Initializing assistant");
        // Attempt to load any saved settings from LocalStorage
        if (this.config.persistSettings) {
            this.loadSettings();
            // Add an event handler to save settings before closing or reloading the tab
            window.addEventListener("beforeunload", (e) => {
                this.saveSettings();
            })
        }

        // Set up the HTML
        let chatFrame = this.parseHTML(
            `<div class="thvxt-chat-frame">
                <div class="thvxt-chat-header" id="${this.config.elements.header}">
                    Your assistant - ${this.config.name}
                </div>
                <div class="thvxt-chat-content">
                    <ul id="${this.config.elements.messageList}" class="thvxt-chat-messageList"></ul>
                    <div id="${this.config.elements.settingsDiv}" class="thvxt-chat-settings">
                        <h2>Settings</h2>
                        <div>
                            <h3>Speech Synthesis</h3>
                            <span>Enabled</span>
                            <input id="${this.config.elements.voiceToggle}" class="thvxt-chat-voiceToggle" type="checkbox" ${this.config.speech.enabled ? "checked" : ""}>
                        </div>
                        <div>
                            <h3>Voice</h3>
                            <select id="${this.config.elements.voiceSelect}" class="thvxt-chat-voiceSelect">
                                <option default selected>-- loading .. --</selected>
                            </select>
                        </div>
                        <div>
                            <h3>Speech volume</h3>
                            <input id="${this.config.elements.voiceVolume}" class="thvxt-chat-voiceVolume" type="range" value="${this.config.speech.volume}" 
                                min="0" max="1" step="0.05">
                        </div>
                        <div>
                            <h3>Speech rate</h3>
                            <input id="${this.config.elements.voiceRate}" class="thvxt-chat-voiceRate" type="range" value="${this.config.speech.rate}"
                                min="0.1" max="2" step="0.05">
                        </div>
                        <hr class="thvxt-chat-settings-divider">
                        <div class="thvxt-chat-credits">
                            <p>Made by <a href="https://github.com/thavixt" target="_blank">thavixt@github</a>.<p>
                            <small>2018 &copy; Komlósi Péter</small>
                            <br><br>
                            <p>Icons made by <a href="https://www.flaticon.com/authors/smashicons" title="Smashicons">Smashicons</a> and <a href="https://www.flaticon.com/authors/gregor-cresnar" title="Gregor Cresnar">Gregor Cresnar</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a>,<br>licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a>.</p>
                        </div>
                    </div>
                </div>
                <form id="${this.config.elements.inputForm}" class="thvxt-chat-inputForm">
                    <input id="${this.config.elements.userInput}" type="text" placeholder="Type a message" autocomplete="off" />
                    <button id="${this.config.elements.sendButton}" type="submit">
                        <img src="assets/send.svg">
                    </button>
                    <button id="${this.config.elements.recordButton}">
                        <img src="assets/microphone.svg">
                    </button>
                    <button id="${this.config.elements.settingsButton}">
                        <img src="assets/settings.svg">
                    </button>
                </form>
            </div>`);
        let root = document.getElementById(this.root);
        root.innerHTML = "";
        root.appendChild(chatFrame);

        // Keep location info updated every 30s
        this.updateLocation();
        setInterval(this.updateLocation.bind(this), 60000);


        // Chat window open/close toggle
        document.getElementById(this.config.elements.header)
            .addEventListener("click", this.toggleFrame.bind(this));

        // User input submit
        document.getElementById(this.config.elements.inputForm)
            .addEventListener("submit", this.handleInput.bind(this));
        // User input history
        document.getElementById(this.config.elements.userInput)
            .addEventListener("keydown", this.useInputHistory.bind(this));


        // User input - recording
        document.getElementById(this.config.elements.recordButton)
            .addEventListener("click", (e) => {
                e.preventDefault();
                this.reply({
                    text: "Sorry, I have no ears - yet.",
                    extra: "(My developer is working on it!)"
                });
            });

        // Wait for the Speech Synthetizer to load
        this.synth.onvoiceschanged = () => {
            // Get all available voices from the Synthetizer
            this.voices = this.synth.getVoices();
            // Clear voice select list
            let selectList = document.getElementById(this.config.elements.voiceSelect);
            selectList.innerHTML = "";
            // Append all voice options
            let currentIndex = this.config.speech.voice;
            this.voices.map((el, i) => {
                let selected = (i == currentIndex) ? "selected" : "";
                let option = this.parseHTML(
                    `<option ${selected} data-index="${i}">${el.name}</option>`
                );
                selectList.appendChild(option);
            });
            // Event handler for changing the active voice from the select list
            selectList.addEventListener("change", (e) => {
                let target = e.target;
                this.config.speech.voice = target.options[target.selectedIndex].dataset.index;
            });
            // Welcome message if defined
            if (!this.initialized && this.config.welcome) {
                this.reply(this.config.welcome);
            }
            // Finished initializing the synthesizer
            this.initialized = true;
        };
        // Speech synthesis enable/disable toggle
        document.getElementById(this.config.elements.voiceToggle).addEventListener("change", (e) => {
            let target = e.target;
            this.config.speech.enabled = target.checked;
        });
        // Speech volume change handler
        document.getElementById(this.config.elements.voiceVolume).addEventListener("change", (e) => {
            let target = e.target;
            this.config.speech.volume = parseFloat(target.value);
        });
        // Speech rate change handler
        document.getElementById(this.config.elements.voiceRate).addEventListener("change", (e) => {
            let target = e.target;
            this.config.speech.rate = parseFloat(target.value);
        });

        // Toggle settings div
        document.getElementById(this.config.elements.settingsButton)
            .addEventListener("click", (e) => {
                let settingsDiv = document.getElementById(this.config.elements.settingsDiv);
                let messageList = document.getElementById(this.config.elements.messageList);
                // Check if the settings div is open at the momemt
                let isSettingsOpen = document.getElementById(this.config.elements.settingsDiv)
                    .classList.contains("show");
                // Toggle div
                if (isSettingsOpen) {
                    settingsDiv.classList.remove("show");
                    messageList.classList.remove("hide");
                    if (!this.currentlyThinking) {
                        this.enableInput(true);
                    }
                } else {
                    this.enableInput(false);
                    settingsDiv.classList.add("show");
                    messageList.classList.add("hide");
                }
            });
        return true;
    }


    /**
     * Save the current config to LocalStorage.
     * @returns {Object|Boolean}
     * @memberof Assistant
     */
    loadSettings() {
        let loadedConfig = JSON.parse(localStorage.getItem('thvxt-assistant'));
        if (!loadedConfig) {
            //console.log("No saved settings found.");
            return false;
        } else {
            this.config.speech = {
                enabled: loadedConfig.enabled,
                voice: parseInt(loadedConfig.voice),
                volume: parseFloat(loadedConfig.volume),
                rate: parseFloat(loadedConfig.rate),
            };
            //console.log("Settings loaded from a previous session.");
            return true;
        }
    }

    /**
     * Load a previously saved config from LocalStorage.
     * @memberof Assistant
     */
    saveSettings() {
        localStorage.setItem('thvxt-assistant', JSON.stringify(this.config.speech));
        //console.log("Settings saved.");
    }


    /**
     * Returns the current time in 'hh:mm' format. 
     * @returns {string}
     * @memberof Assistant
     */
    getTime() {
        let date = new Date();
        let time = ((date.getHours() < 10) ? "0" : "") + date.getHours() + ":" +
            ((date.getMinutes() < 10) ? "0" : "") + date.getMinutes();
        return time;
    }

    /**
     * Parser an HTML string and return it as an HTMLTextNode.
     * The provided HTML must have a parent element (like JSX).
     * @param {string} domstring 
     * @returns {Node}
     * @memberof Assistant
     */
    parseHTML(domstring) {
        let html = new DOMParser().parseFromString(domstring, 'text/html');
        return html.body.childNodes[0];
    };


    /**
     * Update the device's physical coordinates. 
     * @memberof Assistant
     */
    updateLocation() {
        //console.log("Updating location");
        /* this.location = {
            coords: {
                latitude: 47.5056222,
                longitude: 19.082198599,
            },
            timestamp: new Date() - 30001
        } 
        return true; */
        navigator.geolocation.getCurrentPosition((position) => {
            this.location = position;
            //console.log("Location cached.", position);
        }, (error) => {
            console.error(`Location update failed due to: ${error.message} (Error code ${error.code})`);
        }, {
            enableHighAccuracy: true, // faster?
            timeout: 29000, // 15 sec
            maximumAge: 60000 // 0.5 minute
        });
    }


    /**
     * Open or close the chat window. 
     * @memberof Assistant
     */
    toggleFrame() {
        let frame = document.getElementsByClassName("thvxt-chat-frame")[0];
        let isFrameMinimized = frame.classList.contains("minimized");
        // Toggle div
        if (isFrameMinimized) {
            document.getElementById(this.root).style.maxHeight = "initial";
            frame.classList.remove("minimized");
            this.enableInput(true);
        } else {
            document.getElementById(this.config.elements.settingsDiv).classList.remove("show");
            document.getElementById(this.config.elements.messageList).classList.remove("hide");
            this.enableInput(false);
            document.getElementById(this.root).style.maxHeight = "2em";
            frame.classList.add("minimized");
        }
    }

    /**
     * Toogle inputs or return their state.
     * @param {Boolean} [bool] 
     * @returns {Boolean}
     * @memberof Assistant
     */
    enableInput(bool) {
        if (typeof bool === "undefined") {
            // Return state
            return !document.getElementById(this.config.elements.userInput).disabled;
        }
        // Set state
        document.getElementById(this.config.elements.userInput).disabled = !bool;
        document.getElementById(this.config.elements.sendButton).disabled = !bool;
        document.getElementById(this.config.elements.recordButton).disabled = !bool;
        //document.getElementById(this.config.elements.userInput).focus();
        return bool;
    }


    /**
     * Forward a user-initiated input to the Assistant. 
     * @param {Event} e 
     * @returns {Promise}
     * @memberof Assistant
     */
    handleInput(e) {
        e.preventDefault();

        // Reset history index
        this.previousInputs.index = -1;
        // Check input value
        let inputText = document.getElementById(this.config.elements.userInput).value;
        if (!inputText) {
            // Empty input
            return false;
        }
        // Reset input value
        document.getElementById(this.config.elements.userInput).value = "";
        // Display message
        this.addUserMessage(inputText);
        this.thinking(true);
        this.enableInput(false);
        return this.process(inputText)
            .then(reply => {
                this.thinking(false);
                this.enableInput(true);
            });

    }


    /**
     * Set the Assistant's thinking indicator, or return the state of thinking.
     * @param {Boolean} [bool]
     * @returns {Boolean}
     * @memberof Assistant
     */
    thinking(bool) {
        // Return state
        if (typeof bool === "undefined") {
            let el = document.getElementById(this.config.elements.thinker);
            return this.currentlyThinking;
        }
        // Set state
        this.currentlyThinking = bool;
        // Append a thinker element
        if (bool) {
            if (document.getElementById(this.config.elements.thinker)) {
                // A thinker is already present
                return this;
            }
            let msgList = document.getElementById(this.config.elements.messageList);
            // Create a new thinker element 
            let newMsg = this.parseHTML(
                `<div id="${this.config.elements.thinker}">
                    <div class="thvxt-chat-spinner">
                        <div class="bounce1"></div>
                        <div class="bounce2"></div>
                        <div class="bounce3"></div>
                    </div>
                </div>`);
            setTimeout(() => {
                // Append to list
                msgList.appendChild(newMsg);
                // Scroll into view
                msgList.scrollTop = msgList.scrollHeight;
            }, 250)
        }
        // Or remove the thinker element
        else {
            let thinker = document.getElementById(this.config.elements.thinker);
            if (thinker) {
                // There is a thinker to remove
                thinker.outerHTML = "";
            }
        }
        return this;
    }


    /**
     * Check an input if it contains the skill's trigger phrase.
     * (Uses regular expressions.)
     * @param {object} skill 
     * @param {string} sentence 
     * @returns {string|false}
     * @memberof Assistant
     */
    checkTrigger(skill, sentence) {
        for (const phrase of skill.triggers) {
            // Match phrase to the sentence (case insensitive)
            let match = sentence.match(new RegExp(phrase, 'i'));
            if (match) {
                return match;
            }
        }
        return false;
    }


    /**
     * Process an input and return a reply string
     * @param {string} sentence
     * @param {Boolean} justReturn use this for tests!
     * @returns {string}
     * @memberof Assistant
     */
    process(sentence, justReturn) {
        // Save input to 'memory' (up to 10)
        this.previousInputs.history.unshift(sentence);
        if (this.previousInputs.history.length > 10) {
            this.previousInputs.history.pop();
        }
        // Loop through all skills
        for (const skill of this.skills) {
            // Check if the sentence contains a trigger phrase
            let match = this.checkTrigger(skill, sentence);
            // If a trigger phrase is found, run its resolver function
            if (match) {
                //console.log("Skill matched: ", skill, match);
                let delay = skill.delay || this.config.delay;
                // Run the resolver function of the matched skill
                return skill.resolver(this, match, sentence)
                    // Add a delay (pass the result through this Promise!)
                    .then((result) => new Promise(resolve => setTimeout(() => resolve(result), delay)))
                    // Return the computed response
                    .then((response) => {
                        if (justReturn) {
                            return {
                                success: true,
                                ...response,
                                matchedSkill: skill,
                                default: false
                            };
                        } else {
                            this.reply({
                                success: true,
                                ...response,
                                matchedSkill: skill,
                                default: false
                            });
                        }
                    });
            }
        }
        // Default response 
        let defaultReply = {
            ...this.config.response,
            success: false,
            default: true
        }
        if (justReturn) {
            return new Promise(resolve => resolve(defaultReply));
        } else {
            return new Promise(resolve => setTimeout(() => resolve(this.reply(defaultReply)), this.config.delay));
        }

    }


    /**
     * Process a response object and returns a computed reply string.
     * @param {ResponseObject} response
     * @returns {string}
     * @memberof Assistant
     */
    reply(response) {
        this.addAssistantReply(response);
        if (this.config.speech.enabled) {
            this.speak(response.text);
        }
        // Format the Assistant's response
        return response;
    }


    /**
     * Read a response text with Speech Synthesis.
     * @param {string} sentence 
     * @memberof Assistant
     */
    speak(sentence) {
        if (!this.voices.length) {
            this.voices = window.speechSynthesis.getVoices();
        }
        // Let the Assistant speak after some delay
        const filtered = sentence.replace(/%/g, ' percent')
            .replace(/[&\/\\()~*<>{}]/g, '');
        const msg = new SpeechSynthesisUtterance(filtered);
        // Set options
        msg.volume = this.config.speech.volume;
        msg.rate = this.config.speech.rate;
        msg.voice = this.voices[this.config.speech.voice];
        //console.log(msg); 
        setTimeout(() => {
            window.speechSynthesis.speak(msg);
        }, 100);
    }


    /**
     * Display a reply from the Assistant.
     * @param {ResponseObject} reply
     * @memberof Assistant
     */
    addAssistantReply(reply) {
        let msgList = document.getElementById(this.config.elements.messageList);
        let newMsg = this.parseHTML(
            `<li class="message assistant ${this.config.animations.assistantMessage}">
                <img class="image" src="assets/assistant.jpg">
                <div class="arrow"></div>
                <div class="text">
                    <p>${reply.text}</br>${reply.extra}</p>
                    <small>${this.getTime()}</small>
                </div>
            </li>`);
        // Append to list
        msgList.appendChild(newMsg);
        // Scroll into view
        msgList.scrollTop = msgList.scrollHeight;
        // Remove the class responsible for animation
        setTimeout(() => {
            newMsg.classList.remove(this.config.animations.assistantMessage);
        }, 500);
    }


    /**
     * Display an input from the user.
     * @param {ResponseObject} reply
     * @memberof Assistant
     */
    addUserMessage(message) {
        let msgList = document.getElementById(this.config.elements.messageList);
        let newMsg = this.parseHTML(
            `<li class="message user ${this.config.animations.userMessage}">
                <img class="image" src="assets/user.png">
                <div class="arrow"></div>
                <div class="text">
                    <p>${message}</p>
                    <small>${this.getTime()}</small>
                </div>
            </li>`);
        // Append to list
        msgList.appendChild(newMsg);
        // Scroll into view
        msgList.scrollTop = msgList.scrollHeight;
        // Remove the class responsible for animation
        setTimeout(() => {
            newMsg.classList.remove(this.config.animations.userMessage);
        }, 500);
    }


    /**
     * Replace the input string with the historical user input. 
     * @param {Event} e 
     * @memberof Assistant
     */
    useInputHistory(e) {
        let input = document.getElementById(this.config.elements.userInput);
        // If an 'Up arrow pressed' event happened and the input is in focus
        if ((e.which == 38 || e.which == 40) && input == document.activeElement) {
            // Reset the timer to reset the current history index after 3s
            clearTimeout(this.previousInputs.resetTimer);
            this.previousInputs.resetTimer = setTimeout(() => {
                this.previousInputs.index = -1;
            }, 3000);

            // Store the current input value
            let futureValue = input.value;

            // On down arrow, go backward in the history
            if (e.which == 40) {
                this.previousInputs.index--;
                if (!this.previousInputs.history[this.previousInputs.index]) {
                    this.previousInputs.index = 0;
                }
                // Set input value
                futureValue = this.previousInputs.history[this.previousInputs.index];
            }
            // On up arrow, go forwards in the history
            if (e.which == 38) {
                this.previousInputs.index++;
                if (!this.previousInputs.history[this.previousInputs.index]) {
                    this.previousInputs.index = this.previousInputs.history.length - 1;
                }
                // Set input value
                futureValue = this.previousInputs.history[this.previousInputs.index];
            }

            // Set input value
            if (futureValue) {
                input.value = futureValue;
            }
        }
    }
}