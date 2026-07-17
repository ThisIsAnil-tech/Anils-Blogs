const geoip = require('geoip-lite');
const os = require('os');
const logger = require('../logger');

// Cache for geolocation lookups to reduce repeated calls
const geoCache = new Map();
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get client IP from request
 * @param {Object} req - Express request object
 * @returns {string} Client IP
 */
const getClientIP = (req) => {
  try {
    // Check various headers and sources
    const ip = req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] ||
               req.headers['cf-connecting-ip'] || // Cloudflare
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress || 
               req.ip || 
               null;
    
    if (ip) {
      // Handle IPv6 localhost
      if (ip === '::1') return '127.0.0.1';
      // Handle x-forwarded-for containing multiple IPs
      if (ip.includes(',')) {
        const ips = ip.split(',').map(i => i.trim());
        // Return first non-private IP if possible
        for (const addr of ips) {
          if (!isPrivateIP(addr)) {
            return addr;
          }
        }
        return ips[0];
      }
      return ip;
    }
    
    return '0.0.0.0';
  } catch (error) {
    logger.error(`IP extraction error: ${error.message}`);
    return '0.0.0.0';
  }
};

/**
 * Check if IP is private
 * @param {string} ip - IP address
 * @returns {boolean} Is private IP
 */
const isPrivateIP = (ip) => {
  if (!ip) return true;
  
  // IPv6 localhost
  if (ip === '::1' || ip === '::' || ip === '0:0:0:0:0:0:0:1') return true;
  
  // IPv4 private ranges
  const parts = ip.split('.');
  if (parts.length === 4) {
    const first = parseInt(parts[0]);
    const second = parseInt(parts[1]);
    
    // 10.0.0.0/8
    if (first === 10) return true;
    // 172.16.0.0/12
    if (first === 172 && second >= 16 && second <= 31) return true;
    // 192.168.0.0/16
    if (first === 192 && second === 168) return true;
    // 127.0.0.0/8 (localhost)
    if (first === 127) return true;
  }
  
  return false;
};

/**
 * Get location info from IP with caching
 * @param {string} ip - IP address
 * @returns {Object|null} Location info or null
 */
const getLocationInfo = (ip) => {
  try {
    // Skip for localhost/private IPs
    if (isPrivateIP(ip)) {
      return null;
    }

    // Check cache first
    const cacheKey = ip;
    if (geoCache.has(cacheKey)) {
      const cached = geoCache.get(cacheKey);
      if (Date.now() - cached.timestamp < GEO_CACHE_TTL) {
        return cached.data;
      }
      geoCache.delete(cacheKey);
    }
    
    const geo = geoip.lookup(ip);
    if (!geo) {
      // Cache null result to prevent repeated lookups
      geoCache.set(cacheKey, { data: null, timestamp: Date.now() });
      return null;
    }
    
    const location = {
      country: geo.country || null,
      countryCode: geo.country || null,
      region: geo.region || null,
      city: geo.city || null,
      latitude: geo.ll ? geo.ll[0] : null,
      longitude: geo.ll ? geo.ll[1] : null,
      timezone: geo.timezone || null,
      range: geo.range || null,
      eu: geo.eu || null
    };
    
    // Cache the result
    geoCache.set(cacheKey, { data: location, timestamp: Date.now() });
    
    return location;
  } catch (error) {
    logger.error(`GeoIP lookup error: ${error.message}`);
    return null;
  }
};

/**
 * Get ISP info from IP (using external API with fallback)
 * @param {string} ip - IP address
 * @returns {Promise<Object|null>} ISP info or null
 */
