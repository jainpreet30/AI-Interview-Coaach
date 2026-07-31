export function getHealth(req, res) {
  res.json({
    status: 'ok',
    message: 'AI Interview Coach backend is healthy.',
    timestamp: new Date().toISOString()
  });
}
