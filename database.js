const { JsonDB, Config } = require('node-json-db');

const db = new JsonDB(new Config('./data/queue', true, true, '/'));

function init() {
  try { db.getData('/patients'); } catch { db.push('/patients', []); }
  try { db.getData('/rooms'); } catch {
    db.push('/rooms', [
      { id: 'room1', name: '治疗一室', status: 'active' },
      { id: 'room2', name: '治疗二室', status: 'active' },
      { id: 'room3', name: '治疗三室', status: 'active' },
      { id: 'room4', name: '治疗四室', status: 'active' },
    ]);
  }
  try { db.getData('/sequences'); } catch { db.push('/sequences', {}); }
}
init();

const TREATMENT_ITEMS = [
  { id: 'magnetic-heat', name: '磁振热治疗仪', code: 'A', roomId: 'room1' },
  { id: 'rf', name: '射频治疗仪', code: 'B', roomId: 'room1' },
  { id: 'polarized-light', name: '直线偏振光', code: 'C', roomId: 'room1' },
  { id: 'infrared', name: '红外线治疗', code: 'D', roomId: 'room1' },
  { id: 'medium-freq', name: '中频直流电刺激', code: 'E', roomId: 'room2' },
  { id: 'bone-trauma', name: '骨创治疗', code: 'F', roomId: 'room2' },
  { id: 'electrostatic', name: '静电治疗', code: 'G', roomId: 'room2' },
  { id: 'cupping', name: '拔罐', code: 'H', roomId: 'room2' },
  { id: 'ultrasound', name: '超声波治疗', code: 'I', roomId: 'room3' },
  { id: 'shockwave', name: '冲击波治疗', code: 'J', roomId: 'room3' },
  { id: 'sports-medicine', name: '运动医学指导', code: 'K', roomId: 'room3' },
  { id: 'traction', name: '牵引', code: 'L', roomId: 'room4' },
];

function generateId() {
  return Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
}

function getPatients() {
  try { return db.getData('/patients'); } catch { return []; }
}

function getNextSequence(itemId) {
  try { return (db.getData('/sequences/' + itemId) || 0) + 1; } catch { return 1; }
}

function createPatient(name, phone, itemId, bodyPart) {
  const item = TREATMENT_ITEMS.find(i => i.id === itemId);
  if (!item) return null;
  const rooms = getRooms();
  const room = rooms.find(r => r.id === item.roomId);
  if (!room || room.status === 'paused') return null;

  const sequence = getNextSequence(itemId);
  const patient = {
    id: generateId(),
    name: name.trim(),
    phone: phone ? phone.trim() : undefined,
    treatmentItemId: itemId,
    treatmentItemName: item.name,
    treatmentCode: item.code,
    bodyPart,
    roomId: item.roomId,
    roomName: room.name,
    number: `${item.code}${String(sequence).padStart(3, '0')}`,
    sequence,
    status: 'waiting',
    checkInTime: Date.now(),
    missedCount: 0,
  };
  const patients = getPatients();
  patients.push(patient);
  db.push('/patients', patients);
  db.push('/sequences/' + itemId, sequence);
  return patient;
}

function updatePatientStatus(patientId, status, extra = {}) {
  const patients = getPatients();
  const idx = patients.findIndex(p => p.id === patientId);
  if (idx === -1) return null;

  if (status === 'calling' || status === 'in_progress') {
    const itemId = patients[idx].treatmentItemId;
    patients.forEach(p => {
      if (p.treatmentItemId === itemId && (p.status === 'calling' || p.status === 'in_progress') && p.id !== patientId) {
        p.status = 'completed';
        p.completedTime = Date.now();
      }
    });
  }

  patients[idx].status = status;
  if (status === 'calling') patients[idx].calledTime = Date.now();
  if (status === 'completed') patients[idx].completedTime = Date.now();
  if (status === 'missed') {
    patients[idx].missedCount = (patients[idx].missedCount || 0) + 1;
    const itemId = patients[idx].treatmentItemId;
    const sameItem = patients.filter(p => p.treatmentItemId === itemId && (p.status === 'waiting' || p.status === 'missed' || p.status === 'busy') && p.id !== patientId);
    patients[idx].sequence = sameItem.length > 0 ? Math.max(...sameItem.map(p => p.sequence)) + 1 : patients[idx].sequence + 1;
  }
  if (status === 'busy') {
    patients[idx].busyReason = extra.reason || '暂离';
    patients[idx].missedCount = (patients[idx].missedCount || 0) + 1;
    const itemId = patients[idx].treatmentItemId;
    const sameItem = patients.filter(p => p.treatmentItemId === itemId && (p.status === 'waiting' || p.status === 'missed' || p.status === 'busy') && p.id !== patientId);
    patients[idx].sequence = sameItem.length > 0 ? Math.max(...sameItem.map(p => p.sequence)) + 1 : patients[idx].sequence + 1;
  }

  db.push('/patients', patients);
  return patients[idx];
}

function clearAllPatients() {
  db.push('/patients', []);
  db.push('/sequences', {});
}

function getRooms() {
  try { return db.getData('/rooms'); } catch { return []; }
}

function toggleRoomStatus(roomId) {
  const rooms = getRooms();
  const room = rooms.find(r => r.id === roomId);
  if (!room) return null;
  room.status = room.status === 'active' ? 'paused' : 'active';
  db.push('/rooms', rooms);
  return room;
}

function getTreatmentItems() {
  return TREATMENT_ITEMS;
}

module.exports = {
  getPatients, createPatient, updatePatientStatus, clearAllPatients,
  getRooms, toggleRoomStatus, getTreatmentItems,
};
