// Crypto utilities using Web Crypto API
const CryptoUtils = {
  // Generate a random encryption key from password
  async generateKey(password) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    return { key, salt };
  },
  
  // Encrypt data with AES-GCM
  async encrypt(data, key, salt) {
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      enc.encode(JSON.stringify(data))
    );
    
    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);
    
    return btoa(String.fromCharCode(...combined));
  },
  
  // Decrypt data with AES-GCM
  async decrypt(encryptedBase64, key) {
    try {
      const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const data = combined.slice(28);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      );
      
      const dec = new TextDecoder();
      return JSON.parse(dec.decode(decrypted));
    } catch (e) {
      console.error('Decryption failed:', e);
      return null;
    }
  },
  
  // Import key from password and existing salt
  async importKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
};

// IPFS providers configuration
const IPFS_PROVIDERS = {
  'nft.storage': {
    uploadUrl: 'https://api.nft.storage/upload',
    downloadUrl: (cid) => `https://ipfs.io/ipfs/${cid}`,
    uploadMethod: 'POST',
    headers: (apiKey) => ({ 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' })
  },
  'web3.storage': {
    uploadUrl: 'https://api.web3.storage/v3/upload',
    downloadUrl: (cid) => `https://ipfs.io/ipfs/${cid}`,
    uploadMethod: 'POST',
    headers: (apiKey) => ({ 'Authorization': `Bearer ${apiKey}` })
  },
  'infura': {
    uploadUrl: 'https://ipfs.infura.io:5001/api/v0/add',
    downloadUrl: (cid) => `https://ipfs.io/ipfs/${cid}`,
    uploadMethod: 'POST',
    headers: (apiKey) => ({})
  },
  'pinata': {
    uploadUrl: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
    downloadUrl: (cid) => `https://gateway.pinata.cloud/ipfs/${cid}`,
    uploadMethod: 'POST',
    headers: (apiKey) => ({ 'Authorization': `Bearer ${apiKey}` })
  },
  'custom': {
    uploadUrl: '',
    downloadUrl: (cid, customUrl) => `${customUrl}/${cid}`,
    uploadMethod: 'POST',
    headers: (apiKey) => ({})
  }
};

// IPFS sync module
const IPFSSync = {
  async upload(data, provider, apiKey, customUrl) {
    const config = IPFS_PROVIDERS[provider];
    if (!config || !apiKey) {
      throw new Error('Please select a provider and enter your API key');
    }

    let url = config.uploadUrl;
    if (provider === 'custom' && customUrl) {
      url = customUrl;
    }

    const headers = config.headers(apiKey);
    const isFormData = !['nft.storage', 'web3.storage'].includes(provider);

    try {
      let response;
      
      if (isFormData) {
        const formData = new FormData();
        const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data)], { type: 'application/json' });
        formData.append('file', blob, 'settings.json');
        
        response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: formData
        });
      } else {
        response = await fetch(url, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed (${response.status}): ${errorText.substring(0, 100)}`);
      }

      const result = await response.json();
      
      // Extract CID from response
      return result.cid || result.IpfsHash || result.Hash || result.Name;
    } catch (e) {
      console.error('IPFS upload error:', e);
      throw e;
    }
  },
  
  async download(cid, provider, apiKey, customUrl) {
    if (!cid) return null;
    
    const config = IPFS_PROVIDERS[provider];
    if (!config) return null;

    const url = provider === 'custom' && customUrl 
      ? config.downloadUrl(cid, customUrl)
      : config.downloadUrl(cid);

    const gateways = [
      url,
      `https://ipfs.io/ipfs/${cid}`,
      `https://dweb.link/ipfs/${cid}`,
      `https://gateway.ipfs.io/ipfs/${cid}`
    ];

    for (const gatewayUrl of gateways) {
      try {
        const response = await fetch(gatewayUrl, { 
          signal: AbortSignal.timeout(15000)
        });
        if (response.ok) {
          const text = await response.text();
          try {
            return JSON.parse(text);
          } catch {
            return text;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    return null;
  }
};

// Sync manager
const SyncManager = {
  password: null,
  
  async initialize(password) {
    this.password = password;
  },
  
  async uploadSettings(settings, provider, apiKey, customUrl) {
    if (!this.password) {
      throw new Error('Please set a sync password first');
    }
    
    // Encrypt settings
    const { key, salt } = await CryptoUtils.generateKey(this.password);
    const encrypted = await CryptoUtils.encrypt(settings, key, salt);
    
    // Upload to IPFS
    const cid = await IPFSSync.upload(encrypted, provider, apiKey, customUrl);
    
    if (cid) {
      localStorage.setItem('mystartinglink_sync_cid', cid);
      localStorage.setItem('mystartinglink_sync_provider', provider);
      localStorage.setItem('mystartinglink_sync_custom_url', customUrl || '');
    }
    
    return cid;
  },
  
  async downloadSettings(provider, apiKey, customUrl) {
    const cid = localStorage.getItem('mystartinglink_sync_cid');
    if (!cid) return null;
    
    const encrypted = await IPFSSync.download(cid, provider, apiKey, customUrl);
    if (!encrypted || !this.password) return null;
    
    // Decrypt
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const key = await CryptoUtils.importKey(this.password, salt);
    
    return await CryptoUtils.decrypt(encrypted, key);
  },
  
  getSavedCid() {
    return localStorage.getItem('mystartinglink_sync_cid');
  },
  
  getSavedProvider() {
    return localStorage.getItem('mystartinglink_sync_provider') || 'nft.storage';
  },
  
  getSavedCustomUrl() {
    return localStorage.getItem('mystartinglink_sync_custom_url') || '';
  }
};

window.CryptoUtils = CryptoUtils;
window.IPFSSync = IPFSSync;
window.SyncManager = SyncManager;