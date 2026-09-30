require "google/apis/sheets_v4"
require "googleauth"
require "pry"
require "dotenv/load"
require "json"

Dotenv.load(".env.local")

# Syncs local changes in assets/locales/*.json back to the "Locales" sheet.
# Only keys that changed compared to a git ref (default: master) are pushed,
# so translations updated in the sheet in the meantime aren't overwritten.
#
# Usage: ruby push_locales.rb [--base REF] [--apply]
# Prints the changes by default, pass --apply to actually write them.

FALLBACK_LANGUAGE="en"
SKIPPED_COLUMNS=2
BASE_FOLDER="../assets/locales"
SHEET_NAME="Locales"
APPLY=ARGV.include?("--apply")
BASE_REF=ARGV.include?("--base") ? ARGV[ARGV.index("--base") + 1] : "master"

def push_locales
  rows = google_service.get_spreadsheet_values(ENV.fetch("SHEET_ID"), SHEET_NAME).values
  langs_with_index = available_languages(rows)
  local = read_local_locales(langs_with_index.keys)
  base = read_base_locales(langs_with_index.keys)
  fallback_index = langs_with_index[FALLBACK_LANGUAGE]

  row_by_key = rows.each_with_index.drop(1).each_with_object({}) { |(row, i), memo| memo[row.first] = [row, i + 1] }
  updates = []

  row_by_key.each do |key, (row, row_number)|
    langs_with_index.each do |lang, index|
      next unless local[lang].key?(key)

      local_value = local[lang][key]
      next if local_value == base[lang][key]
      sheet_value = row[index].to_s
      next if normalize(sheet_value) == local_value
      # untranslated (fallback language) values, e.g. filled in by fetch_locales, aren't written back
      if lang != FALLBACK_LANGUAGE && local_value == local[FALLBACK_LANGUAGE][key]
        puts "Skipped untranslated: #{lang} #{key}" unless sheet_value.empty? || local_value == normalize(row[fallback_index].to_s)
        next
      end

      updates << cell_update(lang, key, index, row_number, sheet_value, local_value)
    end
  end

  next_row = rows.length + 1
  new_keys = local[FALLBACK_LANGUAGE].keys - row_by_key.keys
  new_keys.each do |key|
    updates << cell_update(:key, key, 0, next_row, "", key)
    langs_with_index.each do |lang, index|
      local_value = local[lang][key]
      next if local_value.nil? || (lang != FALLBACK_LANGUAGE && local_value == local[FALLBACK_LANGUAGE][key])

      updates << cell_update(lang, key, index, next_row, "", local_value)
    end
    next_row += 1
  end

  removed_keys = row_by_key.keys - local[FALLBACK_LANGUAGE].keys
  removed_keys.each { |key| puts "Key only in sheet (not touched): #{key}" }

  updates
end

def cell_update(lang, key, column_index, row_number, old_value, new_value)
  {
    lang: lang,
    key: key,
    range: "#{SHEET_NAME}!#{column_letter(column_index)}#{row_number}",
    old: old_value,
    new: new_value.gsub("<br>", "\n")
  }
end

def normalize(value)
  value.gsub("\n", "<br>")
end

def column_letter(index)
  letters = ""
  index += 1
  while index > 0
    index, remainder = (index - 1).divmod(26)
    letters.prepend((65 + remainder).chr)
  end
  letters
end

def read_local_locales(langs)
  langs.each_with_object({}) do |lang, memo|
    path = "#{BASE_FOLDER}/#{lang}.json"
    memo[lang] = File.exist?(path) ? JSON.parse(File.read(path)) : {}
  end
end

def read_base_locales(langs)
  langs.each_with_object({}) do |lang, memo|
    content = `git show #{BASE_REF}:assets/locales/#{lang}.json 2>/dev/null`
    memo[lang] = $?.success? ? JSON.parse(content) : {}
  end
end

def available_languages(rows)
  rows.first.drop(SKIPPED_COLUMNS).each_with_index.each_with_object({}) do |(v, i), memo|
    memo[v] = i+SKIPPED_COLUMNS
  end
end

def google_service
  @google_service ||= begin
    service = Google::Apis::SheetsV4::SheetsService.new
    auth = ::Google::Auth::ServiceAccountCredentials
           .make_creds(scope: Google::Apis::SheetsV4::AUTH_SPREADSHEETS)
    service.authorization = auth
    service
  end
end

def write_updates(updates)
  data = updates.map do |u|
    Google::Apis::SheetsV4::ValueRange.new(range: u[:range], values: [[u[:new]]])
  end
  request = Google::Apis::SheetsV4::BatchUpdateValuesRequest.new(value_input_option: "RAW", data: data)
  google_service.batch_update_values(ENV.fetch("SHEET_ID"), request)
end

updates = push_locales

if updates.empty?
  puts "Sheet is up to date."
  exit
end

updates.each do |u|
  puts "#{u[:range]} [#{u[:lang]}] #{u[:key]}: #{u[:old].inspect} -> #{u[:new].inspect}"
end

if APPLY
  write_updates(updates)
  puts "Wrote #{updates.length} cells."
else
  puts "\n#{updates.length} cells would be changed. Run with --apply to write them."
end
