
fetch('http://localhost:3000/plantnet/v2/identify/all?api-key=test')
  .then(r => r.status)
  .then(s => console.log('Status:', s))
  .catch(e => console.error('Error:', e));
