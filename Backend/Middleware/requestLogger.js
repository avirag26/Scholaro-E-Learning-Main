import morgan from 'morgan';
import logger from '../utils/logger.js';


morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '0';
  }
  const ms = (res._startAt[0] - req._startAt[0]) * 1e3 +
    (res._startAt[1] - req._startAt[1]) * 1e-6;
  return ms.toFixed(3);
});


morgan.token('user', (req) => {
  return req.user ? req.user.id : 'anonymous';
});

const developmentFormat = ':method :url :status :response-time ms - :res[content-length]';
const productionFormat = ':remote-addr - :user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms';

const skip = (req) => {
  return req.url === '/health' || req.url === '/';
};


const requestLogger = morgan(
  process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  {
    stream: logger.stream,
    skip
  }
);

export default requestLogger;
