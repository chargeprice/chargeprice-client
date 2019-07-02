require "google/apis/sheets_v4"
require "googleauth"
require "pry"
require "dotenv/load"
require "json"

Dotenv.load(".env.local")

FALLBACK_LANGUAGE="en"
SKIPPED_COLUMNS=2
BASE_FOLDER="../assets/locales"

def fetch_locales
  response = google_service.get_spreadsheet_values(ENV.fetch("SHEET_ID"), "Locales")

  langs_with_index = available_languages(response) 
  locales = langs_with_index.keys.each_with_object({}) { |lang,memo| memo[lang] = {} }
  response.values.drop(1).each do |row|
    locales.each do |lang,values|
      locale = row[langs_with_index[lang]]
      values[row.first] = (!locale || locale.empty?) ? row[langs_with_index[FALLBACK_LANGUAGE]] : locale
    end
  end
  locales
end

def available_languages(response)
  response.values.first.drop(SKIPPED_COLUMNS).each_with_index.each_with_object({}) do |(v, i), memo|
    memo[v] = i+SKIPPED_COLUMNS
  end
end

def google_service
  service = Google::Apis::SheetsV4::SheetsService.new
  auth = ::Google::Auth::ServiceAccountCredentials
         .make_creds(scope: Google::Apis::SheetsV4::AUTH_SPREADSHEETS_READONLY)
  service.authorization = auth
  service
end

def create_files(locales)
  locales.each do |lang,values|
    File.write("#{BASE_FOLDER}/#{lang}.json",JSON.pretty_generate(values), mode: "w")
  end
end

locales = fetch_locales
create_files(locales)