// Nep-Claude voor scripts/test-missie-verrijking.js: een lokale HTTP-server
// op POST /v1/messages (via ANTHROPIC_BASE_URL). Elke aanroep wordt
// vastgelegd met de missienaam uit de prompt, zodat de test kan tellen wie er
// naar Claude ging. Missienamen in state.fail krijgen een fout terug.

const http = require('http')

function startClaudeMock() {
  const state = { calls: [], prompts: {}, fail: new Set() }
  const server = http.createServer((req, res) => {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      if (req.method !== 'POST' || req.url !== '/v1/messages') { res.writeHead(404); res.end('{}'); return }
      const prompt = JSON.parse(body).messages[0].content
      const name = (prompt.match(/^Missie: (.*)$/m) || [])[1] || '?'
      state.calls.push(name)
      state.prompts[name] = prompt
      res.writeHead(200, { 'Content-Type': 'application/json' })
      if (state.fail.has(name)) {
        res.end(JSON.stringify({ type: 'error', error: { type: 'overloaded_error' } }))
        return
      }
      const text = JSON.stringify({
        objective:   `Verrijkt doel van ${name}`,
        description: `Verrijkte beschrijving van ${name}.`,
        highlight:   `Verrijkt: ${name}`,
        relatedTags: ['verrijkt'],
      })
      res.end(JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text }] }))
    })
  })
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => {
    resolve({
      url: `http://127.0.0.1:${server.address().port}`,
      state,
      close: () => new Promise(r => server.close(r)),
    })
  }))
}

module.exports = { startClaudeMock }
