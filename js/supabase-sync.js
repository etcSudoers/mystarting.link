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

    async init() {
      const client = getSupabaseClient();
      if (!client) return;

      const { data: { session } } = await client.auth.getSession();
      this.currentUser = session?.user || null;

      client.auth.onAuthStateChange((event, session) => {
        this.currentUser = session?.user || null;
        this.updateUI();
      });
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
      this.updateUI();
    },

    async uploadSettings(encryptedData) {
      if (!this.currentUser) throw new Error('Please sign in first');
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
      } else {
        if (userInfo) userInfo.style.display = 'none';
        if (authForm) authForm.style.display = 'block';
      }
    }
  };

  window.SupabaseSync = SupabaseSync;
})();
