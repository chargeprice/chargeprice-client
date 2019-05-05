# Plugchecker (Client)

Provides prices of charging cards for EV charging stations.

See [Plugchecker](https://github.com/hoenic07/plugchecker) for the Web Service.

## Updating Locales (Translations)

### Prepare credentials

Translations are stored in a Google Spreadsheet. To define which sheet should be
accessed and which credentials should be used, a `.env.local` file in the
`scripts` folder needs to be created with the following keys:
```
GOOGLE_ACCOUNT_TYPE=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

### Run the script

1. `cd scripts`
2. Make sure to have Ruby and bundler (`gem install bundler`) installed
3. `bundle`: Loads all dependencies
4. `ruby fetch_locales.rb`: Fetches the translations from the spreadsheet and
   stores them in the `locales` folder of the project.

Now the changes of the `locales/*.json` files can be commited.

## Contribution

Please contact me (niklas@plugchecker.com).

