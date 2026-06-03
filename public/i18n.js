/* ===== Lightweight i18n (TR default + EN) shared by all pages ===== */
(function () {
  const STORAGE_KEY = 'tms_lang';

  const STR = {
    // --- generic / auth ---
    app_title: { tr: 'Transfer Yönetim Sistemi', en: 'Transfer Management System' },
    hotel_panel: { tr: 'Otel Paneli', en: 'Hotel Panel' },
    driver_panel: { tr: 'Sürücü Paneli', en: 'Driver Panel' },
    tab_login: { tr: 'Giriş', en: 'Login' },
    tab_register: { tr: 'Kayıt Ol', en: 'Register' },
    username: { tr: 'Kullanıcı adı', en: 'Username' },
    password: { tr: 'Şifre', en: 'Password' },
    hotel_name: { tr: 'Otel adı', en: 'Hotel name' },
    sign_in: { tr: 'Giriş yap', en: 'Sign in' },
    create_account: { tr: 'Hesap oluştur', en: 'Create account' },
    to_driver_login: { tr: 'Sürücü girişi →', en: 'Driver login →' },
    to_hotel_login: { tr: '← Otel girişi', en: '← Hotel login' },
    logout: { tr: 'Çıkış', en: 'Logout' },

    // --- hotel dashboard ---
    flight_section: { tr: 'Uçuş bilgileri', en: 'Flight details' },
    passengers_section: { tr: 'Yolcular', en: 'Passengers' },
    add_transfer: { tr: 'Transfer ekle', en: 'Add transfer' },
    edit_transfer: { tr: 'Transferi düzenle', en: 'Edit transfer' },
    edit_group: { tr: 'Grubu düzenle', en: 'Edit group' },
    flight_code: { tr: 'Uçuş kodu', en: 'Flight code' },
    arrival: { tr: 'Geliş tarihi & saati', en: 'Arrival date & time' },
    departure: { tr: 'Dönüş tarihi & saati', en: 'Departure date & time' },
    phone: { tr: 'Telefon numarası', en: 'Phone number' },
    notes: { tr: 'Notlar', en: 'Notes' },
    optional: { tr: '(opsiyonel)', en: '(optional)' },
    only_arrival_hint: {
      tr: 'Boş bırakılırsa sadece geliş kaydedilir.',
      en: 'Leave empty to record arrival only.',
    },
    add_passenger: { tr: '+ Yolcu ekle', en: '+ Add passenger' },
    remove: { tr: 'Kaldır', en: 'Remove' },
    pick_datetime: { tr: 'Takvimden seç', en: 'Pick from calendar' },
    save_changes: { tr: 'Değişiklikleri kaydet', en: 'Save changes' },
    cancel: { tr: 'İptal', en: 'Cancel' },
    my_transfers: { tr: 'Transferlerim', en: 'My transfers' },
    col_flight: { tr: 'Uçuş', en: 'Flight' },
    col_passenger: { tr: 'Yolcu', en: 'Passenger' },
    col_arrival: { tr: 'Geliş', en: 'Arrival' },
    col_departure: { tr: 'Dönüş', en: 'Departure' },
    col_phone: { tr: 'Telefon', en: 'Phone' },
    col_notes: { tr: 'Notlar', en: 'Notes' },
    col_status: { tr: 'Durum', en: 'Status' },
    status_pending: { tr: 'Bekliyor', en: 'Pending' },
    status_completed: { tr: 'Tamamlandı', en: 'Completed' },
    edit: { tr: 'Düzenle', en: 'Edit' },
    delete: { tr: 'Sil', en: 'Delete' },
    empty_hotel: {
      tr: 'Henüz transfer yok. Yukarıdan ilk kaydınızı ekleyin.',
      en: 'No transfers yet. Add your first one above.',
    },
    records_suffix: { tr: 'kayıt', en: 'records' },

    // --- driver dashboard ---
    filter_today: { tr: 'Bugün', en: 'Today' },
    filter_upcoming: { tr: 'Yaklaşan', en: 'Upcoming' },
    filter_completed: { tr: 'Tamamlanan', en: 'Completed' },
    filter_all: { tr: 'Tümü', en: 'All' },
    pending_badge: { tr: 'Bekleyen', en: 'Pending' },
    empty_driver: { tr: 'Bu görünümde transfer yok.', en: 'No transfers in this view.' },
    mark_done: { tr: 'Tamamlandı işaretle', en: 'Mark done' },
    mark_pending: { tr: 'Bekliyor işaretle', en: 'Mark pending' },
    call: { tr: 'Ara', en: 'Call' },
    view_cards: { tr: 'Kart', en: 'Cards' },
    view_list: { tr: 'Liste', en: 'List' },
    arrival_short: { tr: 'Geliş', en: 'Arrival' },
    departure_short: { tr: 'Dönüş', en: 'Departure' },
    hotel_label: { tr: 'Otel', en: 'Hotel' },

    // --- admin panel ---
    admin_panel: { tr: 'Admin Paneli', en: 'Admin Panel' },
    hotels_title: { tr: 'Oteller', en: 'Hotels' },
    drivers_title: { tr: 'Sürücüler', en: 'Drivers' },
    all_transfers_title: { tr: 'Tüm transferler', en: 'All transfers' },
    add_hotel: { tr: '+ Otel ekle', en: '+ Add hotel' },
    add_driver: { tr: '+ Sürücü ekle', en: '+ Add driver' },
    col_name: { tr: 'Ad', en: 'Name' },
    col_created: { tr: 'Oluşturma', en: 'Created' },
    col_hotel: { tr: 'Otel', en: 'Hotel' },
    col_passengers: { tr: 'Yolcular', en: 'Passengers' },
    driver_name: { tr: 'Ad Soyad', en: 'Full name' },
    new_password_opt: { tr: 'Yeni şifre (boş = değişmez)', en: 'New password (blank = unchanged)' },
    pw_btn: { tr: 'Şifre', en: 'Password' },
    new_hotel: { tr: 'Yeni otel', en: 'New hotel' },
    edit_hotel: { tr: 'Oteli düzenle', en: 'Edit hotel' },
    new_driver: { tr: 'Yeni sürücü', en: 'New driver' },
    edit_driver: { tr: 'Sürücüyü düzenle', en: 'Edit driver' },
    empty_hotels: { tr: 'Henüz otel yok.', en: 'No hotels yet.' },
    empty_drivers: { tr: 'Henüz sürücü yok.', en: 'No drivers yet.' },
    admin_empty_transfers: { tr: 'Henüz transfer yok.', en: 'No transfers yet.' },
    confirm_delete_hotel: {
      tr: 'Bu otel ve TÜM transferleri silinecek. Emin misin?',
      en: 'This hotel and ALL its transfers will be deleted. Are you sure?',
    },
    confirm_delete_driver: { tr: 'Bu sürücü silinsin mi?', en: 'Delete this driver?' },
    prompt_new_password: {
      tr: 'Yeni şifre (en az 6 karakter):',
      en: 'New password (at least 6 characters):',
    },

    // --- messages / confirmations ---
    confirm_delete: {
      tr: 'Bu transfer silinsin mi? Bu işlem geri alınamaz.',
      en: 'Delete this transfer? This cannot be undone.',
    },
    confirm_delete_group: {
      tr: 'Bu gruptaki tüm transferler silinsin mi? Bu işlem geri alınamaz.',
      en: 'Delete all transfers in this group? This cannot be undone.',
    },
    added_one: { tr: 'Transfer eklendi.', en: 'Transfer added.' },
    added_many: { tr: '{n} yolcu eklendi.', en: '{n} passengers added.' },
    saved: { tr: 'Değişiklikler kaydedildi.', en: 'Changes saved.' },
    err_network: { tr: 'Bağlantı hatası. Lütfen tekrar deneyin.', en: 'Network error. Please try again.' },
    err_generic: { tr: 'Bir şeyler ters gitti.', en: 'Something went wrong.' },
    err_bad_datetime: {
      tr: 'Tarih/saat biçimi gg/aa/yyyy ss:dd olmalı (örn. 10/06/2026 18:30).',
      en: 'Date/time must be dd/mm/yyyy hh:mm (e.g. 10/06/2026 18:30).',
    },

    // --- placeholders ---
    ph_flight: { tr: 'TK1234', en: 'TK1234' },
    ph_passenger: { tr: 'Yolcu adı soyadı', en: 'Passenger full name' },
    ph_phone: { tr: 'Telefon (opsiyonel)', en: 'Phone (optional)' },
    ph_notes: { tr: 'Opsiyonel not', en: 'Optional note' },
    ph_datetime: { tr: 'gg/aa/yyyy ss:dd', en: 'dd/mm/yyyy hh:mm' },

    // --- backend error codes (err_<code>) ---
    err_fields_required: { tr: 'Kullanıcı adı ve şifre gerekli.', en: 'Username and password are required.' },
    err_invalid_credentials: { tr: 'Kullanıcı adı veya şifre hatalı.', en: 'Invalid username or password.' },
    err_too_many_attempts: {
      tr: 'Çok fazla başarısız deneme. Lütfen birazdan tekrar deneyin.',
      en: 'Too many failed attempts. Please try again later.',
    },
    err_admin_not_configured: {
      tr: 'Admin girişi yapılandırılmamış (ADMIN_PASS ayarlı değil).',
      en: 'Admin login is not configured (ADMIN_PASS not set).',
    },
    err_reg_required: { tr: 'Otel adı, kullanıcı adı ve şifre gerekli.', en: 'Hotel name, username and password are required.' },
    err_password_short: { tr: 'Şifre en az 6 karakter olmalı.', en: 'Password must be at least 6 characters.' },
    err_username_taken: { tr: 'Bu kullanıcı adı zaten alınmış.', en: 'That username is already taken.' },
    err_flight_required: { tr: 'Uçuş kodu gerekli.', en: 'Flight code is required.' },
    err_passenger_required: { tr: 'En az bir yolcu adı gerekli.', en: 'At least one passenger name is required.' },
    err_arrival_required: { tr: 'Geliş tarihi & saati gerekli.', en: 'Arrival date & time is required.' },
    err_not_found: { tr: 'Transfer bulunamadı.', en: 'Transfer not found.' },
    err_invalid_id: { tr: 'Geçersiz kayıt.', en: 'Invalid id.' },
    err_phone_too_long: { tr: 'Telefon çok uzun (en fazla 100 karakter).', en: 'Phone is too long (max 100 characters).' },
    download_backup: { tr: 'Yedeği indir', en: 'Download backup' },
  };

  let lang = localStorage.getItem(STORAGE_KEY) || 'tr';

  function t(key, params) {
    const entry = STR[key];
    let s = entry ? (entry[lang] != null ? entry[lang] : entry.en || key) : key;
    if (params) {
      for (const k in params) s = s.replace('{' + k + '}', params[k]);
    }
    return s;
  }

  // Format a stored datetime ('YYYY-MM-DDTHH:MM') as dd/mm/yyyy HH:mm (24h, no
  // AM/PM), e.g. 02/06/2026 18:30. Parsed by regex so the exact wall-clock time
  // the hotel entered is shown verbatim — no locale/timezone surprises.
  function fmtDateTime(s) {
    if (!s) return '—';
    const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(s);
    if (m) {
      const [, y, mo, d, h, mi] = m;
      return `${d}/${mo}/${y} ${h}:${mi}`;
    }
    const d = new Date(s);
    if (isNaN(d)) return s;
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(
      d.getHours()
    )}:${p(d.getMinutes())}`;
  }

  function apply(root) {
    const r = root || document;
    r.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    r.querySelectorAll('[data-i18n-ph]').forEach((el) => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
    r.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
    document.documentElement.lang = lang;
    document
      .querySelectorAll('.lang-switch [data-lang]')
      .forEach((b) => b.classList.toggle('active', b.getAttribute('data-lang') === lang));
  }

  function setLang(l) {
    if (l === lang) return;
    lang = l;
    localStorage.setItem(STORAGE_KEY, l);
    apply();
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  function initSwitcher() {
    document.querySelectorAll('.lang-switch').forEach((sw) => {
      sw.replaceChildren();
      ['tr', 'en'].forEach((l) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'lang-btn' + (l === lang ? ' active' : '');
        b.setAttribute('data-lang', l);
        b.textContent = l.toUpperCase();
        b.addEventListener('click', () => setLang(l));
        sw.appendChild(b);
      });
    });
  }

  window.i18n = { t, apply, setLang, getLang: () => lang, fmtDateTime };

  document.addEventListener('DOMContentLoaded', () => {
    initSwitcher();
    apply();
  });
})();
