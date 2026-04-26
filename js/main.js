const STORAGE_KEY = 'mystartinglink_settings';

const DEFAULT_SETTINGS = {
  showClock: true,
  showDate: true,
  showWeather: false,
  showGreeting: false,
  showNotes: true,
  showTasks: true,
  use24h: true,
  userName: '',
  searchEngine: 'duckduckgo',
  currentEngine: 'duckduckgo',
  customEngineUrl: '',
  viewMode: 'grid',
  theme: 'dark',
  customColors: {
    clock: '#ffffff',
    date: 'rgba(255,255,255,0.7)',
    background: '#1a1a2e',
    text: '#ffffff',
    favIcon: '#64b5f6',
    widgetTitle: 'rgba(255,255,255,0.7)'
  },
  wallpaper: { source: 'none', custom: '', opacity: 0.4, picsumId: '' },
  weather: { zip: '', country: 'US' },
  favorites: [
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'YouTube', url: 'https://youtube.com' },
    { name: 'Reddit', url: 'https://reddit.com' },
    { name: 'Wikipedia', url: 'https://wikipedia.org' }
  ],
  notes: '',
  tasks: []
};

const THEMES = {
  dark: { name: 'Dark BG', clock: '#ffffff', date: 'rgba(255,255,255,0.7)', background: '#1a1a2e', text: '#ffffff', accent: '#64b5f6', menuBg: 'rgba(0,0,0,0.85)', inputBg: 'rgba(255,255,255,0.15)' },
  light: { name: 'Light BG', clock: '#1a1a2e', date: 'rgba(26,26,46,0.7)', background: '#f5f5f5', text: '#1a1a2e', accent: '#1976d2', menuBg: 'rgba(255,255,255,0.95)', inputBg: 'rgba(0,0,0,0.1)' },
  terminal: { name: 'Terminal', clock: '#00ff00', date: '#00aa00', background: '#0a0a0a', text: '#00ff00', accent: '#00ff00', menuBg: 'rgba(0,0,0,0.95)', inputBg: 'rgba(0,255,0,0.15)' },
  dracula: { name: 'Dracula', clock: '#f8f8f2', date: 'rgba(248,248,242,0.6)', background: '#282a36', text: '#f8f8f2', accent: '#bd93f9', menuBg: 'rgba(40,42,54,0.95)', inputBg: 'rgba(255,255,255,0.1)' },
  nord: { name: 'Nord', clock: '#eceff4', date: 'rgba(236,239,244,0.6)', background: '#2e3440', text: '#eceff4', accent: '#88c0d0', menuBg: 'rgba(46,52,64,0.95)', inputBg: 'rgba(255,255,255,0.1)' },
  monokai: { name: 'Monokai', clock: '#f8f8f2', date: 'rgba(248,248,242,0.6)', background: '#272822', text: '#f8f8f2', accent: '#ae81ff', menuBg: 'rgba(39,40,34,0.95)', inputBg: 'rgba(255,255,255,0.1)' }
};