const getISPInfo = async (ip) => {
  try {
    // Skip for localhost
    if (isPrivateIP(ip)) {
      return null;
    }

    // Try multiple providers with fallback
    const providers = [
      { url: `http://ip-api.com/json/${ip}?fields=status,message,isp,org,as,asname,country,regionName,city`, parser: parseIpApi },
      { url: `https://ipinfo.io/${ip}/json`, parser: parseIpInfo }
    ];

    for (const provider of providers) {
      try {
        const response = await fetch(provider.url, {
          signal: AbortSignal.timeout(3000)
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const result = provider.parser(data);
        if (result) return result;
      } catch (err) {
        // Continue to next provider
        continue;
      }
    }
    
    return null;
  } catch (error) {
    logger.error(`ISP lookup error: ${error.message}`);
    return null;
  }
};

// Parsers for different providers
const parseIpApi = (data) => {
  if (data.status === 'success') {
    return {
      isp: data.isp || null,
      organization: data.org || null,
      as: data.as || null,
      asName: data.asname || null,
      country: data.country || null,
      region: data.regionName || null,
      city: data.city || null
    };
  }
  return null;
};

const parseIpInfo = (data) => {
  if (data && data.ip) {
    return {
      isp: data.org || null,
      organization: data.org || null,
      as: data.asn ? `AS${data.asn}` : null,
      asName: null,
      country: data.country || null,
      region: data.region || null,
      city: data.city || null
    };
  }
  return null;
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
    const maskInt = parseInt(mask);
    
    if (ip.includes(':')) {
      // IPv6 not fully supported
      return false;
    }
    
    const ipParts = ip.split('.').map(Number);
    const baseParts = base.split('.').map(Number);
    
    if (ipParts.length !== 4 || baseParts.length !== 4) return false;
    if (ipParts.some(isNaN) || baseParts.some(isNaN)) return false;
    
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
  if (!ip) return 'unknown';
  
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
  if (!ip) return 'Unknown';
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
    timestamp: new Date().toISOString()
  };
};

/**
 * Get local IP addresses
 * @returns {Array<Object>} Local IP addresses with interface info
 */
const getLocalIPs = () => {
  try {
    const interfaces = os.networkInterfaces();
    const ips = [];
    
    Object.keys(interfaces).forEach(ifaceName => {
      interfaces[ifaceName].forEach(addr => {
        if (addr.family === 'IPv4' && !addr.internal) {
          ips.push({
            interface: ifaceName,
            address: addr.address,
            netmask: addr.netmask,
            mac: addr.mac
          });
        }
      });
    });
    
    return ips;
  } catch (error) {
    logger.error(`Local IPs error: ${error.message}`);
    return [];
  }
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
    if (parts.length >= 4) {
      return `${parts.slice(0, 4).join(':')}:0000:0000:0000:0000`;
    }
    return ip;
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
    if (isPrivateIP(ip)) {
      return { 
        score: 100, 
        isSpam: false, 
        isBot: false, 
        isProxy: false, 
        riskLevel: 'low',
        confidence: 1
      };
    }
    
    // Try AbuseIPDB
    try {
      const apiKey = process.env.ABUSEIPDB_API_KEY;
      if (apiKey) {
        const response = await fetch(
          `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`,
          {
            headers: {
              'Key': apiKey,
              'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(3000)
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            const score = 100 - (data.data.abuseConfidenceScore || 0);
            return {
              score: Math.max(0, Math.min(100, score)),
              isSpam: data.data.abuseConfidenceScore > 50,
              isBot: data.data.isBot || false,
              isProxy: data.data.isProxy || false,
              riskLevel: data.data.abuseConfidenceScore > 70 ? 'high' : 
                        data.data.abuseConfidenceScore > 30 ? 'medium' : 'low',
              confidence: data.data.confidence || 0.8,
              reports: data.data.totalReports || 0,
              lastReport: data.data.lastReportedAt || null
            };
          }
        }
      }
    } catch (err) {
      // Fallback to next method
    }
    
    // Default response
    return {
      score: 50,
      isSpam: false,
      isBot: false,
      isProxy: false,
      riskLevel: 'unknown',
      confidence: 0.5
    };
  } catch (error) {
    logger.error(`IP reputation error: ${error.message}`);
    return {
      score: 50,
      isSpam: false,
      isBot: false,
      isProxy: false,
      riskLevel: 'unknown',
      confidence: 0
    };
  }
};

// Clear geo cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of geoCache) {
    if (now - value.timestamp > GEO_CACHE_TTL) {
      geoCache.delete(key);
    }
  }
}, 3600000); // Every hour

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
  getIPReputation,
  isPrivateIP
};