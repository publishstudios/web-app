// ==========================================================================
// FILE: app/projectStorage.js
// ==========================================================================

/* --------------------------------------------------------------------------
   SECTION 1.0: DATABASE CONFIGURATION & CONSTANTS
   -------------------------------------------------------------------------- */
const DB_NAME = 'PublishStudioDB';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_REVIEWS = 'reviews';

/* --------------------------------------------------------------------------
   SECTION 2.0: DATABASE INITIALIZATION PROMISE
   -------------------------------------------------------------------------- */
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Browser only'));
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_REVIEWS)) {
        db.createObjectStore(STORE_REVIEWS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/* --------------------------------------------------------------------------
   SECTION 3.0: PROJECT OPERATIONS (SAVE, GET ALL, DELETE)
   -------------------------------------------------------------------------- */
export async function saveProjectToStorage(project) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    store.put({ ...project, updatedAt: Date.now() });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllProjectsFromStorage() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const store = tx.objectStore(STORE_PROJECTS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteProjectFromStorage(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    store.delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/* --------------------------------------------------------------------------
   SECTION 4.0: REVIEW & RATING OPERATIONS
   -------------------------------------------------------------------------- */
export async function recordReviewToStorage(review) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_REVIEWS, 'readwrite');
    const store = tx.objectStore(STORE_REVIEWS);
    store.put(review);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllReviewsFromStorage() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_REVIEWS, 'readonly');
    const store = tx.objectStore(STORE_REVIEWS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}
