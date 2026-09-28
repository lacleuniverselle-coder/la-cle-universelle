/* sync.js — connexion Supabase (e-mail + mot de passe) et synchronisation
   de la clé localStorage "devisCalcSettings" entre appareils.
   L'URL et la clé "publishable" sont publiques : la sécurité repose sur les
   règles RLS de la table public.donnees (chaque utilisateur ne voit que sa ligne).
   Ne JAMAIS mettre ici de clé "secret" ou "service_role". */
(function () {
  'use strict';

  var SB_URL = 'https://fdmipovplcqchdqrzrwc.supabase.co';
  var SB_KEY = 'sb_publishable_-Gc_-PJCNCio2iXSAlOrtA_drq6N0fZ';

  var KEY = 'devisCalcSettings';     // données de l'appli (inchangé)
  var SESS = 'devisCalcSession';      // session de connexion
  var DIRTY = 'devisCalcDirty';       // modifications locales pas encore envoyées
  var TS = 'devisCalcRemoteTs';       // date de la dernière version synchronisée
  var BAK = 'devisCalcBackupAvantSync'; // copie de sécurité avant remplacement

  var _set = Storage.prototype.setItem;
  var _get = Storage.prototype.getItem;
  var _rm = Storage.prototype.removeItem;
  function lsGet(k) { try { return _get.call(localStorage, k); } catch (e) { return null; } }
  function lsSet(k, v) { try { _set.call(localStorage, k, v); } catch (e) {} }
  function lsRm(k) { try { _rm.call(localStorage, k); } catch (e) {} }

  var booted = false, changeSeq = 0, pushing = false, pendingPush = false, timer = null;
  var statusEl = null, readyCb = null;

  /* ---------- Suivi des modifications (aucun changement dans vos calculs) ---------- */
  Storage.prototype.setItem = function (k, v) {
    _set.call(this, k, v);
    if (this === localStorage && k === KEY && booted) markDirty();
  };

  function isDirty() { return lsGet(DIRTY) === '1'; }
  function markDirty() {
    changeSeq++;
    lsSet(DIRTY, '1');
    setStatus('⏳ Enregistrement…');
    clearTimeout(timer);
    timer = setTimeout(function () {
      pushNow(false).catch(function () { setStatus('⚠ Hors ligne — gardé sur cet appareil'); });
    }, 1000);
  }

  /* ---------- Session ---------- */
  function loadSession() { try { return JSON.parse(lsGet(SESS) || 'null'); } catch (e) { return null; } }
  function saveSession(t) {
    lsSet(SESS, JSON.stringify({
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      exp: Math.floor(Date.now() / 1000) + (t.expires_in || 3600),
      user: { id: t.user && t.user.id, email: t.user && t.user.email }
    }));
  }

  function authCall(grant, body) {
    return fetch(SB_URL + '/auth/v1/token?grant_type=' + grant, {
      method: 'POST',
      headers: { 'apikey': SB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).catch(function () { throw { net: true }; });
  }

  function refresh() {
    var s = loadSession();
    if (!s) return Promise.reject({ auth: true });
    return authCall('refresh_token', { refresh_token: s.refresh_token }).then(function (r) {
      if (r.status === 400 || r.status === 401 || r.status === 403) {
        lsRm(SESS);
        throw { auth: true };
      }
      if (!r.ok) throw { net: true };
      return r.json().then(saveSession);
    });
  }

  function ensureFresh() {
    var s = loadSession();
    if (!s) return Promise.reject({ auth: true });
    if (s.exp - 60 > Date.now() / 1000) return Promise.resolve();
    return refresh();
  }

  function login(email, password) {
    return authCall('password', { email: email, password: password }).then(function (r) {
      if (r.status === 400 || r.status === 401) throw { badcreds: true };
      if (!r.ok) throw { net: true };
      return r.json().then(saveSession);
    });
  }

  /* ---------- Appels à la base ---------- */
  function req(path, opts, retried) {
    opts = opts || {};
    return ensureFresh().then(function () {
      var s = loadSession();
      var h = { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + s.access_token, 'Content-Type': 'application/json' };
      for (var k in (opts.headers || {})) h[k] = opts.headers[k];
      return fetch(SB_URL + path, { method: opts.method || 'GET', headers: h, body: opts.body, keepalive: !!opts.keepalive })
        .catch(function () { throw { net: true }; });
    }).then(function (r) {
      if (r.status === 401 && !retried) return refresh().then(function () { return req(path, opts, true); });
      return r;
    });
  }

  function isEmpty(o) { return !o || typeof o !== 'object' || Object.keys(o).length === 0; }
  function stable(o) {
    if (Array.isArray(o)) return '[' + o.map(stable).join(',') + ']';
    if (o && typeof o === 'object') {
      return '{' + Object.keys(o).sort().map(function (k) { return JSON.stringify(k) + ':' + stable(o[k]); }).join(',') + '}';
    }
    return JSON.stringify(o);
  }
  function localObj() { try { return JSON.parse(lsGet(KEY) || '{}'); } catch (e) { return {}; } }

  function pull() {
    return req('/rest/v1/donnees?select=contenu,updated_at&limit=1').then(function (r) {
      if (!r.ok) throw { status: r.status };
      return r.json();
    }).then(function (rows) {
      if (!rows.length || isEmpty(rows[0].contenu)) return null;
      return rows[0];
    });
  }

  function pushNow(keepalive) {
    if (pushing) { pendingPush = true; return Promise.resolve(); }
    var contenu = localObj();
    if (isEmpty(contenu)) { lsRm(DIRTY); return Promise.resolve(); } // jamais d'écrasement par du vide
    var s = loadSession();
    if (!s) return Promise.reject({ auth: true });
    var seq = changeSeq, ts = new Date().toISOString();
    pushing = true;
    return req('/rest/v1/donnees?on_conflict=user_id', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ user_id: s.user.id, contenu: contenu, updated_at: ts }),
      keepalive: keepalive
    }).then(function (r) {
      pushing = false;
      if (!r.ok) throw { status: r.status };
      lsSet(TS, ts);
      if (seq === changeSeq) { lsRm(DIRTY); setStatus('☁ Synchronisé'); }
      if (pendingPush) { pendingPush = false; return pushNow(false); }
    }, function (e) { pushing = false; throw e; });
  }

  // Remplace les données locales par celles du serveur. Retourne true si elles ont changé.
  function applyRemote(row) {
    var local = lsGet(KEY);
    var same = false;
    try { same = local && stable(JSON.parse(local)) === stable(row.contenu); } catch (e) {}
    lsSet(TS, row.updated_at);
    if (same) return false;
    if (local && !isEmpty(localObj())) lsSet(BAK, local); // filet de sécurité
    lsSet(KEY, JSON.stringify(row.contenu));
    return true;
  }

  function syncBoot() {
    if (isDirty()) return pushNow(false).then(function () { return false; });
    return pull().then(function (row) {
      if (!row) {
        if (!isEmpty(localObj())) return pushNow(false).then(function () { return false; });
        return false;
      }
      return applyRemote(row);
    });
  }

  /* ---------- Écran de connexion ---------- */
  function $(id) { return document.getElementById(id); }
  function lockMsg(m) { var e = $('lockError'); if (e) e.textContent = m || ''; }
  function unlock() {
    document.body.classList.remove('locked');
    var l = $('lockScreen'); if (l) l.classList.add('hidden');
  }

  function injectStyle() {
    var st = document.createElement('style');
    st.textContent =
      '#lockEmail,#lockPass{width:100%;box-sizing:border-box;font-size:1rem;border:1px solid var(--line,#ccc);' +
      'border-radius:9px;padding:10px 12px;margin-top:8px;background:var(--bg,#fff);color:var(--ink,#222);font-family:inherit;}' +
      '#syncBar{text-align:center;font-size:.75rem;color:var(--ink-soft,#666);margin:22px 0 10px;}' +
      '#syncBar button{background:none;border:none;color:inherit;text-decoration:underline;cursor:pointer;font:inherit;padding:0 4px;}' +
      '#syncBanner{position:fixed;left:12px;right:12px;bottom:12px;z-index:9998;background:#4C3468;color:#fff;' +
      'padding:12px 14px;border-radius:10px;font-size:.85rem;display:flex;gap:10px;align-items:center;justify-content:space-between;}' +
      '#syncBanner button{background:#fff;color:#4C3468;border:none;border-radius:7px;padding:6px 12px;font-weight:600;cursor:pointer;}';
    document.head.appendChild(st);
  }

  function showLogin(msg) {
    lockMsg(msg);
    var btn = $('lockSubmit'), em = $('lockEmail'), pw = $('lockPass');
    if (!btn || !em || !pw) return;
    var busy = false;
    function go() {
      if (busy) return;
      var e = em.value.trim(), p = pw.value;
      if (!e || !p) { lockMsg('Saisissez votre e-mail et votre mot de passe.'); return; }
      busy = true; btn.disabled = true; lockMsg('Connexion…');
      login(e, p).then(function () { pw.value = ''; return start(); }).catch(function (err) {
        if (err && err.badcreds) lockMsg('E-mail ou mot de passe incorrect.');
        else if (err && err.net) lockMsg('Connexion impossible. Vérifiez internet et réessayez.');
        else lockMsg('Erreur de connexion (' + ((err && err.status) || 'inconnue') + ').');
      }).then(function () { busy = false; btn.disabled = false; });
    }
    btn.onclick = go;
    pw.onkeydown = function (ev) { if (ev.key === 'Enter') go(); };
    em.onkeydown = function (ev) { if (ev.key === 'Enter') pw.focus(); };
    setTimeout(function () { em.focus(); }, 50);
  }

  /* ---------- Démarrage ---------- */
  function start() {
    return ensureFresh().then(syncBoot).then(function (changed) {
      if (changed && !sessionStorage.getItem('syncRl')) {
        try { sessionStorage.setItem('syncRl', '1'); } catch (e) {}
        location.reload();
        return;
      }
      try { sessionStorage.removeItem('syncRl'); } catch (e) {}
      finish('☁ Synchronisé');
    }).catch(function (e) {
      if (e && e.auth) { lockMsg('Session expirée, reconnectez-vous.'); showLogin('Session expirée, reconnectez-vous.'); return; }
      finish(e && e.net ? '⚠ Hors ligne — gardé sur cet appareil' : '⚠ Erreur de synchronisation');
    });
  }

  function finish(status) {
    booted = true;
    unlock();
    injectBar(status);
    try { if (readyCb) readyCb(); } catch (e) { if (window.console) console.error(e); }
  }

  function setStatus(t) { if (statusEl) statusEl.textContent = t; }

  function injectBar(status) {
    if ($('syncBar')) return;
    var bar = document.createElement('div');
    bar.id = 'syncBar';
    statusEl = document.createElement('span');
    statusEl.textContent = status;
    var b = document.createElement('button');
    b.textContent = 'Se déconnecter';
    b.onclick = logout;
    bar.appendChild(statusEl);
    bar.appendChild(document.createTextNode(' · '));
    bar.appendChild(b);
    (document.querySelector('.wrap') || document.body).appendChild(bar);
  }

  function logout() {
    var go = function () {
      [KEY, SESS, DIRTY, TS, BAK, 'devisCalcUnlocked'].forEach(lsRm);
      location.reload();
    };
    if (isDirty()) {
      pushNow(false).then(go, function () {
        if (confirm('Des modifications ne sont pas encore envoyées. Se déconnecter les effacera de cet appareil. Continuer ?')) go();
      });
    } else go();
  }

  /* ---------- Retour sur l'appli / envoi avant fermeture ---------- */
  var hiddenAt = 0;
  document.addEventListener('visibilitychange', function () {
    if (!booted) return;
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
      if (isDirty()) pushNow(true).catch(function () {});
    } else if (!isDirty() && loadSession() && Date.now() - hiddenAt > 30000) {
      req('/rest/v1/donnees?select=updated_at&limit=1').then(function (r) { return r.ok ? r.json() : []; }).then(function (rows) {
        var mine = lsGet(TS);
        if (rows.length && mine && Date.parse(rows[0].updated_at) !== Date.parse(mine) && !$('syncBanner')) {
          var d = document.createElement('div');
          d.id = 'syncBanner';
          d.innerHTML = '<span>Données mises à jour depuis un autre appareil.</span>';
          var bt = document.createElement('button');
          bt.textContent = 'Actualiser';
          bt.onclick = function () { location.reload(); };
          d.appendChild(bt);
          document.body.appendChild(d);
        }
      }).catch(function () {});
    }
  });
  window.addEventListener('online', function () {
    if (booted && isDirty()) pushNow(false).catch(function () {});
  });

  /* ---------- API publique ---------- */
  window.Sync = {
    boot: function (onReady) {
      readyCb = onReady;
      lsRm('devisCalcUnlocked'); // ancien code à 4 chiffres, abandonné
      injectStyle();
      if (loadSession()) start(); else showLogin('');
    },
    logout: logout
  };
})();
