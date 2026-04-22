const { db } = require('../config/firebase');

const sanitizeFirebaseValue = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeFirebaseValue(item)).filter((item) => item !== undefined);
  }

  if (typeof value === 'object') {
    return Object.entries(value).reduce((accumulator, [key, entryValue]) => {
      const sanitizedValue = sanitizeFirebaseValue(entryValue);
      if (sanitizedValue !== undefined) {
        accumulator[key] = sanitizedValue;
      }
      return accumulator;
    }, {});
  }

  return value;
};

const getCollection = async (path) => {
  const snapshot = await db.ref(path).once('value');
  const data = snapshot.val() || {};
  return Object.values(data);
};

const getById = async (path, id) => {
  const snapshot = await db.ref(`${path}/${id}`).once('value');
  return snapshot.val();
};

const createRecord = async (path, payload) => {
  const ref = db.ref(path).push();
  const record = sanitizeFirebaseValue({
    id: ref.key,
    _id: ref.key,
    ...payload,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  await ref.set(record);
  return record;
};

const updateRecord = async (path, id, payload) => {
  const recordRef = db.ref(`${path}/${id}`);
  const snapshot = await recordRef.once('value');
  if (!snapshot.exists()) return null;

  const updated = sanitizeFirebaseValue({
    ...snapshot.val(),
    ...payload,
    updatedAt: Date.now()
  });

  await recordRef.update(updated);
  return updated;
};

const removeRecord = async (path, id) => {
  const recordRef = db.ref(`${path}/${id}`);
  const snapshot = await recordRef.once('value');
  if (!snapshot.exists()) return null;
  await recordRef.remove();
  return snapshot.val();
};

module.exports = {
  db,
  getCollection,
  getById,
  createRecord,
  updateRecord,
  removeRecord
};