const searchEngines = {
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', icon: '🔴' },
  google: { name: 'Google', url: 'https://www.google.com/search?q=', icon: '🔵' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=', icon: '🟠' },
  custom: { name: 'Custom', url: '', icon: '⚙️' }
};

let settings = { ...DEFAULT_SETTINGS };
let currentPicsumId = '';
let suggestionCache = {};

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  applySettings();
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

function applySettings() {
  const colors = settings.customColors || DEFAULT_SETTINGS.customColors;
  const theme = THEMES[settings.theme] || THEMES.dark;

  document.documentElement.style.setProperty('--clock-color', colors.clock);
  document.documentElement.style.setProperty('--date-color', colors.date);
  document.documentElement.style.setProperty('--text-color', colors.text);
  document.documentElement.style.setProperty('--accent', theme.accent);
  document.documentElement.style.setProperty('--fav-icon-color', colors.favIcon || '#64b5f6');
  document.documentElement.style.setProperty('--widget-title-color', colors.widgetTitle || 'rgba(255,255,255,0.7)');
  document.documentElement.style.setProperty('--card-bg', theme.inputBg || 'rgba(255,255,255,0.1)');
  if (theme.menuBg) {
    document.documentElement.style.setProperty('--menu-bg', theme.menuBg);
    document.documentElement.style.setProperty('--input-bg', theme.inputBg || theme.menuBg);
  }

  const elements = {
    showClock: document.getElementById('showClock'),
    showDate: document.getElementById('showDate'),
    showWeather: document.getElementById('showWeather'),
    showGreeting: document.getElementById('showGreeting'),
    use24h: document.getElementById('use24h'),
    defaultEngine: document.getElementById('defaultEngine'),
    customEngineUrl: document.getElementById('customEngineUrl'),
    viewMode: document.getElementById('viewMode'),
    themeSelect: document.getElementById('themeSelect'),
    customWallpaper: document.getElementById('customWallpaper'),
    wallpaperOpacity: document.getElementById('wallpaperOpacity'),
    clock: document.getElementById('clock'),
    date: document.getElementById('date'),
    weatherZip: document.getElementById('weatherZip'),
    weatherCountry: document.getElementById('weatherCountry'),
    showNotes: document.getElementById('showNotes'),
    showTasks: document.getElementById('showTasks'),
clockColor: document.getElementById('clockColor'),
    dateColor: document.getElementById('dateColor'),
    textColor: document.getElementById('textColor'),
    favIconColor: document.getElementById('favIconColor'),
    widgetTitleColor: document.getElementById('widgetTitleColor')
  };

  if (elements.showClock) elements.showClock.checked = settings.showClock;
  if (elements.showDate) elements.showDate.checked = settings.showDate;
  if (elements.showWeather) elements.showWeather.checked = settings.showWeather;
  if (elements.showGreeting) elements.showGreeting.checked = settings.showGreeting;
  if (elements.showNotes) elements.showNotes.checked = settings.showNotes;
  if (elements.showTasks) elements.showTasks.checked = settings.showTasks;
  if (elements.use24h) elements.use24h.checked = settings.use24h;
  if (elements.defaultEngine) elements.defaultEngine.value = settings.searchEngine;
  if (elements.customEngineUrl) elements.customEngineUrl.value = settings.customEngineUrl || '';
  if (elements.viewMode) elements.viewMode.value = settings.viewMode;
  if (elements.themeSelect) elements.themeSelect.value = settings.theme;
  if (elements.customWallpaper) elements.customWallpaper.value = settings.wallpaper.custom || '';
  if (elements.wallpaperOpacity) elements.wallpaperOpacity.value = settings.wallpaper.opacity ?? 0.4;
  if (elements.weatherZip) elements.weatherZip.value = settings.weather?.zip || '';
  if (elements.weatherCountry) elements.weatherCountry.value = settings.weather?.country || 'US';
  if (elements.clockColor) elements.clockColor.value = colors.clock;
  if (elements.dateColor) elements.dateColor.value = colors.date;
  if (elements.textColor) elements.textColor.value = colors.text;
  if (elements.favIconColor) elements.favIconColor.value = colors.favIcon || '#64b5f6';
  if (elements.widgetTitleColor) elements.widgetTitleColor.value = colors.widgetTitle || 'rgba(255,255,255,0.7)';
  if (elements.userName) elements.userName.value = settings.userName || '';

  if (elements.clock) elements.clock.style.display = settings.showClock ? 'block' : 'none';
  if (elements.date) elements.date.style.display = settings.showDate ? 'block' : 'none';

  const notesWidget = document.getElementById('notesWidget');
  const tasksWidget = document.getElementById('tasksWidget');
  const widgetRow = document.getElementById('widgetRow');
  if (widgetRow) widgetRow.style.display = (settings.showNotes || settings.showTasks) ? 'flex' : 'none';
  if (notesWidget) notesWidget.style.display = settings.showNotes ? 'block' : 'none';
  if (tasksWidget) tasksWidget.style.display = settings.showTasks ? 'block' : 'none';

  const urlItem = document.getElementById('customEngineUrlItem');
  if (urlItem) urlItem.style.display = settings.searchEngine === 'custom' ? 'flex' : 'none';

  updateEngineSelect();
  updateFavoritesView();
  loadWallpaper();
  loadWeather();
  renderFavorites();
}

function updateEngineSelect() {
  const engineSelect = document.getElementById('engineSelect');
  if (!engineSelect) return;

  engineSelect.innerHTML = 
    '<option value="duckduckgo" style="color:#de5833;">● DuckDuckGo</option>' +
    '<option value="google" style="color:#4285f4;">● Google</option>' +
    '<option value="bing" style="color:#f48024;">● Bing</option>';

  engineSelect.value = settings.currentEngine;
}

function updateClock() {
  const now = new Date();
  const clock = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  const greeting = document.getElementById('greeting');

  const hour = now.getHours();
  let timeGreeting = '';
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 17) timeGreeting = 'Good afternoon';
  else timeGreeting = 'Good evening';

  if (greeting && settings.userName && settings.showGreeting) {
    greeting.textContent = timeGreeting + ', ' + settings.userName + '!';
    greeting.style.display = 'block';
  } else if (greeting) {
    greeting.style.display = 'none';
  }

  if (clock && settings.showClock) {
    let hours = settings.use24h ? now.getHours().toString().padStart(2, '0') : (now.getHours() % 12 || 12).toString();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const suffix = settings.use24h ? '' : (now.getHours() >= 12 ? ' PM' : ' AM');
    clock.textContent = hours + ':' + minutes + suffix;
  }

  if (dateEl && settings.showDate) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', options);
  }
}

