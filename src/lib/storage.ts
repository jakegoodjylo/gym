/**
 * Ask the browser to keep our IndexedDB data instead of evicting it under
 * storage pressure (iOS in particular clears idle web-app storage). Granted
 * silently for installed PWAs on most browsers; resolves false if unsupported.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}

export async function isStoragePersisted(): Promise<boolean> {
  return (await navigator.storage?.persisted?.()) ?? false
}
