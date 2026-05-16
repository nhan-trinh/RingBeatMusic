import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

async function testUpload() {
  try {
    const formData = new FormData();
    // Tạo một dummy file ảnh
    fs.writeFileSync('dummy.jpg', 'test');
    formData.append('file', fs.createReadStream('dummy.jpg'));
    formData.append('heroText', 'Test from script');

    console.log('Sending request...');
    
    // Đăng nhập Admin để lấy token
    const loginRes = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'admin@ringbeat.com',
      password: 'Password123!',
    });
    const token = loginRes.data.data.accessToken;

    const res = await axios.post('http://localhost:3001/api/v1/admin/hero-config', formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Response:', res.data);
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  } finally {
    if (fs.existsSync('dummy.jpg')) fs.unlinkSync('dummy.jpg');
  }
}

testUpload();
