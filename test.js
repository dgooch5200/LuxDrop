// at top of file
import fetch from 'node-fetch';    // or: const fetch = require('node-fetch');

const apiUrl = 'http://10.0.0.201/setip';
const postData = {
    ip:'192.168.2.123'
};

fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData)
})
    .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    })
    .then(data => console.log('Success:', data))
    .catch(err  => console.error('Error:', err));
