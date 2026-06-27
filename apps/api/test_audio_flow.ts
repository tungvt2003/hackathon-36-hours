import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

// Tạo một file dummy audio
const dummyAudioPath = path.join(__dirname, 'dummy.m4a');
fs.writeFileSync(dummyAudioPath, 'dummy audio content');

let currentStep = 0;
const sessionId = 'uuid-test-audio-123';
const lat = 10.7769;
const lng = 106.7009;

// Mock AI Service
const aiServer = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => body += chunk.toString());
  req.on('end', () => {
    // console.log('[Mock AI] Nhận request:', req.headers['content-type']);
    
    // Trả về JSON tùy theo currentStep
    let responseJson: any = {};
    
    if (currentStep === 0) {
      responseJson = {
        session_id: sessionId,
        intent: "food_order",
        step: "search_restaurant",
        user_location: { lat, lng },
        payload: { query: "cơm" }
      };
    } else if (currentStep === 1) {
      responseJson = {
        session_id: sessionId,
        intent: "ride_booking",
        step: "select_destination",
        user_location: { lat, lng },
        payload: { destination: "Sân bay Tân Sơn Nhất" }
      };
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(responseJson));
  });
});

aiServer.listen(5000, async () => {
  console.log('Mock AI Service chạy tại cổng 5000');
  
  try {
    // ---- Test Case 1: Tìm quán ăn (Food) ----
    console.log('\n--- BẮT ĐẦU TEST CASE 1 (TÌM QUÁN CƠM) ---');
    currentStep = 0;
    
    const formData1 = new FormData();
    const blob1 = new Blob([fs.readFileSync(dummyAudioPath)], { type: 'audio/m4a' });
    formData1.append('audio', blob1, 'dummy.m4a');
    formData1.append('session_id', sessionId);
    formData1.append('lat', lat.toString());
    formData1.append('lng', lng.toString());
    
    const res1 = await fetch('http://127.0.0.1:8000/voice-flow/audio', {
      method: 'POST',
      body: formData1,
    });
    
    const data1 = await res1.json();
    console.log('Backend trả về Case 1:');
    console.log(JSON.stringify(data1, null, 2));

    // ---- Test Case 2: Đặt xe (Ride) ----
    console.log('\n--- BẮT ĐẦU TEST CASE 2 (ĐẶT XE SÂN BAY) ---');
    currentStep = 1;
    
    const formData2 = new FormData();
    const blob2 = new Blob([fs.readFileSync(dummyAudioPath)], { type: 'audio/m4a' });
    formData2.append('audio', blob2, 'dummy.m4a');
    formData2.append('session_id', sessionId);
    formData2.append('lat', lat.toString());
    formData2.append('lng', lng.toString());
    
    const res2 = await fetch('http://127.0.0.1:8000/voice-flow/audio', {
      method: 'POST',
      body: formData2,
    });
    
    const data2 = await res2.json();
    console.log('Backend trả về Case 2:');
    console.log(JSON.stringify(data2, null, 2));
    
  } catch (e) {
    console.error('Lỗi trong lúc test:', e);
  } finally {
    aiServer.close();
    fs.unlinkSync(dummyAudioPath);
    console.log('\nTest hoàn tất, đã dọn dẹp!');
    process.exit(0);
  }
});
