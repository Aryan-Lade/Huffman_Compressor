const UI = (() => {
  function toast({ type = 'info', title = '', message = '', duration = 3800 } = {}) {
    const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill', warn: 'bi-exclamation-triangle-fill' };
    const node = el('div', { class: `toast ${type}` }, [
      el('i', { class: `bi ${icons[type]} t-ico` }),
      el('div', { class: 't-text' }, [el('strong', { text: title }), message ? el('span', { text: message }) : null]),
      el('button', { class: 'icon-btn', style: 'width:28px;height:28px;background:none;border:none', onClick: () => remove() }, [el('i', { class: 'bi bi-x' })]),
    ]);
    const container = $('#toastContainer');
    container.appendChild(node);
    const remove = () => { node.classList.add('leaving'); setTimeout(() => node.remove(), 300); };
    if (duration) setTimeout(remove, duration);
    return remove;
  }

  function modal({ icon = 'info', iconClass = 'bi-info-circle-fill', title = '', subtitle = '', bodyNode = null, actions = [] } = {}) {
    const root = $('#modalRoot');
    root.innerHTML = '';
    const close = () => { root.classList.remove('show'); setTimeout(() => (root.innerHTML = ''), 250); };

    const actionNodes = actions.map((a) =>
      el('button', { class: `btn ${a.class || 'btn-ghost'}`, onClick: () => { const keep = a.onClick && a.onClick(); if (!keep) close(); } }, [
        a.icon ? el('i', { class: `bi ${a.icon}` }) : null,
        a.label,
      ])
    );

    const modalNode = el('div', { class: 'modal' }, [
      el('div', { class: 'modal-head' }, [
        el('div', { class: `m-ico ${icon}` }, [el('i', { class: `bi ${iconClass}` })]),
        el('div', {}, [el('div', { class: 'm-title', text: title }), subtitle ? el('div', { class: 'm-sub', text: subtitle }) : null]),
        el('button', { class: 'm-close', onClick: close }, [el('i', { class: 'bi bi-x-lg' })]),
      ]),
      bodyNode ? el('div', { class: 'modal-body' }, [bodyNode]) : null,
      actionNodes.length ? el('div', { class: 'modal-actions' }, actionNodes) : null,
    ]);

    root.appendChild(el('div', { class: 'modal-overlay', onClick: close }));
    root.appendChild(modalNode);
    root.classList.add('show');
    return { close, node: modalNode };
  }

  function confirm({ title = 'Are you sure?', subtitle = '', danger = false, confirmLabel = 'Confirm', onConfirm } = {}) {
    return modal({
      icon: danger ? 'danger' : 'info',
      iconClass: danger ? 'bi-exclamation-triangle-fill' : 'bi-question-circle-fill',
      title, subtitle,
      actions: [
        { label: 'Cancel', class: 'btn-ghost' },
        { label: confirmLabel, class: danger ? 'btn-danger' : 'btn-primary', onClick: () => { onConfirm && onConfirm(); } },
      ],
    });
  }

  function attachRipple(root = document) {
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn, .quick-action, .icon-btn');
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = el('span', { class: 'ripple' });
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }

  let openMenu = null;
  function contextMenu(x, y, items) {
    closeContextMenu();
    const menu = el('div', { class: 'context-menu' },
      items.map((it) => it.sep ? el('div', { class: 'sep' }) :
        el('button', { class: it.danger ? 'danger' : '', onClick: () => { it.onClick && it.onClick(); closeContextMenu(); } }, [
          it.icon ? el('i', { class: `bi ${it.icon}` }) : null, it.label,
        ])
      )
    );
    document.body.appendChild(menu);
    const rect = menu.getBoundingClientRect();
    menu.style.left = `${clamp(x, 8, window.innerWidth - rect.width - 8)}px`;
    menu.style.top = `${clamp(y, 8, window.innerHeight - rect.height - 8)}px`;
    openMenu = menu;
  }
  function closeContextMenu() { if (openMenu) { openMenu.remove(); openMenu = null; } }
  document.addEventListener('click', closeContextMenu);
  document.addEventListener('scroll', closeContextMenu, true);

  function successModal({ title = 'Done!', subtitle = '', bodyNode = null, actions = [] }) {
    const check = el('div', { class: 'text-center mb-4', html: `
      <svg class="success-check" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42"/><path d="M30 52 L45 66 L72 36"/></svg>` });
    const wrap = el('div', {}, [check, bodyNode]);
    return modal({ icon: 'success', iconClass: 'bi-check-lg', title, subtitle, bodyNode: wrap, actions });
  }

  return { toast, modal, confirm, attachRipple, contextMenu, closeContextMenu, successModal };
})();
