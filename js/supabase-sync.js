(function() {
  // Supabase configuration
  const SUPABASE_URL = 'https://anofihpdufecrfcrjixu.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_bL7z5ws-plx9wmd8-j0CJQ_XdyQ9nrV';

  // Lazy Supabase client initialization
  let _supabaseClient = null;

  function getSupabaseClient() {
    if (!_supabaseClient) {
      if (!window.supabase) {
        console.error('Supabase library not loaded');
        return null;
      }
      _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return _supabaseClient;
  }

  // Supabase sync module
  const SupabaseSync = {
    currentUser: null,
    encryptionPassword: null,
    autoSyncInterval: null,

    async init() {
      const client = getSupabaseClient();
      if (!client) return;

      // Load stored password
      this.encryptionPassword = localStorage.getItem('mystartinglink_sync_password') || '';
      const storedPasswordInput = document.getElementById('supabaseSyncPassword');
      if (storedPasswordInput && this.encryptionPassword) {
        storedPasswordInput.value = this.encryptionPassword;
      }

      const { data: { session } } = await client.auth.getSession();
      this.currentUser = session?.user || null;

      client.auth.onAuthStateChange((event, session) => {
        this.currentUser = session?.user || null;
        this.updateUI();
        
        // Auto-download on sign in
        if (event === 'SIGNED_IN' && this.encryptionPassword) {
          setTimeout(() => this.autoDownload(), 500);
        }
      });

      // Auto-download on first load if logged in and password set
      if (this.currentUser && this.encryptionPassword) {
        setTimeout(() => this.autoDownload(), 1000);
        this.startAutoSync();
      }

      this.updateUI();
    },

    async signUp(email, password) {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    },

    async signIn(email, password) {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },

    async signOut() {
      const client = getSupabaseClient();
      const { error } = await client.auth.signOut();
      if (error) throw error;
      this.currentUser = null;
      this.stopAutoSync();
      this.updateUI();
    },

    setPassword(password) {
      this.encryptionPassword = password;
      if (password) {
        localStorage.setItem('mystartinglink_sync_password', password);
      } else {
        localStorage.removeItem('mystartinglink_sync_password');
      }
    },

    async uploadSettings(encryptedData) {
      if (!this.currentUser) throw new Error('Please sign in first');
      if (!this.encryptionPassword) throw new Error('Please set encryption password');

      const client = getSupabaseClient();

      const { data, error } = await client
        .from('user_blobs')
        .upsert({
          user_id: this.currentUser.id,
          encrypted_data: encryptedData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      return true;
    },

    async downloadSettings() {
      if (!this.currentUser) throw new Error('Please sign in first');
      if (!this.encryptionPassword) throw new Error('Please set encryption password');

      const client = getSupabaseClient();

      const { data, error } = await client
        .from('user_blobs')
        .select('encrypted_data')
        .eq('user_id', this.currentUser.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data?.encrypted_data || null;
    },

    async autoUpload() {
      if (!this.currentUser || !this.encryptionPassword) return;
      
      try {
        const { key, salt } = await CryptoUtils.generateKey(this.encryptionPassword);
        const encrypted = await CryptoUtils.encrypt(settings, key, salt);
        await this.uploadSettings(encrypted);
        const statusEl = document.getElementById('supabaseSyncStatus');
        if (statusEl) {
          statusEl.textContent = 'Auto-synced ' + new Date().toLocaleTimeString();
        }
      } catch (e) {
        console.error('Auto-upload failed:', e);
      }
    },

    async autoDownload() {
      if (!this.currentUser || !this.encryptionPassword) return;

      try {
        const encrypted = await this.downloadSettings();
        if (!encrypted) return;
        
        const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
        const salt = combined.slice(0, 16);
        const key = await CryptoUtils.importKey(this.encryptionPassword, salt);
        const decrypted = await CryptoUtils.decrypt(encrypted, key);
        
        if (decrypted) {
          settings = { ...DEFAULT_SETTINGS, ...decrypted };
          saveSettings();
          applySettings();
          const statusEl = document.getElementById('supabaseSyncStatus');
          if (statusEl) {
            statusEl.textContent = 'Synced ' + new Date().toLocaleTimeString();
          }
        }
      } catch (e) {
        console.error('Auto-download failed:', e);
      }
    },

    startAutoSync() {
      this.stopAutoSync();
      this.autoSyncInterval = setInterval(() => {
        this.autoDownload();
      }, 10 * 60 * 1000); // 10 minutes
    },

    stopAutoSync() {
      if (this.autoSyncInterval) {
        clearInterval(this.autoSyncInterval);
        this.autoSyncInterval = null;
      }
    },

    updateUI() {
      const authSection = document.getElementById('supabaseAuthSection');
      const userInfo = document.getElementById('supabaseUserInfo');
      const authForm = document.getElementById('supabaseAuthForm');
      const userEmail = document.getElementById('supabaseUserEmail');
      const syncStatus = document.getElementById('supabaseSyncStatus');

      if (!authSection) return;

      if (this.currentUser) {
        if (userEmail) userEmail.textContent = this.currentUser.email;
        if (userInfo) userInfo.style.display = 'block';
        if (authForm) authForm.style.display = 'none';
        this.startAutoSync();
      } else {
        if (userInfo) userInfo.style.display = 'none';
        if (authForm) authForm.style.display = 'block';
        this.stopAutoSync();
      }
    }
  };

  window.SupabaseSync = SupabaseSync;
})();
