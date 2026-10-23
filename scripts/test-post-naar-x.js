// Tests voor scripts/post-naar-x.js: OAuth-handtekening en posttekst.
const assert = require('assert')
const { oauthHeader, postTekst } = require('./post-naar-x')

// Voorbeeld uit X' eigen documentatie ("Creating a signature").
const header = oauthHeader({
  method: 'POST',
  url: 'https://api.twitter.com/1.1/statuses/update.json',
  keys: {
    apiKey: 'xvz1evFS4wEEPTGEFPHBog',
    apiSecret: 'kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw',
    accessToken: '370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb',
    accessSecret: 'LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE',
  },
  extra: { include_entities: 'true', status: 'Hello Ladies + Gentlemen, a signed OAuth request!' },
  nonce: 'kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg',
  timestamp: 1318622958,
})
assert.ok(header.includes('oauth_signature="hCtSmYh%2BiHYCEqBWrE7C7hYmtUk%3D"'), header)

const url = 'https://nightgazer.space/nieuws/een-heel-lang-artikel-over-zwarte-gaten/'
const kort = postTekst({ title: 'Stofgolf rolt over Texas', excerpt: 'Een koufront wierp een muur van stof op.', url })
assert.strictEqual(kort, `Stofgolf rolt over Texas\n\nEen koufront wierp een muur van stof op.\n\n${url}`)

const lang = postTekst({ title: 'Titel', excerpt: 'woord '.repeat(100), url })
const zonderLink = lang.replace(url, '')
assert.ok([...zonderLink].length + 23 <= 280, `te lang: ${[...zonderLink].length + 23}`)
assert.ok(lang.includes('…\n\n'), 'samenvatting ingekort met …')

const bio = postTekst({ title: 'Titel', excerpt: 'woord '.repeat(100), url }, { metLink: false })
assert.ok(!bio.includes('http'), 'zonder link geen URL')
assert.ok(bio.endsWith('Lees verder via de link in onze bio.'))
assert.ok([...bio].length <= 280, `te lang: ${[...bio].length}`)

console.log('post-naar-x: alle tests geslaagd')
