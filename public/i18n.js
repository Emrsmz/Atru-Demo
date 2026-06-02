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

    // --- messages / confirmations ---
    confirm_delete: {
      tr: 'Bu transfer silinsin mi? Bu işlem geri alınamaz.',
      en: 'Delete this transfer? This cannot be undone.',
    },
    added_one: { tr: 'Transfer eklendi.', en: 'Transfer added.' },
    added_many: { tr: '{n} yolcu eklendi.', en: '{n} passengers added.' },
    saved: { tr: 'Değişiklikler kaydedildi.', en: 'Changes saved.' },
    err_network: { tr: 'Bağlantı hatası. Lütfen tekrar deneyin.', en: 'Network error. Please try again.' },
    err_generic: { tr: 'Bir şeyler ters gitti.', en: 'Something went wrong.' },

    // --- placeholders ---
    ph_flight: { tr: 'TK1234', en: 'TK1234' },
    ph_passenger: { tr: 'Yolcu adı soyadı', en: 'Passenger full name' },
    ph_phone: { tr: 'Telefon (opsiyonel)', en: 'Phone (optional)' },
    ph_notes: { tr: 'Opsiyonel not', en: 'Optional note' },

    // --- backend error codes (err_<code>) ---
    err_fields_required: { tr: 'Kullanıcı adı ve şifre gerekli.', en: 'Username and password are required.' },
    err_invalid_credentials: { tr: 'Kullanıcı adı veya şifre hatalı.', en: 'Invalid username or password.' },
    err_reg_required: { tr: 'Otel adı, kullanıcı adı ve şifre gerekli.', en: 'Hotel name, username and password are required.' },
    err_password_short: { tr: 'Şifre en az 6 karakter olmalı.', en: 'Password must be at least 6 characters.' },
    err_username_taken: { tr: 'Bu kullanıcı adı zaten alınmış.', en: 'That username is already taken.' },
    err_flight_required: { tr: 'Uçuş kodu gerekli.', en: 'Flight code is required.' },
    err_passenger_required: { tr: 'En az bir yolcu adı gerekli.', en: 'At least one passenger name is required.' },
    err_arrival_required: { tr: 'Geliş tarihi & saati gerekli.', en: 'Arrival date & time is required.' },
    err_not_found: { tr: 'Transfer bulunamadı.', en: 'Transfer not found.' },
    err_invalid_id: { tr: 'Geçersiz kayıt.', en: 'Invalid id.' },
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

  // Format a stored datetime ('YYYY-MM-DDTHH:MM') in Turkey-friendly style
  // (gün.ay.yıl 24h). Falls back to en-GB (also day-first, 24h) in English.
  function fmtDateTime(s) {
    if (!s) return '—';
    const d = new Date(s);
    if (isNaN(d)) return s;
    const locale = lang === 'tr' ? 'tr-TR' : 'en-GB';
    return d.toLocaleString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
