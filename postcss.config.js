// Bewust leeg. Zonder dit bestand gebruikt Next zijn eigen PostCSS-standaard
// (autoprefixer + postcss-preset-env), en die verandert plate.css en de
// Leaflet-CSS (prefixes erbij en eraf). Met een lege lijst gaat de CSS
// ongewijzigd door, zoals toen Tailwind hier nog de enige plugin was.
module.exports = {
  plugins: {},
}
