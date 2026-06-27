import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'

const ROOM = 'twine-shared-stories'
const WS_URL = 'ws://localhost:4444'

export const ydoc = new Y.Doc()

export const provider = new WebsocketProvider(WS_URL, ROOM, ydoc)

provider.on('status', (event: {status: string}) => {
  console.log('[Yjs] WebSocket status:', event.status)
})

provider.on('sync', (isSynced: boolean) => {
  console.log('[Yjs] Synced with server:', isSynced)
})

export const persistence = new IndexeddbPersistence(ROOM, ydoc)

persistence.on('synced', () => {
  console.log('[Yjs] IndexedDB synced')
})

export const sharedActions = ydoc.getArray<string>('actions')

console.log('[Yjs] ydoc initialized, room:', ROOM, 'server:', WS_URL)