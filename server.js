const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const db = require('./database');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// REST API
app.get('/api/data', (req, res) => {
  res.json({
    patients: db.getPatients(),
    rooms: db.getRooms(),
    treatmentItems: db.getTreatmentItems(),
  });
});

app.post('/api/patients', (req, res) => {
  const { name, phone, itemId, bodyPart } = req.body;
  if (!name || !itemId || !bodyPart) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const patient = db.createPatient(name, phone, itemId, bodyPart);
  if (!patient) {
    return res.status(400).json({ error: 'Check-in failed' });
  }
  broadcast({ type: 'DATA_UPDATE', patients: db.getPatients() });
  res.json(patient);
});

app.put('/api/patients/:id/call', (req, res) => {
  const patient = db.updatePatientStatus(req.params.id, 'calling');
  if (!patient) return res.status(404).json({ error: 'Not found' });
  broadcast({ type: 'CALL_PATIENT', patient, patients: db.getPatients() });
  res.json(patient);
});

app.put('/api/patients/:id/in-progress', (req, res) => {
  const patient = db.updatePatientStatus(req.params.id, 'in_progress');
  if (!patient) return res.status(404).json({ error: 'Not found' });
  broadcast({ type: 'DATA_UPDATE', patients: db.getPatients() });
  res.json(patient);
});

app.put('/api/patients/:id/complete', (req, res) => {
  const patient = db.updatePatientStatus(req.params.id, 'completed');
  if (!patient) return res.status(404).json({ error: 'Not found' });
  broadcast({ type: 'DATA_UPDATE', patients: db.getPatients() });
  res.json(patient);
});

app.put('/api/patients/:id/miss', (req, res) => {
  const patient = db.updatePatientStatus(req.params.id, 'missed');
  if (!patient) return res.status(404).json({ error: 'Not found' });
  broadcast({ type: 'DATA_UPDATE', patients: db.getPatients() });
  res.json(patient);
});

app.put('/api/patients/:id/busy', (req, res) => {
  const { reason } = req.body;
  const patient = db.updatePatientStatus(req.params.id, 'busy', { reason });
  if (!patient) return res.status(404).json({ error: 'Not found' });
  broadcast({ type: 'DATA_UPDATE', patients: db.getPatients() });
  res.json(patient);
});

app.put('/api/rooms/:id/toggle', (req, res) => {
  const room = db.toggleRoomStatus(req.params.id);
  if (!room) return res.status(404).json({ error: 'Not found' });
  broadcast({ type: 'DATA_UPDATE', rooms: db.getRooms() });
  res.json(room);
});

app.delete('/api/patients', (req, res) => {
  db.clearAllPatients();
  broadcast({ type: 'CLEAR_ALL' });
  res.json({ success: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    type: 'DATA_UPDATE',
    patients: db.getPatients(),
    rooms: db.getRooms(),
  }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
