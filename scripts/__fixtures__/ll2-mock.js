// Nep-LL2 voor de missietests: een echte lokale HTTP-server, zodat
// update-missions.js precies dezelfde URL's opvraagt als in productie
// (via LL2_BASE_URL). Kent alleen GET /2.3.0/launches/?id=a,b,… en geeft
// uit de pool de lanceringen met die id's terug — net als LL2 met mode=list.
// Elke request wordt vastgelegd, zodat de tests de URL's kunnen controleren.

const http = require('http')

function startMock(initialPool) {
  const state = { pool: initialPool, requests: [], fail: false }
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost')
    state.requests.push(url)
    if (state.fail) { res.writeHead(503); res.end('{}'); return }
    if (url.pathname !== '/2.3.0/launches/') { res.writeHead(404); res.end('{}'); return }
    const ids = new Set((url.searchParams.get('id') || '').split(',').filter(Boolean))
    const limit = Number(url.searchParams.get('limit') || 10)
    const hits = state.pool.filter(l => ids.has(l.id))
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ count: hits.length, next: hits.length > limit ? 'more' : null, results: hits.slice(0, limit) }))
  })
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => {
    resolve({
      url: `http://127.0.0.1:${server.address().port}`,
      state,
      close: () => new Promise(r => server.close(r)),
    })
  }))
}

module.exports = { startMock }
