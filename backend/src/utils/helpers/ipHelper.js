const geoip = require('geoip-lite');
const os = require('os');

/**
 * Get client IP from request
 * @param {Object} req - Express request object
 * @returns {string} Client IP
 */
const getClientIP = (req) => {
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] ||
             req.connection.remoteAddress || 
             req.socket.remoteAddress || 
             req.ip || 
             null;
  
  if (ip) {
    // Handle IPv6 localhost
    if (ip === '::1') return '127.0.0.1';
    // Handle x-forwarded-for containing multiple IPs
    if (ip.includes(',')) return ip.split(',')[0].trim();
  }
  
  return ip;
};

/**
 * Get location info from IP
 * @param {string} ip - IP address
 * @returns {Object|null} Location info or null
 */
const getLocationInfo = (ip) => {
  try {
    // Skip for localhost/private IPs
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.0.') || ip.startsWith('172.16.')) {
      return null;
    }
    
    const geo = geoip.lookup(ip);
    if (!geo) return null;
    
    return {
      country: geo.country || null,
      countryCode: geo.country || null,
      region: geo.region || null,
      city: geo.city || null,
      latitude: geo.ll ? geo.ll[0] : null,
      longitude: geo.ll ? geo.ll[1] : null,
      timezone: geo.timezone || null
    };
  } catch {
    return null;
  }
};

/**
 * Get ISP info from IP (using external API)
 * @param {string} ip - IP address
 * @returns {Promise<Object|null>} ISP info or null
 */
const getISPInfo = async (ip) => {
  try {
    // Skip for localhost
    if (ip === '127.0.0.1' || ip === '::1') return null;
    
    // You can integrate with IP info APIs like:
    // - ip-api.com (free)
    // - ipinfo.io (free tier)
    // - geojs.io (free)
    
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,isp,org,as,asname`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        isp: data.isp || null,
        organization: data.org || null,
        as: data.as || null,
        asName: data.asname || null
      };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Check if IP is in range
 * @param {string} ip - IP address
 * @param {string} range - CIDR range
 * @returns {boolean} IP in range
 */
const isIPInRange = (ip, range) => {
  try {
    const [base, mask] = range.split('/');
    const ipParts = ip.split('.').map(Number);
    const baseParts = base.split('.').map(Number);
    const maskInt = parseInt(mask);
    
    if (ipParts.length !== 4 || baseParts.length !== 4) return false;
    
    const ipInt = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
    const baseInt = (baseParts[0] << 24) + (baseParts[1] << 16) + (baseParts[2] << 8) + baseParts[3];
    const maskBit = 32 - maskInt;
    
    return (ipInt >>> maskBit) === (baseInt >>> maskBit);
  } catch {
    return false;
  }
};

/**
 * Get IP type (public/private/localhost)
 * @param {string} ip - IP address
 * @returns {string} IP type
 */
const getIPType = (ip) => {
  if (ip === '127.0.0.1' || ip === '::1') return 'localhost';
  
  const privateRanges = [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16'
  ];
  
  for (const range of privateRanges) {
    if (isIPInRange(ip, range)) return 'private';
  }
  
  return 'public';
};

/**
 * Get IP version (IPv4/IPv6)
 * @param {string} ip - IP address
 * @returns {string} IP version
 */
const getIPVersion = (ip) => {
  if (ip.includes(':')) return 'IPv6';
  if (ip.includes('.')) return 'IPv4';
  return 'Unknown';
};

/**
 * Get client info from request
 * @param {Object} req - Express request object
 * @returns {Object} Client info
 */
const getClientInfo = (req) => {
  const ip = getClientIP(req);
  const location = getLocationInfo(ip);
  const type = getIPType(ip);
  const version = getIPVersion(ip);
  
  return {
    ip,
    type,
    version,
    location,
    userAgent: req.headers['user-agent'] || null,
    referrer: req.headers['referer'] || req.headers['referrer'] || null,
    host: req.headers['host'] || null,
    origin: req.headers['origin'] || null,
    timestamp: new Date()
  };
};

/**
 * Get local IP addresses
 * @returns {Array<string>} Local IP addresses
 */
const getLocalIPs = () => {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  Object.values(interfaces).forEach(net => {
    net.forEach(addr => {
      if (addr.family === 'IPv4' && !addr.internal) {
        ips.push(addr.address);
      }
    });
  });
  
  return ips;
};

/**
 * Anonymize IP address (for privacy)
 * @param {string} ip - IP address
 * @returns {string} Anonymized IP
 */
const anonymizeIP = (ip) => {
  if (!ip) return null;
  
  if (ip.includes(':')) {
    // IPv6 - keep first 4 segments
    const parts = ip.split(':');
    return `${parts.slice(0, 4).join(':')}:0000:0000:0000:0000`;
  }
  
  // IPv4 - keep first 2 octets
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.0.0`;
  }
  
  return ip;
};

/**
 * Get IP reputation (using external API)
 * @param {string} ip - IP address
 * @returns {Promise<Object>} IP reputation
 */
const getIPReputation = async (ip) => {
  try {
    // Skip for localhost
    if (ip === '127.0.0.1' || ip === '::1') {
      return { score: 100, isSpam: false };
    }
    
    // You can integrate with IP reputation services like:
    // - AbuseIPDB (https://www.abuseipdb.com/)
    // - IPQualityScore (https://www.ipqualityscore.com/)
    
    // Placeholder response
    return {
      score: 100, // 0-100, higher is better
      isSpam: false,
      isBot: false,
      isProxy: false,
      riskLevel: 'low'
    };
  } catch {
    return {
      score: 50,
      isSpam: false,
      isBot: false,
      isProxy: false,
      riskLevel: 'unknown'
    };
  }
};

module.exports = {
  getClientIP,
  getLocationInfo,
  getISPInfo,
  isIPInRange,
  getIPType,
  getIPVersion,
  getClientInfo,
  getLocalIPs,
  anonymizeIP,
  getIPReputation
};