function getSearchUrl(query, engine) {
  if (engine === 'custom' && settings.customEngineUrl) {
    return settings.customEngineUrl + encodeURIComponent(query);
  }
  const eng = searchEngines[engine];
  return eng ? eng.url + encodeURIComponent(query) : searchEngines.duckduckgo.url + encodeURIComponent(query);
}

function performSearch(query) {
  const engine = document.getElementById('engineSelect').value;
  window.location.href = getSearchUrl(query, engine);
}

async function fetchSuggestions(query) {
  const suggestionsEl = document.getElementById('suggestions');
  if (!query || query.length < 1) {
    suggestionsEl.classList.remove('active');
    return;
  }

  const cacheKey = query.toLowerCase();
  if (suggestionCache[cacheKey]) {
    displaySuggestions(suggestionCache[cacheKey], suggestionsEl);
    return;
  }

  try {
    const res = await fetch('https://en.wikipedia.org/w/api.php?action=opensearch&search=' + encodeURIComponent(query) + '&limit=8&origin=*', {
      headers: { 'Accept': 'application/json' }
    });

    const data = await res.json();
    let suggestions = data[1] || [];

    if (suggestions.length === 0) {
      const srRes = await fetch('https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + encodeURIComponent(query) + '&srlimit=8&format=json');
      const srData = await srRes.json();
      suggestions = srData.query?.search?.map(r => r.title) || [];
    }

    if (suggestions.length > 0) {
      suggestionCache[cacheKey] = suggestions;
      displaySuggestions(suggestions, suggestionsEl);
    } else {
      displaySuggestions([query], suggestionsEl);
    }
  } catch (err) {
    displaySuggestions([query], suggestionsEl);
  }
}

function displaySuggestions(suggestions, container) {
  container.innerHTML = suggestions.map(s => '<div class="suggestion-item">' + s + '</div>').join('');

  container.querySelectorAll('.suggestion-item').forEach((item, i) => {
    item.addEventListener('click', () => {
      performSearch(suggestions[i]);
    });
  });

  container.classList.add('active');
}

function renderFavorites() {
  const container = document.getElementById('favorites');
  if (!container) return;

  container.innerHTML = settings.favorites.map((fav, i) =>
    '<a href="' + fav.url + '" class="favorite-item" data-index="' + i + '">' +
      '<div class="favorite-icon">' + fav.name[0].toUpperCase() + '</div>' +
      '<div class="favorite-name">' + fav.name + '</div>' +
    '</a>'
  ).join('');

  renderFavoritesList();
}

function renderFavoritesList() {
  const container = document.getElementById('favoritesList');
  if (!container) return;

  container.innerHTML = settings.favorites.map((fav, i) =>
    '<div class="menu-item" style="display: flex; justify-content: space-between;">' +
      '<span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;">' + fav.name + '</span>' +
      '<button class="menu-btn remove-fav-list-btn" data-index="' + i + '" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;">Remove</button>' +
    '</div>'
  ).join('');

  container.querySelectorAll('.remove-fav-list-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      const name = settings.favorites[index].name;
      if (confirm('Remove "' + name + '"?')) {
        settings.favorites.splice(index, 1);
        saveSettings();
        renderFavorites();
        renderFavoritesList();
      }
    });
  });
}

