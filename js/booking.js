// ===== Booking Form Handler =====
(function(){
  var form = document.getElementById('booking-form');
  if (!form) return;

  var DISCORD_WEBHOOK = 'https://ptb.discord.com/api/webhooks/1521715941711286382/EUFUyR46yHdetx0uE2sbcvjt80y2f16suIPdd1v--MWE6c-0OjqvG4bWDmxuDXAmQtkP';

  function getEl(id) { return document.getElementById(id); }

  function showError(id) {
    var input = getEl(id);
    var err = getEl(id + '-error');
    if (input) input.classList.add('error');
    if (err) err.classList.add('booking-form__field-error--visible');
  }

  function clearError(id) {
    var input = getEl(id);
    var err = getEl(id + '-error');
    if (input) input.classList.remove('error');
    if (err) err.classList.remove('booking-form__field-error--visible');
  }

  function clearAllErrors() {
    ['booking-name','booking-phone','booking-email','booking-concern'].forEach(clearError);
  }

  function validateForm(data) {
    var valid = true;
    clearAllErrors();
    if (!data.name || data.name.trim().length < 2) {
      showError('booking-name');
      valid = false;
    }
    var phoneClean = (data.phone || '').replace(/[\s\-\(\)\.]/g, '');
    if (!phoneClean || phoneClean.length < 7 || !/^[\d\+\-\(\)\s\.]+$/.test(data.phone || '')) {
      showError('booking-phone');
      valid = false;
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      showError('booking-email');
      valid = false;
    }
    if (!data.concern) {
      showError('booking-concern');
      valid = false;
    }
    return valid;
  }

  function buildDiscordPayload(data) {
    var fields = [
      { name: 'Name', value: data.name || 'Not provided', inline: true },
      { name: 'Phone', value: data.phone || 'Not provided', inline: true },
      { name: 'Email', value: data.email || 'Not provided', inline: true },
      { name: 'Concern', value: data.concern || 'Not specified', inline: true },
      { name: 'Preferred Date', value: data.preferredDate || 'Not specified', inline: true },
      { name: 'Preferred Time', value: data.preferredTime || 'Not specified', inline: true }
    ];
    if (data.message && data.message.trim()) {
      fields.push({ name: 'Notes', value: data.message.trim().substring(0, 1024), inline: false });
    }
    return {
      embeds: [
        {
          title: 'Bratton PT — Appointment Request',
          color: 0xB41C2C,
          timestamp: new Date().toISOString(),
          fields: fields,
          footer: { text: 'Submitted via brattonpt.com booking page' }
        }
      ]
    };
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var data = {
      name: (getEl('booking-name') && getEl('booking-name').value || '').trim(),
      phone: (getEl('booking-phone') && getEl('booking-phone').value || '').trim(),
      email: (getEl('booking-email') && getEl('booking-email').value || '').trim(),
      preferredDate: getEl('booking-date') && getEl('booking-date').value || '',
      preferredTime: getEl('booking-time') && getEl('booking-time').value || '',
      concern: getEl('booking-concern') && getEl('booking-concern').value || '',
      message: (getEl('booking-message') && getEl('booking-message').value || '').trim()
    };
    if (!validateForm(data)) return;

    var btn = getEl('booking-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildDiscordPayload(data))
    })
    .then(function(res) {
      if (res.ok || res.status === 204) {
        form.style.display = 'none';
        getEl('booking-success').classList.add('booking-form__success--visible');
      } else {
        throw new Error('Webhook responded with ' + res.status);
      }
    })
    .catch(function() {
      form.style.display = 'none';
      getEl('booking-success').classList.add('booking-form__success--visible');
    })
    .finally(function() {
      btn.disabled = false;
      btn.textContent = 'Request Appointment';
    });
  });

  // Clear errors on input
  ['booking-name','booking-phone','booking-email'].forEach(function(id) {
    var el = getEl(id);
    if (el) el.addEventListener('input', function() { clearError(id); });
  });
  var concernEl = getEl('booking-concern');
  if (concernEl) concernEl.addEventListener('change', function() { clearError('booking-concern'); });
})();
