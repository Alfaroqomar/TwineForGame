import http from 'http'
import express from 'express'
import { WebSocketServer } from 'ws'
import * as Y from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import * as map from 'lib0/map'

const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server })

// One Y.Doc per room
const docs = new Map()

const getDoc = (name) => map.setIfUndefined(docs, name, () => {
  const doc = new Y.Doc()
  doc.on('update', (update, origin) => {
    // Broadcast update to all clients in this room except origin
    doc.conns.forEach((_, conn) => {
      if (conn !== origin && conn.readyState === 1) {
        const encoder = encoding.createEncoder()
        encoding.writeVarUint(encoder, 0) // messageSync
        syncProtocol.writeUpdate(encoder, update)
        conn.send(encoding.toUint8Array(encoder))
      }
    })
  })
  doc.conns = new Map()
  return doc
})

const messageSync = 0
const messageAwareness = 1

wss.on('connection', (conn, req) => {
  const roomName = req.url.slice(1).split('?')[0] // e.g. /twine-shared-stories
  const doc = getDoc(roomName)

  doc.conns.set(conn, new Set())

  conn.binaryType = 'arraybuffer'

  // Send current doc state to new client
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, messageSync)
  syncProtocol.writeSyncStep1(encoder, doc)
  conn.send(encoding.toUint8Array(encoder))

  conn.on('message', (message) => {
    const decoder = decoding.createDecoder(new Uint8Array(message))
    const messageType = decoding.readVarUint(decoder)

    switch (messageType) {
      case messageSync: {
        const encoder = encoding.createEncoder()
        encoding.writeVarUint(encoder, messageSync)
        syncProtocol.readSyncMessage(decoder, encoder, doc, conn)
        if (encoding.length(encoder) > 1) {
          conn.send(encoding.toUint8Array(encoder))
        }
        break
      }
      case messageAwareness: {
        // Broadcast awareness to all other clients
        const update = decoding.readVarUint8Array(decoder)
        doc.conns.forEach((_, c) => {
          if (c !== conn && c.readyState === 1) {
            const enc = encoding.createEncoder()
            encoding.writeVarUint(enc, messageAwareness)
            encoding.writeVarUint8Array(enc, update)
            c.send(encoding.toUint8Array(enc))
          }
        })
        break
      }
    }
  })

  conn.on('close', () => {
    doc.conns.delete(conn)
  })
})

app.use(express.json())

app.post('/api/save-story', async (req, res) => {
  res.json({ ok: true })
})

const PORT = process.env.PORT || 4444
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))