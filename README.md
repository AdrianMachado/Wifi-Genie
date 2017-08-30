# Wifi-Genie
This is an Amazon Alexa skill used to recognize and store a user's wifi network name and password.

# Installation Instructions
`index` contains the raw AWS lambda function to handle intents, use the YAML file for importing

The `schema` is the schema specified on your Alexa skill, along with the custom slot type `LIST_OF_CHARACTERS`

For the best experience, train your NLP engine with the sample utterances provided

You will need a DynamoDB table called `WifiGenieData` in order to store the passwords
