import { sharedActions, ydoc } from './ydoc'
import { StoriesAction } from '../store/stories/stories.types'

const IGNORED_ACTIONS = new Set(['init', 'repair'])

let isSyncing = false
let localDispatch: ((action: StoriesAction) => void) | null = null

export function registerDispatch(dispatch: (action: StoriesAction) => void) {
  console.log('[Sync] registerDispatch called')
  localDispatch = dispatch
}

export function broadcastAction(action: StoriesAction) {
  if (IGNORED_ACTIONS.has(action.type)) {
    console.log('[Sync] Ignoring action:', action.type)
    return
  }

  if (isSyncing) {
    console.log('[Sync] Skipping broadcast, currently syncing')
    return
  }

  console.log('[Sync] Broadcasting action:', action.type)
  ydoc.transact(() => {
    sharedActions.push([JSON.stringify(action)])
  })
  console.log('[Sync] sharedActions length now:', sharedActions.length)
}

export function initSync() {
  console.log('[Sync] initSync called, current sharedActions length:', sharedActions.length)

  sharedActions.observe(event => {
    console.log('[Sync] sharedActions changed, delta:', JSON.stringify(event.changes.delta))

    if (!localDispatch) {
      console.warn('[Sync] No localDispatch registered, dropping update')
      return
    }

    event.changes.delta.forEach(delta => {
      if (!delta.insert) return

      isSyncing = true
      ;(delta.insert as string[]).forEach(raw => {
        try {
          const action = JSON.parse(raw) as StoriesAction
          console.log('[Sync] Applying remote action:', action.type)
          localDispatch!(action)
        } catch (e) {
          console.error('[Sync] Failed to apply remote action:', e)
        }
      })
      isSyncing = false
    })
  })

  console.log('[Sync] Observer registered on sharedActions')
}