function updateFavoritesView() {
  const container = document.getElementById('favorites');
  const gridBtn = document.getElementById('gridViewBtn');
  const listBtn = document.getElementById('listViewBtn');

  if (!container) return;

  container.classList.remove('list-view');
  if (settings.viewMode === 'list') container.classList.add('list-view');

  if (gridBtn) gridBtn.classList.toggle('active', settings.viewMode === 'grid');
  if (listBtn) listBtn.classList.toggle('active', settings.viewMode === 'list');
}

function loadWallpaper() {
  const bg = document.getElementById('bgImage');
  const overlay = document.querySelector('.overlay');
  if (!bg) return;

  const source = settings.wallpaper.source;
  const custom = settings.wallpaper.custom;
  const opacity = settings.wallpaper.opacity ?? 0.4;

  document.querySelectorAll('.wallpaper-source').forEach(el => {
    el.classList.toggle('active', el.dataset.source === source);
  });

  const lockItem = document.getElementById('lockWallpaperItem');
  if (lockItem) lockItem.style.display = source === 'picsum' ? 'flex' : 'none';

  if (overlay) overlay.style.background = 'rgba(0, 0, 0, ' + opacity + ')';

  document.body.style.background = settings.customColors?.background || DEFAULT_SETTINGS.customColors.background;
  bg.src = '';
  bg.style.display = 'none';

  if (source === 'none') return;

  if (source === 'custom' && custom) {
    bg.src = custom;
    bg.onerror = () => { bg.style.display = 'none'; };
    bg.style.display = 'block';
    return;
  }

  if (source === 'picsum') {
    const rand = Date.now();
    const id = Math.floor(Math.random() * 1000);
    const url = 'https://picsum.photos/id/' + id + '/1920/1080?' + rand;
    bg.src = url;
    currentPicsumId = id.toString();
    bg.onerror = () => {
      bg.src = 'https://picsum.photos/1920/1080?' + rand;
      currentPicsumId = '';
    };
    bg.onload = () => { bg.style.display = 'block'; };
    bg.style.display = 'block';
  }
}

async function loadWeather() {
  const weatherEl = document.getElementById('weather');
  if (!weatherEl) return;

  const zip = settings.weather?.zip;
  const country = settings.weather?.country || 'US';

  if (!zip) {
    weatherEl.style.display = 'none';
    return;
  }

  weatherEl.style.display = settings.showWeather ? 'flex' : 'none';

  try {
    const res = await fetch('https://wttr.in/' + zip + (country !== 'US' ? ',' + country : '') + '?format=j1');
    if (!res.ok) throw new Error('Weather unavailable');

    const data = await res.json();
    const current = data.current_condition[0];
    const temp = current.temp_F;
    const desc = current.weatherDesc[0].value;
    const icon = current.weatherCode < 1000 ? '☀️' :
                current.weatherCode < 2000 ? '⛅' :
                current.weatherCode < 3000 ? '🌫️' :
                current.weatherCode < 4000 ? '🌧️' :
                current.weatherCode < 5000 ? '❄️' :
                current.weatherCode < 6000 ? '🌧️' :
                current.weatherCode < 7000 ? '🌨️' :
                current.weatherCode < 8000 ? '🌧️' : '🌡️';

    const weatherUrl = 'https://wttr.in/' + zip + (country !== 'US' ? ',' + country : '');
    weatherEl.innerHTML = '<a href="' + weatherUrl + '" target="_blank" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">' +
      '<span class="weather-icon">' + icon + '</span>' +
      '<span class="weather-temp">' + temp + '°F</span>' +
      '<span class="weather-desc">' + desc + '</span>' +
    '</a>';
  } catch (err) {
    weatherEl.innerHTML = '<span class="weather-desc">Weather unavailable</span>';
  }
}

function openMenu() {
  const menu = document.getElementById('menu');
  menu.classList.add('active');
  menu.scrollTop = 0;
  document.getElementById('menuOverlay').classList.add('active');
}

function closeMenu() {
  document.getElementById('menu').classList.remove('active');
  document.getElementById('menuOverlay').classList.remove('active');
}

