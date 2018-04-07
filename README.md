# Thvxt Assistant - The Modular Javascript Chatbot





## Description

Thvxt Assistant is a browser-based chatbot written with vanilla ES6 code and *zero dependencies*.

Features include:
* easy installation,
* custom styling,
* voice recognition,
* modular, plugin-like *skills*.

## Installation

All you have to do is download and include `thvxt-assistant.js` and `thxt-assistant.css` in your HTML markup:

```html
    <!-- Css-->
    <link rel="stylesheet" href="thvxt-assistant.css">
    
    <!-- Optional dependency -->
    <script src="https://maps.googleapis.com/maps/api/js?key=<YOUR_GOOGLE_MAPS_API_KEY>"></script>
    <!-- Javascript -->
    <script src="thvxt-assistant.js"></script>
```

Or link to the files directly:

```html
    <!-- Css-->
    <link rel="stylesheet" href="https://raw.githubusercontent.com/thavixt/thvxt-assistant/master/css/thvxt-assistant.css">
    <!-- Javascript -->
    <script src="https://raw.githubusercontent.com/thavixt/thvxt-assistant/master/js/thvxt-assistant.js"></script>
```

The *Google Maps Javascript API* is an optional dependency. It's used for some default *skills*, but the plugin will work without it.

Create an instance of Assistant:

```javascript
const assistant = new Assistant(root, config, skill);

// Or in a bit more detail:
const assistant = new Assistant(
    // Root div ID (the only required parameter)
    "chat-container",
    // Default config object
    // NOTE: If you overwrite part of the default config object,
    //       you have to include ALL of it's properties
    {
        // Name of the Assistant (default is 'Leah')
        name: "Emma",
        // Default answer (default)
        response: {
            text: "I don't know what to say :(",
            extra: "",
        },
        // Delay before the Assistant answers, 
        // even if the response is ready. (default)
        delay: 500,
        // Speech options
        speech: {
            enabled: true,  // default
            rate: 1.2,      // default is 1
            volume: 0.8,    // default is 1
            // Index of the SpeechSynthesisVoice object to use
            // from all available voices on the device.
            // NOTE: you can always change it in 'Settings',
            // 0 will always be the device/OS default voice
            voice: 0,  // default
        },
        // Element IDs (default, use anything for custom CSS)
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
        }
    },
    // Array of predefined skill the Assistant is able to use
    [greeterSkill, navigationSkill, ...allOtherSkills]
);

// Initialize for use
assistant.init();

// From this point, the Assistant is ready to process input
```

IMPORTANT: If you overwrite any part of the default config object, you have to include ALL of it's properties. For example, if you were to overwrite an element's ID in the `elements` property, you'll have to include every field in the `elements` object.





## Skills

A **skill** is a single object that contains some *trigger phrases*, a *resolver function* and a unique name.

***These objects will define all behavior used by the Assistant.***

Example:

```javascript
const simonSaysSkill = {
    // Unique name of the skill
    name: "simons says",
    // Triggers are regular expressions to match against user input
    triggers: [/simon says (.*)/],
    // The resolver function runs whenever the input matches one of this skill's triggers
    resolver: (self, match, sentence) => new Promise((resolve) => {
        // Write any logic here ...
        let response = `'${match[1]}'`;
        // This Promise must resolve an object:
        resolve({
            // Required - response text to send back and synthesize
            text: response, 
            // Required - any valid HTML, can include links, images, video, etc 
            // (use an empty string instead of emitting it)
            extra: `<a href="https://github.com/thavixt">Go to Github</a>`, 
            // Optional - only required if you don't get the expected result ('false' in that case)
            success: true, 
        });
    })
}
```

The `resolver` function must have 3 parameters:
* `self` - the Assistant instance,
* `match` - the regex match result object,
* `sentence` - the user input text.

The Assistant will only synthesize (speak) the `text` value of the resolved object. Any string value in the `extra` field will be included after the text response portion of the Assistant's reponse message. This is so you can include any extra content like images and links without the Assistant (trying to) read them out loud.

The project contains some examples to include or expand on for your own use cases.





## License

MIT