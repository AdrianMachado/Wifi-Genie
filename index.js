'use strict';
var dynasty = require('dynasty')({});
var dataTable = function() {
    return dynasty.table('WifiGenieData');
};
// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `Wifi Genie - ${title}`,
            content: `Wifi Genie - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes: sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Welcome to Wifi Genie. ' +
        'Ask me for the network name or password, or set your own!';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Please set network name and password by saying ' +
        'set network name or set password, dictating the value character by character.';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getHelpResponse(callback) {
    const sessionAttributes = {};
    const cardTitle = 'Help';
    const speechOutput = 'Welcome to Wifi Genie. ' +
        'In order to use the genie, you must set the wifi network name and password. ' + 
        'To do this, say Set the network name, and then repeat the network name, character by character. ' + 
        'The same goes for the wifi password. Once you set the password, you can access it by saying What is the wifi password?';
    const repromptText = 'Please set network name and password by saying ' +
        'set network name or set password';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(sessionEndedRequest, session, callback) {
    const cardTitle = 'Thanks for using Wifi Genie';
    const speechOutput = 'Thank you for using the skill. Have a nice day!';
    const sessionAttributes = session.attributes;
    let sessionPackage;
    if(sessionAttributes.networkName) {
        sessionPackage = {networkName: sessionAttributes.networkName};
    }
    if(sessionAttributes.password) {
        if(sessionPackage){
            sessionPackage = Object.assign(sessionPackage ,{password: sessionAttributes.password});
        } else {
            sessionPackage = {password: sessionAttributes.password};
        }
        
    }
    if (sessionPackage) {
        dataTable().insert({
            userid: session.user.userId,
            Data: JSON.stringify(sessionPackage)
        });
        console.log('Insertion Complete');
    }
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    
    console.log(sessionPackage);

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function createNetworkNameAttributes(networkName, password) {
    return {
        networkName,
        password
    };
}

function createPasswordAttributes(password, networkName) {
    return {
        password,
        networkName
    };
}

function loadUserData(session) {
    console.log('Session id: ');
    console.log(session.user.userId);
    return dataTable().find(session.user.userId).then(
        function(result) {
            var data = {};
            if(result) {
                data = JSON.parse(result['Data']);
            }
            console.log('Result');
            console.log(result);
            return data;
        }
    )
    .catch(function(error) {
        console.log(error);
    });
}

function setPasswordInSession(intent, session, callback) {
    const cardTitle = intent.name;
    const characters = [
        intent.slots.one, intent.slots.two, intent.slots.three,
        intent.slots.four, intent.slots.five, intent.slots.six,
        intent.slots.seven,intent.slots.eight, intent.slots.nine, 
        intent.slots.ten, intent.slots.eleven, intent.slots.twelve, 
        intent.slots.thirteen, intent.slots.fourteen, intent.slots.fifteen, 
        intent.slots.sixteen
    ];
    let repromptText = '';
    let sessionAttributes = session.attributes;
    const shouldEndSession = false;
    let speechOutput = '';
    const password = characters.filter((character) => character.value).map((character) => character.value);
    
    if (password.length > 0) {
        const networkName = sessionAttributes ?  sessionAttributes.networkName : null;
        sessionAttributes = createPasswordAttributes(password, networkName);
        speechOutput = `I now know your wifi password is ${password.join(' ')}. You can ask me ` +
            "for the password by saying, what's the wifi password?";
        repromptText = "You can ask me for the password by saying, what's the wifi password?";
    } else {
        speechOutput = "I'm not sure what your wifi password is. Please try again.";
        repromptText = "I'm not sure what your wifi password is. You can tell me your " +
            'password by saying, the wifi password is and then repeat the password, one character at a time';
    }
    
    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function setNetworkNameInSession(intent, session, callback) {
    const cardTitle = intent.name;
    const characters = [
        intent.slots.one, intent.slots.two, intent.slots.three,
        intent.slots.four, intent.slots.five, intent.slots.six, 
        intent.slots.seven, intent.slots.eight, intent.slots.nine, 
        intent.slots.ten, intent.slots.eleven, intent.slots.twelve, 
        intent.slots.thirteen, intent.slots.fourteen, intent.slots.fifteen, 
        intent.slots.sixteen
    ];
    let repromptText = '';
    let sessionAttributes = session.attributes;
    const shouldEndSession = false;
    let speechOutput = '';
    const networkName = characters.filter((character) => 
        character.value).map((character) => character.value);

    if (networkName.length > 0) {
        const password = sessionAttributes ? sessionAttributes.password : null;
        sessionAttributes = createNetworkNameAttributes(networkName, password);
        speechOutput = `I now know your network name is ${networkName.join(' ')}. You can ask me ` +
            "for the network name by saying, what's the network name?";
        repromptText = "You can ask me for the network name by saying, what's the network name?";
        
    } else {
        speechOutput = "I'm not sure what your network name is. Please try again.";
        repromptText = "I'm not sure what your network name is. You can tell me your " +
            'network name by saying, the network name is and then repeat the name, one character at a time';
    }

    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getPasswordFromSession(intent, session, callback) {
    let characters;
    const repromptText = "I didn't quite catch that! Please repeat the wifi password, starting with the phrase" +
        "The password is...";
    let sessionAttributes = session.attributes;
    let shouldEndSession = false;
    let speechOutput = '';
    if (!sessionAttributes.password) {
        loadUserData(session).then(function(data){
            console.log(data);
            if(data) {
                console.log('I have user data');
                sessionAttributes = createPasswordAttributes(data.password, data.networkName);
            }
            if (sessionAttributes && sessionAttributes.password) {
                characters = sessionAttributes.password;
                speechOutput = `Your wifi password is ${characters.join(' ')}.`;
                shouldEndSession = true;
            } 
            else {
                speechOutput = "I'm not sure what your password is, you can say, the wifi password " +
                    ' is, and then repeat the password, one character at a time';
            }
            callback(sessionAttributes,
                buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
        });        
    } else {
        if (sessionAttributes && sessionAttributes.password) {
            characters = sessionAttributes.password;
            speechOutput = `Your wifi password is ${characters.join(' ')}.`;
            shouldEndSession = true;
        } 
        else {
            speechOutput = "I'm not sure what your password is, you can say, the wifi password " +
                ' is, and then repeat the password, one character at a time';
        }
        callback(sessionAttributes,
         buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
    }
    
    
    
}

function getNetworkNameFromSession(intent, session, callback) {
    let characters;
    const repromptText = "I didn't quite catch that! Please repeat the network name, starting with the phrase" +
        "The network name is...";
    let sessionAttributes = session.attributes;
    let shouldEndSession = false;
    let speechOutput = '';
    if (!sessionAttributes.networkName) {
        loadUserData(session).then(function(data){
            console.log(data);
            if (data) {
                console.log('I have user data');
                sessionAttributes = createNetworkNameAttributes(data.networkName, data.password);
            }
            if (sessionAttributes && sessionAttributes.networkName) {
                characters = sessionAttributes.networkName;
                speechOutput = `Your network name is ${characters.join(' ')}.`;
                shouldEndSession = true;
            } else {
                speechOutput = "I'm not sure what your network name is, you can say, the network name " +
                    ' is, and then repeat the name, one character at a time';
            }
            callback(sessionAttributes,
                buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
        });
    } else {
        if (sessionAttributes && sessionAttributes.networkName) {
            characters = sessionAttributes.networkName;
            speechOutput = `Your network name is ${characters.join(' ')}.`;
            shouldEndSession = true;
        } else {
            speechOutput = "I'm not sure what your network name is, you can say, the network name " +
                ' is, and then repeat the name, one character at a time';
        }
        callback(sessionAttributes,
         buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
    }
}


// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);
    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to the skill's intent handlers
    if (intentName === 'SetNetworkName') {
        setNetworkNameInSession(intent, session, callback);
    } else if (intentName === 'SetPassword') {
        setPasswordInSession(intent, session, callback);
    } else if (intentName === 'GetNetworkName') {
        getNetworkNameFromSession(intent, session, callback);
    } else if (intentName === 'GetPassword') {
        getPasswordFromSession(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getHelpResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(intentRequest, session, callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    const sessionAttributes = session.attributes;
    let sessionPackage;
    if(sessionAttributes.networkName) {
        sessionPackage = {networkName: sessionAttributes.networkName};
    }
    if(sessionAttributes.password) {
        if(sessionPackage){
            sessionPackage = Object.assign(sessionPackage ,{password: sessionAttributes.password});
        } else {
            sessionPackage = {password: sessionAttributes.password};
        }
        
    }
    if (sessionPackage) {
        dataTable().insert({
            userid: session.user.userId,
            Data: JSON.stringify(sessionPackage)
        });
        console.log('Insertion Complete');
    }
    
    
    console.log(sessionPackage);
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
}


// --------------- Main handler -----------------------

exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