function initEventListeners() {
  const searchInput = document.getElementById('searchInput');
  const engineSelect = document.getElementById('engineSelect');
  const hamburger = document.getElementById('hamburger');
  const menuOverlay = document.getElementById('menuOverlay');
  const menuClose = document.getElementById('menuClose');

  if (menuClose) menuClose.addEventListener('click', closeMenu);

  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch(e.target.value);
    });
    searchInput.addEventListener('input', (e) => {
      fetchSuggestions(e.target.value.trim());
    });
    searchInput.addEventListener('blur', () => {
      setTimeout(() => {
        document.getElementById('suggestions').classList.remove('active');
      }, 200);
    });
  }

  if (engineSelect) {
    engineSelect.addEventListener('change', (e) => {
      settings.currentEngine = e.target.value;
      saveSettings();
    });
  }

  if (hamburger) hamburger.addEventListener('click', openMenu);
  if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);

  const showClock = document.getElementById('showClock');
  const showDate = document.getElementById('showDate');
  const showWeather = document.getElementById('showWeather');
  const use24h = document.getElementById('use24h');
  const defaultEngine = document.getElementById('defaultEngine');
  const customEngineUrl = document.getElementById('customEngineUrl');
  const viewMode = document.getElementById('viewMode');
  const themeSelect = document.getElementById('themeSelect');
  const gridViewBtn = document.getElementById('gridViewBtn');
  const listViewBtn = document.getElementById('listViewBtn');
  const addFavoriteBtn = document.getElementById('addFavoriteBtn');
  const saveFavorite = document.getElementById('saveFavorite');
  const cancelFavorite = document.getElementById('cancelFavorite');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const customWallpaper = document.getElementById('customWallpaper');
  const clockColor = document.getElementById('clockColor');
  const dateColor = document.getElementById('dateColor');
  const textColor = document.getElementById('textColor');
  const resetColorsBtn = document.getElementById('resetColorsBtn');

  if (showClock) showClock.addEventListener('change', (e) => { settings.showClock = e.target.checked; saveSettings(); applySettings(); });
  if (showDate) showDate.addEventListener('change', (e) => { settings.showDate = e.target.checked; saveSettings(); applySettings(); });
  if (showWeather) showWeather.addEventListener('change', (e) => { settings.showWeather = e.target.checked; saveSettings(); loadWeather(); });
  if (use24h) use24h.addEventListener('change', (e) => { settings.use24h = e.target.checked; saveSettings(); updateClock(); });

  const showGreeting = document.getElementById('showGreeting');
  if (showGreeting) showGreeting.addEventListener('change', (e) => { settings.showGreeting = e.target.checked; saveSettings(); updateClock(); });

  const showNotes = document.getElementById('showNotes');
  if (showNotes) showNotes.addEventListener('change', (e) => { settings.showNotes = e.target.checked; saveSettings(); applySettings(); });

  const showTasks = document.getElementById('showTasks');
  if (showTasks) showTasks.addEventListener('change', (e) => { settings.showTasks = e.target.checked; saveSettings(); applySettings(); });
  if (defaultEngine) defaultEngine.addEventListener('change', (e) => {
    settings.searchEngine = e.target.value;
    const urlItem = document.getElementById('customEngineUrlItem');
    if (urlItem) urlItem.style.display = e.target.value === 'custom' ? 'flex' : 'none';
    saveSettings();
  });
  if (customEngineUrl) customEngineUrl.addEventListener('change', (e) => { settings.customEngineUrl = e.target.value; saveSettings(); });
  if (viewMode) viewMode.addEventListener('change', (e) => { settings.viewMode = e.target.value; saveSettings(); updateFavoritesView(); });
  if (themeSelect) themeSelect.addEventListener('change', (e) => {
    settings.theme = e.target.value;
    const themeColors = THEMES[e.target.value];
    if (themeColors) {
      settings.customColors = { 
        clock: themeColors.clock, 
        date: themeColors.date, 
        background: themeColors.background, 
        text: themeColors.text,
        favIcon: themeColors.accent
      };
    }
    saveSettings();
    applySettings();
  });
  if (clockColor) clockColor.addEventListener('change', (e) => { settings.customColors.clock = e.target.value; settings.theme = 'custom'; saveSettings(); applySettings(); });
  if (dateColor) dateColor.addEventListener('change', (e) => { settings.customColors.date = e.target.value; settings.theme = 'custom'; saveSettings(); applySettings(); });
  if (textColor) textColor.addEventListener('change', (e) => { settings.customColors.text = e.target.value; settings.theme = 'custom'; saveSettings(); applySettings(); });

  const favIconColor = document.getElementById('favIconColor');
  if (favIconColor) favIconColor.addEventListener('change', (e) => { settings.customColors.favIcon = e.target.value; settings.theme = 'custom'; saveSettings(); applySettings(); });

  const widgetTitleColor = document.getElementById('widgetTitleColor');
  if (widgetTitleColor) widgetTitleColor.addEventListener('change', (e) => { settings.customColors.widgetTitle = e.target.value; settings.theme = 'custom'; saveSettings(); applySettings(); });

  if (resetColorsBtn) resetColorsBtn.addEventListener('click', () => { settings.customColors = { ...DEFAULT_SETTINGS.customColors }; settings.theme = 'dark'; saveSettings(); applySettings(); });

  const userName = document.getElementById('userName');
  if (userName) userName.addEventListener('change', (e) => { settings.userName = e.target.value; saveSettings(); updateClock(); });

  if (gridViewBtn) gridViewBtn.addEventListener('click', () => { settings.viewMode = 'grid'; saveSettings(); updateFavoritesView(); });
  if (listViewBtn) listViewBtn.addEventListener('click', () => { settings.viewMode = 'list'; saveSettings(); updateFavoritesView(); });

  if (addFavoriteBtn) addFavoriteBtn.addEventListener('click', () => { document.getElementById('addFavoriteForm').classList.toggle('active'); });
  if (cancelFavorite) cancelFavorite.addEventListener('click', () => {
    document.getElementById('addFavoriteForm').classList.remove('active');
    document.getElementById('favName').value = '';
    document.getElementById('favUrl').value = '';
  });
  if (saveFavorite) saveFavorite.addEventListener('click', () => {
    const name = document.getElementById('favName').value.trim();
    let url = document.getElementById('favUrl').value.trim();
    if (!name || !url) { alert('Please fill in both name and URL'); return; }
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    settings.favorites.push({ name, url });
    saveSettings();
    renderFavorites();
    document.getElementById('favName').value = '';
    document.getElementById('favUrl').value = '';
    document.getElementById('addFavoriteForm').classList.remove('active');
  });

  document.querySelectorAll('.wallpaper-source').forEach(el => {
    el.addEventListener('click', () => {
      if (el.dataset.source === 'custom' && settings.wallpaper.custom) {
        settings.wallpaper.source = 'custom';
      } else if (el.dataset.source === 'picsum') {
        settings.wallpaper.source = 'picsum';
      } else {
        settings.wallpaper.source = el.dataset.source;
      }
      saveSettings();
      loadWallpaper();
    });
  });

  const applyWallpaperBtn = document.getElementById('applyWallpaperBtn');
  const wallpaperOpacity = document.getElementById('wallpaperOpacity');

  if (customWallpaper) customWallpaper.addEventListener('change', (e) => { settings.wallpaper.custom = e.target.value; });
  if (applyWallpaperBtn) applyWallpaperBtn.addEventListener('click', () => {
    const url = customWallpaper?.value?.trim();
    if (url) { settings.wallpaper.custom = url; settings.wallpaper.source = 'custom'; saveSettings(); loadWallpaper(); }
  });
  if (wallpaperOpacity) wallpaperOpacity.addEventListener('input', (e) => { 
    settings.wallpaper.opacity = parseFloat(e.target.value); 
    saveSettings(); 
    const overlay = document.querySelector('.overlay');
    if (overlay) overlay.style.background = 'rgba(0, 0, 0, ' + settings.wallpaper.opacity + ')';
  });

  const setAsCustomBtn = document.getElementById('setAsCustomBtn');
  if (setAsCustomBtn) setAsCustomBtn.addEventListener('click', () => {
    const id = currentPicsumId;
    if (id) {
      const url = 'https://picsum.photos/id/' + id + '/1920/1080';
      settings.wallpaper.custom = url;
      settings.wallpaper.source = 'custom';
      document.getElementById('customWallpaper').value = url;
      saveSettings();
      loadWallpaper();
      alert('Saved: ' + url);
    } else {
      alert('Load a Picsum image first');
    }
  });

  const applyWeatherBtn = document.getElementById('applyWeatherBtn');
  if (applyWeatherBtn) applyWeatherBtn.addEventListener('click', () => {
    const zip = document.getElementById('weatherZip')?.value?.trim();
    const country = document.getElementById('weatherCountry')?.value?.trim() || 'US';
    if (zip) { settings.weather = { zip, country }; settings.showWeather = true; saveSettings(); loadWeather(); }
  });

  if (exportBtn) exportBtn.addEventListener('click', () => {
    const data = JSON.stringify(settings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mystartinglink-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          settings = { ...DEFAULT_SETTINGS, ...imported };
          saveSettings();
          applySettings();
          alert('Settings imported!');
        } catch (err) { alert('Invalid settings file'); }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }

  const ipfsProvider = document.getElementById('ipfsProvider');
  const customProviderUrl = document.getElementById('customProviderUrl');
  const customProviderItem = document.getElementById('customProviderItem');
  const ipfsApiKey = document.getElementById('ipfsApiKey');
  const syncUploadBtn = document.getElementById('syncUploadBtn');
  const syncDownloadBtn = document.getElementById('syncDownloadBtn');
  const syncPassword = document.getElementById('syncPassword');
  const syncStatus = document.getElementById('syncStatus');
  const currentCid = document.getElementById('currentCid');

  if (ipfsProvider && customProviderItem) {
    ipfsProvider.addEventListener('change', () => {
      customProviderItem.style.display = ipfsProvider.value === 'custom' ? 'flex' : 'none';
    });
  }

  if (syncUploadBtn && syncPassword && ipfsProvider && ipfsApiKey) {
    syncUploadBtn.addEventListener('click', async () => {
      const password = syncPassword.value;
      const provider = ipfsProvider.value;
      const apiKey = ipfsApiKey.value;
      const customUrl = customProviderUrl ? customProviderUrl.value : '';
      
      if (!password) { alert('Please enter a password to encrypt with'); return; }
      if (!apiKey && provider !== 'custom') { alert('Please enter your API key'); return; }
      
      syncStatus.textContent = 'Uploading...';
      
      try {
        await SyncManager.initialize(password);
        const cid = await SyncManager.uploadSettings(settings, provider, apiKey, customUrl);
        
        if (cid) {
          currentCid.textContent = cid;
          syncStatus.textContent = 'Uploaded successfully!';
        } else {
          syncStatus.textContent = 'Upload failed';
        }
      } catch (e) {
        syncStatus.textContent = 'Error: ' + e.message;
      }
    });
  }

  if (syncDownloadBtn && syncPassword && ipfsProvider && ipfsApiKey) {
    syncDownloadBtn.addEventListener('click', async () => {
      const password = syncPassword.value;
      const provider = ipfsProvider.value;
      const apiKey = ipfsApiKey.value;
      const customUrl = customProviderUrl ? customProviderUrl.value : '';
      
      if (!password) { alert('Please enter your password'); return; }
      
      syncStatus.textContent = 'Downloading...';
      
      try {
        await SyncManager.initialize(password);
        const userCid = syncCid ? syncCid.value.trim() : '';
        const decrypted = await SyncManager.downloadSettings(provider, apiKey, customUrl, userCid);
        
        if (decrypted) {
          settings = { ...DEFAULT_SETTINGS, ...decrypted };
          saveSettings();
          applySettings();
          syncStatus.textContent = 'Settings restored!';
        } else {
          syncStatus.textContent = 'No backup found or wrong password';
        }
      } catch (e) {
        syncStatus.textContent = 'Error: ' + e.message;
      }
    });
  }

  const syncCid = document.getElementById('syncCid');
  const savedCid = SyncManager.getSavedCid();
  if (savedCid) {
    currentCid.textContent = savedCid;
  }
  if (syncCid && savedCid) {
    syncCid.value = savedCid;
  }

  const savedProvider = SyncManager.getSavedProvider();
  if (ipfsProvider && savedProvider) {
    ipfsProvider.value = savedProvider;
    if (customProviderItem) {
      customProviderItem.style.display = savedProvider === 'custom' ? 'flex' : 'none';
    }
  }

  const savedCustomUrl = SyncManager.getSavedCustomUrl();
  if (customProviderUrl && savedCustomUrl) {
    customProviderUrl.value = savedCustomUrl;
  }

  const savedApiKey = SyncManager.getSavedApiKey();
  if (ipfsApiKey && savedApiKey) {
    ipfsApiKey.value = savedApiKey;
  }

  const showQrBtn = document.getElementById('showQrBtn');
  if (showQrBtn) {
    showQrBtn.addEventListener('click', () => {
      showQrModal();
    });
  }

  function showQrModal() {
    const link = SyncManager.generateMagicLink();
    let qrContainer = document.getElementById('qrContainer');
    if (!qrContainer) {
      qrContainer = document.createElement('div');
      qrContainer.id = 'qrContainer';
      qrContainer.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:500;background:var(--menu-bg);padding:1.5rem;border-radius:16px;display:none;text-align:center;max-width:90vw;';
      qrContainer.innerHTML = '<div style="margin-bottom:1rem;font-size:0.8rem;color:var(--date-color);word-break:break-all;max-width:300px;">Scan to open on another device</div><div id="qrCode"></div><button id="closeQr" style="margin-top:1rem;padding:0.6rem;background:var(--input-bg);border:none;border-radius:8px;color:var(--text-color);cursor:pointer;width:100%;">Close</button>';
      document.body.appendChild(qrContainer);
      document.getElementById('closeQr').addEventListener('click', () => qrContainer.style.display = 'none');
    }
    
    const qrDiv = document.getElementById('qrCode');
    qrDiv.innerHTML = '';
    new QRCode(qrDiv, {
      text: link,
      width: 280,
      height: 280,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.L
    });
    
    qrContainer.style.display = 'block';
  }
}

