# Chargeprice Client

Web client for Chargeprice: www.chargeprice.app

## Setup of Project (native)

1. Install NodeJS (>=10.x)
2. Install Yarn
3. Create `.env` from `.env.sample` template file (and ask for the correct
   values)
4. Check if everything works by starting the server: `yarn start`

### Execution Modes

* Start Server: `yarn start`


## Setup of Project (Docker)

1. Create `.env` from `.env.sample` template file (and ask for the correct
   values)
2. Build the Docker image: `docker build -t chargeprice-client .`
3. Run the Docker container: `docker run -p 9000:9000 chargeprice-client`

## Updating Locales (Translations)

### Setup of Script

1. Install Ruby (e.g. via https://rvm.io/)
2. Install Bundler `gem install bundler`
3. Make sure you are in the right directiory: `cd scripts`
4. Install Dependencies `bundle`
5. Create `scripts/.env.local` from `scripts/.env.sample` template file (and
   ask for the correct values).

### Run the script

`ruby fetch_locales.rb`: Fetches the translations from the spreadsheet and
stores them in the `locales` folder of the project.

Now the changes of the `locales/*.json` files can be commited.

## Contribution

Please contact me (contact@chargeprice.net).
