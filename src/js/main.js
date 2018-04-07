/* (function () { */
// Configure the Assistant
const assistant = new Assistant(
    // Root div ID (the only required parameter)
    "chat-container",
    // General config object
    // NOTE: If you overwrite part of the default config object,
    //       you have to include ALL of it's properties
    {
        // Name of the Assistant (optional)
        name: "Emma",
        // Element IDs (optional, use them for custom CSS)
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
    },
    // Array of predefined skill the Assistant is able to use
    [...skills]
);

// Initialize for use
assistant.init();

// Debug
console.log("Assistant: ", assistant);

/**
 * TESTS
 */
/* // Static response
assistant.process("hi!").then(result => console.log(result));
// Location - async
assistant.process("where am i?").then(result => console.log(result));
// Default response
assistant.process("123wow").then(result => console.log(result));
// Static URL response - can include location info which is async
assistant.process("navigate to Shot Bar").then(result => console.log(result)); */
/* })(); */