function initSyncMagicLink() {
  const syncData = SyncManager.loadFromMagicLink();
  if (!syncData) return;

  const ipfsProvider = document.getElementById('ipfsProvider');
  const ipfsApiKey = document.getElementById('ipfsApiKey');
  const syncCid = document.getElementById('syncCid');
  const customProviderUrl = document.getElementById('customProviderUrl');
  const syncStatus = document.getElementById('syncStatus');

  if (syncData.provider && ipfsProvider) ipfsProvider.value = syncData.provider;
  if (syncData.apiKey && ipfsApiKey) ipfsApiKey.value = syncData.apiKey;
  if (syncData.cid && syncCid) syncCid.value = syncData.cid;
  if (syncData.customUrl && customProviderUrl) customProviderUrl.value = syncData.customUrl;

  if (syncStatus) syncStatus.textContent = 'Synced from magic link!';
  history.replaceState(null, '', window.location.pathname);
}

function initNotesAndTasks() {
  const notesTextarea = document.getElementById('notesTextarea');
  const saveNotesBtn = document.getElementById('saveNotesBtn');
  const tasksList = document.getElementById('tasksList');
  const taskInput = document.getElementById('taskInput');
  const addTaskBtn = document.getElementById('addTaskBtn');

  if (notesTextarea) {
    notesTextarea.value = settings.notes || '';
    
    if (saveNotesBtn) {
      saveNotesBtn.addEventListener('click', () => {
        settings.notes = notesTextarea.value;
        saveSettings();
        saveNotesBtn.textContent = 'Saved!';
        setTimeout(() => saveNotesBtn.textContent = 'Save', 1000);
      });
    }

    notesTextarea.addEventListener('input', () => {
      settings.notes = notesTextarea.value;
    });
  }

  function renderTasks() {
    if (!tasksList) return;
    tasksList.innerHTML = '';
    
    settings.tasks.forEach((task, index) => {
      const taskEl = document.createElement('div');
      taskEl.className = `task-item${task.completed ? ' completed' : ''}`;
      taskEl.innerHTML = `
        <input type="checkbox" class="task-checkbox"${task.completed ? ' checked' : ''}>
        <span class="task-text">${escapeHtml(task.text)}</span>
        <button class="task-delete" data-index="${index}">&times;</button>
      `;
      
      const checkbox = taskEl.querySelector('.task-checkbox');
      checkbox.addEventListener('change', () => {
        settings.tasks[index].completed = checkbox.checked;
        saveSettings();
        renderTasks();
      });
      
      const deleteBtn = taskEl.querySelector('.task-delete');
      deleteBtn.addEventListener('click', () => {
        settings.tasks.splice(index, 1);
        saveSettings();
        renderTasks();
      });
      
      tasksList.appendChild(taskEl);
    });
  }

  if (addTaskBtn && taskInput) {
    const addTask = () => {
      const text = taskInput.value.trim();
      if (text) {
        settings.tasks.push({ text, completed: false });
        saveSettings();
        renderTasks();
        taskInput.value = '';
      }
    };
    
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addTask();
    });
  }

  if (tasksList) {
    renderTasks();
  }
}

function init() {
  loadSettings();
  initEventListeners();
  initNotesAndTasks();
  initSyncMagicLink();
  updateClock();
  setInterval(updateClock, 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}