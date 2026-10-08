/* @ds-bundle: {"format":4,"namespace":"ComproYa","components":[{"name":"Button"},{"name":"Notice"},{"name":"Badge"},{"name":"OrderStatus"},{"name":"Spinner"},{"name":"Skeleton"},{"name":"Field"},{"name":"Checkbox"},{"name":"Tabs"},{"name":"QuantityStepper"},{"name":"CouponField"},{"name":"ShopHeader"},{"name":"CheckoutSteps"},{"name":"AcademicFooter"},{"name":"ProductImage"},{"name":"ProductCard"},{"name":"BranchAvailability"},{"name":"LineItem"},{"name":"OrderSummary"},{"name":"PickupCode"},{"name":"OrderRow"},{"name":"Card"},{"name":"Icon"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;
  var Fragment = React.Fragment;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(' ');
  }
  function omit(obj, keys) {
    var out = {};
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && keys.indexOf(k) < 0) out[k] = obj[k];
    return out;
  }
  var uid = 0;
  function useId(given) {
    var ref = React.useRef(null);
    if (ref.current === null) ref.current = given || 'cy-' + (++uid);
    return ref.current;
  }

  /* Pesos colombianos sin decimales y con separador de miles: $ 1.899.900 */
  function formatCOP(value) {
    var n = Math.round(Number(value) || 0);
    var s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (n < 0 ? '- ' : '') + '$ ' + s;
  }

  /* ---------- Icon: trazo 1.7 sobre 24×24, como el carrito de ShopHeader ---------- */
  var PATHS = {
    cart: ['c:9,20,1.3', 'c:18,20,1.3', 'M2.5 3h2l2.2 11.4a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H5.3'],
    search: ['c:11,11,6.5', 'M20 20l-4.2-4.2'],
    check: ['M5 12.5l4.5 4.5L19 7.5'],
    'check-circle': ['c:12,12,9', 'M8 12.5l2.8 2.8L16.2 9.6'],
    alert: ['c:12,12,9', 'M12 7.5v5.5', 'M12 16.2v.3'],
    warn: ['M12 3.5l9.5 16.5h-19z', 'M12 10v4.5', 'M12 17.2v.3'],
    info: ['c:12,12,9', 'M12 11v5.5', 'M12 7.8v.3'],
    clock: ['c:12,12,9', 'M12 7v5l3.5 2'],
    store: ['M3.5 9.5L5 4h14l1.5 5.5', 'M3.5 9.5h17a3 3 0 0 1-5.7 1.2 3 3 0 0 1-5.6 0 3 3 0 0 1-5.7-1.2z', 'M5 12v8h14v-8', 'M10 20v-5h4v5'],
    user: ['c:12,8,4', 'M4.5 20.5c1.2-3.6 4.1-5.5 7.5-5.5s6.3 1.9 7.5 5.5'],
    package: ['M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z', 'M3.5 7.5L12 12l8.5-4.5', 'M12 12v9'],
    'chevron-left': ['M14.5 5.5L8 12l6.5 6.5'],
    'chevron-right': ['M9.5 5.5L16 12l-6.5 6.5'],
    minus: ['M6 12h12'],
    plus: ['M12 6v12', 'M6 12h12'],
    x: ['M6.5 6.5l11 11', 'M17.5 6.5l-11 11'],
    ticket: ['M3.5 7.5a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v2.5a2 2 0 0 0 0 4v2.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V14a2 2 0 0 0 0-4z', 'M14.5 6.5v11'],
    card: ['M3 6.5h18v11H3z', 'M3 10h18', 'M6.5 14.5h4'],
    bank: ['M3.5 9L12 4l8.5 5', 'M4.5 9.5h15', 'M6 10v7', 'M10 10v7', 'M14 10v7', 'M18 10v7', 'M3.5 19.5h17'],
    receipt: ['M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z', 'M9 8h6', 'M9 11.5h6', 'M9 15h3.5']
  };
  function Icon(props) {
    var name = props.name, size = props.size || 18;
    var parts = PATHS[name] || PATHS.info;
    var kids = parts.map(function (p, i) {
      if (p.indexOf('c:') === 0) {
        var a = p.slice(2).split(',');
        return h('circle', { key: i, cx: a[0], cy: a[1], r: a[2] });
      }
      return h('path', { key: i, d: p });
    });
    return h('svg', {
      className: cx('cy-icon', props.className), width: size, height: size, viewBox: '0 0 24 24',
      fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round',
      'aria-hidden': props.title ? undefined : 'true', role: props.title ? 'img' : undefined, 'aria-label': props.title
    }, kids);
  }

  /* ---------- Spinner y Skeleton ---------- */
  function Spinner(props) {
    return h('span', { className: cx('cy-spinner-wrap', props.className), role: 'status' },
      h('span', { className: 'cy-spinner', 'aria-hidden': 'true' }),
      props.label ? h('span', { className: 'cy-spinner-label' }, props.label) : h('span', { className: 'cy-sr' }, 'Cargando'));
  }
  function Skeleton(props) {
    var variant = props.variant || 'text', count = props.count || 1, items = [];
    for (var i = 0; i < count; i++) {
      if (variant === 'product-card') {
        items.push(h('div', { key: i, className: 'cy-skel-card' },
          h('div', { className: 'cy-skel cy-skel-thumb' }),
          h('div', { className: 'cy-skel cy-skel-line', style: { width: '40%' } }),
          h('div', { className: 'cy-skel cy-skel-line' }),
          h('div', { className: 'cy-skel cy-skel-line', style: { width: '55%' } }),
          h('div', { className: 'cy-skel cy-skel-btn' })));
      } else if (variant === 'line-item') {
        items.push(h('div', { key: i, className: 'cy-skel-li' },
          h('div', { className: 'cy-skel cy-skel-sq' }),
          h('div', { style: { flex: 1 } },
            h('div', { className: 'cy-skel cy-skel-line', style: { width: '60%' } }),
            h('div', { className: 'cy-skel cy-skel-line', style: { width: '30%' } }))));
      } else {
        items.push(h('div', { key: i, className: 'cy-skel cy-skel-line' }));
      }
    }
    return h('div', { className: cx('cy-skeleton', 'cy-skeleton-' + variant, props.className), 'aria-busy': 'true' },
      h('span', { className: 'cy-sr', role: 'status' }, props.label || 'Cargando…'), items);
  }

  /* ---------- Button ---------- */
  function Button(props) {
    var variant = props.variant || 'primary', size = props.size || 'md';
    var rest = omit(props, ['variant', 'size', 'full', 'loading', 'icon', 'iconRight', 'href', 'className', 'children']);
    var inner = [
      props.loading ? h('span', { key: 's', className: 'cy-spinner cy-spinner-btn', 'aria-hidden': 'true' })
        : props.icon ? h(Icon, { key: 'i', name: props.icon }) : null,
      h('span', { key: 'l' }, props.children),
      props.iconRight ? h(Icon, { key: 'r', name: props.iconRight }) : null
    ];
    var cls = cx('cy-btn', 'cy-btn-' + variant, size === 'lg' && 'cy-btn-lg', props.full && 'cy-btn-full', props.className);
    if (props.href && !props.disabled) return h('a', Object.assign({ className: cls, href: props.href }, rest), inner);
    return h('button', Object.assign({ type: 'button', className: cls, 'aria-busy': props.loading ? 'true' : undefined }, rest,
      { disabled: props.disabled || props.loading }), inner);
  }

  /* ---------- Notice: qué pasó + qué hacer + botón ---------- */
  var NOTICE_ICON = { info: 'info', ok: 'check-circle', warn: 'warn', danger: 'alert', progress: null };
  function Notice(props) {
    var tone = props.tone || 'info';
    var urgent = tone === 'danger';
    return h('div', { className: cx('cy-notice', 'cy-notice-' + tone, props.className), role: urgent ? 'alert' : 'status' },
      tone === 'progress' ? h('span', { className: 'cy-spinner', 'aria-hidden': 'true' }) : h(Icon, { name: NOTICE_ICON[tone] }),
      h('div', { className: 'cy-notice-body' },
        props.title ? h('p', { className: 'cy-notice-title' }, props.title) : null,
        props.children ? h('div', { className: 'cy-notice-text' }, props.children) : null,
        props.action ? h('div', { className: 'cy-notice-actions' }, props.action) : null));
  }

  /* ---------- Badge y OrderStatus ---------- */
  function Badge(props) {
    var tone = props.tone || 'neutral';
    return h('span', { className: cx('cy-badge', 'cy-badge-' + tone, props.className) },
      props.icon ? h(Icon, { name: props.icon, size: 14 }) : h('span', { className: 'cy-badge-dot', 'aria-hidden': 'true' }),
      props.children);
  }
  var ORDER_STATUS = {
    'creado': { label: 'Creado, pendiente de pago', tone: 'warn', icon: 'clock' },
    'pagado': { label: 'Pagado', tone: 'info', icon: 'check' },
    'en-alistamiento': { label: 'En alistamiento', tone: 'info', icon: 'package' },
    'listo-para-retiro': { label: 'Listo para retiro', tone: 'ok', icon: 'store' },
    'entregado': { label: 'Entregado', tone: 'neutral', icon: 'check-circle' },
    'cancelado': { label: 'Cancelado', tone: 'neutral', icon: 'x' },
    'pago-fallido': { label: 'Pago fallido', tone: 'danger', icon: 'alert' }
  };
  function OrderStatus(props) {
    var s = ORDER_STATUS[props.status] || ORDER_STATUS['creado'];
    return h(Badge, { tone: s.tone, icon: s.icon, className: props.className }, s.label);
  }

  /* ---------- Field y Checkbox ---------- */
  function Field(props) {
    var id = useId(props.id);
    var hintId = id + '-hint', errId = id + '-err';
    var described = cx(props.hint && hintId, props.error && errId) || undefined;
    var control;
    var common = { id: id, 'aria-invalid': props.error ? 'true' : undefined, 'aria-describedby': described, className: 'cy-input' };
    var rest = omit(props, ['id', 'label', 'hint', 'error', 'options', 'as', 'className', 'optional']);
    if (props.as === 'select') {
      control = h('select', Object.assign({}, rest, common),
        (props.options || []).map(function (o) {
          return h('option', { key: o.value, value: o.value, disabled: o.disabled }, o.label);
        }));
    } else {
      control = h('input', Object.assign({ type: 'text' }, rest, common));
    }
    return h('div', { className: cx('cy-field', props.error && 'cy-field-error', props.className) },
      h('label', { htmlFor: id, className: 'cy-label' }, props.label,
        props.optional ? h('span', { className: 'cy-optional' }, ' (opcional)') : null),
      control,
      props.hint ? h('p', { id: hintId, className: 'cy-hint' }, props.hint) : null,
      props.error ? h('p', { id: errId, className: 'cy-error' }, h(Icon, { name: 'alert', size: 16 }), props.error) : null);
  }
  function Checkbox(props) {
    var id = useId(props.id);
    var rest = omit(props, ['id', 'label', 'className', 'error']);
    return h('div', { className: cx('cy-check', props.className) },
      h('input', Object.assign({ type: 'checkbox', id: id, 'aria-invalid': props.error ? 'true' : undefined }, rest)),
      h('label', { htmlFor: id }, props.label),
      props.error ? h('p', { className: 'cy-error' }, h(Icon, { name: 'alert', size: 16 }), props.error) : null);
  }

  /* ---------- Tabs (método de pago) ---------- */
  function Tabs(props) {
    var items = props.items || [];
    return h('div', { className: cx('cy-tabs', props.className), role: 'tablist', 'aria-label': props.label },
      items.map(function (it) {
        var active = it.id === props.value;
        return h('button', {
          key: it.id, type: 'button', role: 'tab', 'aria-selected': active ? 'true' : 'false',
          className: cx('cy-tab', active && 'cy-tab-active'),
          onClick: function () { if (props.onChange) props.onChange(it.id); }
        }, it.icon ? h(Icon, { name: it.icon }) : null, it.label);
      }));
  }

  /* ---------- QuantityStepper ---------- */
  function QuantityStepper(props) {
    var value = props.value || 1, min = props.min == null ? 1 : props.min, max = props.max;
    function set(v) { if (props.onChange) props.onChange(v); }
    return h('div', { className: cx('cy-stepper', props.className), role: 'group', 'aria-label': props.label || 'Cantidad' },
      h('button', { type: 'button', 'aria-label': 'Disminuir cantidad', disabled: value <= min, onClick: function () { set(value - 1); } }, h(Icon, { name: 'minus', size: 16 })),
      h('span', { 'aria-live': 'polite' }, value),
      h('button', { type: 'button', 'aria-label': 'Aumentar cantidad', disabled: max != null && value >= max, onClick: function () { set(value + 1); } }, h(Icon, { name: 'plus', size: 16 })));
  }

  /* ---------- CouponField: un solo mensaje a la vez ---------- */
  function CouponField(props) {
    var status = props.status || 'idle';
    var id = useId(props.id);
    var msgId = id + '-msg';
    var msg = null;
    if (status === 'applied') msg = h('p', { id: msgId, className: 'cy-coupon-ok', role: 'status' }, h(Icon, { name: 'check-circle', size: 16 }), props.appliedText || 'Cupón aplicado.');
    else if (status === 'invalid') msg = h('p', { id: msgId, className: 'cy-error', role: 'alert' }, h(Icon, { name: 'alert', size: 16 }), props.errorText || 'Ese cupón no es válido o ya venció. Revisa el código o continúa sin cupón.');
    else msg = h('p', { id: msgId, className: 'cy-hint' }, 'Cada cupón se usa una sola vez por pedido.');
    return h('div', { className: cx('cy-coupon', props.className) },
      h('label', { htmlFor: id, className: 'cy-label' }, 'Cupón de lealtad', h('span', { className: 'cy-optional' }, ' (opcional)')),
      h('div', { className: 'cy-coupon-row' },
        h('input', {
          id: id, className: 'cy-input', placeholder: 'Escribe tu código', value: props.value, autoComplete: 'off',
          'aria-invalid': status === 'invalid' ? 'true' : undefined, 'aria-describedby': msgId,
          readOnly: status === 'applied', onChange: function (e) { if (props.onChange) props.onChange(e.target.value); }
        }),
        status === 'applied'
          ? h(Button, { variant: 'secondary', onClick: props.onRemove }, 'Quitar')
          : h(Button, { variant: 'secondary', loading: status === 'checking', disabled: !props.value, onClick: props.onApply }, status === 'checking' ? 'Validando…' : 'Aplicar')),
      msg);
  }

  /* ---------- ShopHeader: la misma cabecera en todo el flujo ---------- */
  function BrandLink(props) {
    return h('a', { className: 'cy-brand', href: props.href || '/', 'aria-label': 'ComproYa, ir al catálogo' },
      h('span', { className: 'cy-brand-mark', 'aria-hidden': 'true' }, 'CY'), h('span', null, 'ComproYa'));
  }
  var NAV = [
    { id: 'catalogo', label: 'Catálogo', href: '/', icon: 'search' },
    { id: 'carrito', label: 'Carrito', href: '/carrito', icon: 'cart' },
    { id: 'pedidos', label: 'Mis pedidos', href: '/pedidos', icon: 'receipt' },
    { id: 'cuenta', label: 'Mi cuenta', href: '/privacidad', icon: 'user' }
  ];
  function ShopHeader(props) {
    var compact = props.variant === 'compact';
    var count = props.cartCount || 0;
    var nav = h('nav', { className: 'cy-nav', 'aria-label': 'Secciones de la tienda' },
      NAV.map(function (n) {
        var label = n.id === 'carrito' && count > 0 ? n.label + ' (' + count + ')' : n.label;
        return h('a', { key: n.id, href: n.href, className: cx('cy-nav-link', props.active === n.id && 'cy-nav-active'), 'aria-current': props.active === n.id ? 'page' : undefined },
          h(Icon, { name: n.icon, size: 16 }), label);
      }));
    var account = props.customerName
      ? h('div', { className: 'cy-account' },
          h('span', null, 'Hola, ', h('strong', null, props.customerName)),
          h('a', { href: props.logoutHref || '#', className: 'cy-link' }, 'Cerrar sesión'))
      : h(Button, { variant: 'secondary', href: '/ingresar', icon: 'user' }, 'Iniciar sesión');
    var cart = h('a', { href: '/carrito', className: 'cy-cart-btn' },
      h(Icon, { name: 'cart' }),
      h('span', null, count > 0 ? 'Carrito (' + count + ') · ' + formatCOP(props.cartTotal) : 'Carrito'));
    return h('header', { className: cx('cy-header', compact && 'cy-header-compact', props.className) },
      compact ? null : h('div', { className: 'cy-utility' },
        h('span', null, 'Compra en línea y retira en sucursal'),
        props.branchesWithPickup != null ? h('span', { className: 'cy-utility-ok' }, h('span', { className: 'cy-badge-dot', 'aria-hidden': 'true' }), props.branchesWithPickup + ' sucursales con retiro disponible') : null),
      h('div', { className: 'cy-header-main' },
        h(BrandLink, null),
        compact ? null : h('form', { className: 'cy-search', role: 'search', onSubmit: function (e) { e.preventDefault(); if (props.onSearch) props.onSearch(e.target.elements.q.value); } },
          h('label', { htmlFor: 'cy-q', className: 'cy-sr' }, 'Buscar productos'),
          h('input', { id: 'cy-q', name: 'q', placeholder: 'Buscar productos', defaultValue: props.query }),
          h('button', { type: 'submit' }, h(Icon, { name: 'search', size: 16 }), h('span', null, 'Buscar'))),
        h('div', { className: 'cy-header-actions' }, account, cart)),
      nav);
  }

  /* ---------- CheckoutSteps: 4 pasos, mismo nombre que el título de cada pantalla ---------- */
  var STEPS = ['Carrito', 'Confirmar pedido', 'Pago', 'Comprobante'];
  function CheckoutSteps(props) {
    var current = props.current || 1;
    return h('div', { className: cx('cy-steps-wrap', props.className) },
      props.back ? h('a', { className: 'cy-back', href: props.back.href }, h(Icon, { name: 'chevron-left', size: 16 }), props.back.label) : null,
      h('p', { className: 'cy-steps-mobile' }, 'Paso ' + current + ' de 4 · ', h('strong', null, STEPS[current - 1])),
      h('ol', { className: 'cy-steps', 'aria-label': 'Progreso de la compra' },
        STEPS.map(function (s, i) {
          var n = i + 1, state = n < current ? 'done' : n === current ? 'current' : 'todo';
          return h('li', { key: s, className: 'cy-step cy-step-' + state, 'aria-current': state === 'current' ? 'step' : undefined },
            h('span', { className: 'cy-step-num', 'aria-hidden': 'true' }, state === 'done' ? h(Icon, { name: 'check', size: 14 }) : n),
            h('span', { className: 'cy-step-label' }, s, state === 'done' ? h('span', { className: 'cy-sr' }, ' (completado)') : null));
        })));
  }

  /* ---------- AcademicFooter: aviso obligatorio, texto literal ---------- */
  function AcademicFooter(props) {
    return h('footer', { className: cx('cy-footer', props.className) },
      h('nav', { className: 'cy-footer-links', 'aria-label': 'Ayuda' },
        h('a', { href: '/pedidos' }, 'Mis pedidos'),
        h('a', { href: '/privacidad' }, 'Privacidad y consentimiento'),
        h('a', { href: props.pickupHelpHref || '#retiro' }, 'Cómo funciona el retiro')),
      h('p', null, '© 2026 ComproYa. Todos los derechos reservados.'),
      h('p', null, 'Proyecto académico — Ingeniería de Software II, Universidad Central. Sin fines comerciales. Las imágenes de producto pertenecen a sus respectivos titulares.'));
  }

  /* ---------- ProductImage: nunca una imagen rota ---------- */
  function ProductImage(props) {
    var _s = React.useState(false), failed = _s[0], setFailed = _s[1];
    var size = props.size || 'card';
    if (!props.src || failed) {
      return h('div', { className: cx('cy-pimg', 'cy-pimg-' + size, 'cy-pimg-empty', props.className), role: 'img', 'aria-label': 'Sin foto: ' + (props.alt || 'producto') },
        h(Icon, { name: 'package', size: size === 'thumb' ? 22 : 36 }),
        size === 'thumb' ? null : h('span', null, props.category || 'Sin foto'));
    }
    return h('div', { className: cx('cy-pimg', 'cy-pimg-' + size, props.className) },
      h('img', { src: props.src, alt: props.alt || '', loading: 'lazy', onError: function () { setFailed(true); } }));
  }

  /* ---------- ProductCard ---------- */
  function ProductCard(props) {
    var state = props.state || 'idle';
    return h('article', { className: cx('cy-pcard', props.className) },
      h('a', { href: props.href || '#', className: 'cy-pcard-link' },
        h(ProductImage, { src: props.image, alt: props.name, category: props.category }),
        h('span', { className: 'cy-pcard-cat' }, props.category),
        h('h3', { className: 'cy-pcard-name' }, props.name)),
      h('p', { className: 'cy-pcard-price' }, formatCOP(props.price)),
      h(Button, { variant: 'primary', full: true, icon: 'cart', loading: state === 'adding', onClick: props.onAdd }, state === 'adding' ? 'Agregando…' : 'Agregar al carrito'),
      state === 'added' ? h('p', { className: 'cy-pcard-added', role: 'status' }, h(Icon, { name: 'check-circle', size: 16 }),
        h('span', null, 'Producto agregado al carrito. Elige la sucursal de retiro al confirmar el pedido. ', h('a', { href: '/carrito', className: 'cy-link' }, 'Ver carrito'))) : null,
      state === 'error' ? h('p', { className: 'cy-error', role: 'alert' }, h(Icon, { name: 'alert', size: 16 }), 'No pudimos agregar el producto. Inténtalo de nuevo.') : null);
  }

  /* ---------- BranchAvailability: sucursal por nombre, motivo cuando no hay retiro ---------- */
  function BranchAvailability(props) {
    var branches = props.branches || [];
    return h('div', { className: cx('cy-branches', props.className) },
      h('div', { className: 'cy-branch cy-branch-head', 'aria-hidden': 'true' },
        h('span', null, 'Sucursal'), h('span', null, 'Unidades disponibles'), h('span', null, 'Retiro'), h('span', null)),
      h('ul', { className: 'cy-branch-list' },
        branches.map(function (b, i) {
          var picked = props.selectedId != null && props.selectedId === b.id;
          return h('li', { key: b.id || i, className: cx('cy-branch', !b.canPickup && 'cy-branch-off') },
            h('span', { className: 'cy-branch-name' }, h(Icon, { name: 'store', size: 16 }), h('span', null, h('strong', null, b.name), b.city ? ', ' + b.city : '')),
            h('span', { className: 'cy-branch-units' }, b.units + (b.units === 1 ? ' unidad disponible' : ' unidades disponibles')),
            h('span', { className: 'cy-branch-status' }, b.canPickup
              ? h(Badge, { tone: 'ok', icon: 'check' }, 'Disponible para retiro')
              : h(Fragment, null, h(Badge, { tone: 'neutral', icon: 'clock' }, 'Sin retiro por ahora'),
                  h('span', { className: 'cy-branch-reason' }, 'Sin información actualizada hace más de 15 minutos'))),
            h('span', { className: 'cy-branch-action' }, b.canPickup
              ? (picked
                  ? h('span', { className: 'cy-coupon-ok', role: 'status' }, h(Icon, { name: 'check-circle', size: 16 }), 'En tu carrito para esta sucursal')
                  : h(Button, { variant: 'primary', onClick: function () { if (props.onPickup) props.onPickup(b); } }, 'Retirar aquí'))
              : null));
        })),
      h('p', { className: 'cy-branch-rule' }, h(Icon, { name: 'info', size: 16 }),
        'Si una sucursal lleva más de 15 minutos sin actualizar su información, no ofrece retiro hasta que se actualice.'));
  }

  /* ---------- LineItem ---------- */
  function LineItem(props) {
    return h('div', { className: cx('cy-li', props.className) },
      h(ProductImage, { src: props.image, alt: props.name, size: 'thumb' }),
      h('div', { className: 'cy-li-info' },
        h('p', { className: 'cy-li-name' }, props.name),
        h('p', { className: 'cy-li-unit' }, formatCOP(props.unitPrice) + ' cada uno'),
        props.branch ? h('p', { className: 'cy-li-unit' }, 'Retiro en ' + props.branch) : null),
      h('div', { className: 'cy-li-controls' },
        props.readOnly
          ? h('span', { className: 'cy-li-qty' }, props.quantity + (props.quantity === 1 ? ' unidad' : ' unidades'))
          : h(QuantityStepper, { value: props.quantity, max: props.max, onChange: props.onQuantity, label: 'Cantidad de ' + props.name }),
        h('p', { className: 'cy-li-total' }, formatCOP(props.unitPrice * props.quantity)),
        props.readOnly ? null : h('button', { type: 'button', className: 'cy-link cy-li-remove', onClick: props.onRemove }, 'Quitar')));
  }

  /* ---------- OrderSummary: muestra lo que devuelve el servidor, sin recalcular ---------- */
  function OrderSummary(props) {
    return h('section', { className: cx('cy-summary', props.className), 'aria-label': props.title || 'Resumen del pedido' },
      h('h2', { className: 'cy-summary-title' }, props.title || 'Resumen del pedido'),
      h('div', { className: 'cy-sum-row' }, h('span', null, 'Subtotal' + (props.itemsCount ? ' (' + props.itemsCount + (props.itemsCount === 1 ? ' producto)' : ' productos)') : '')), h('span', null, formatCOP(props.subtotal))),
      props.discount ? h('div', { className: 'cy-sum-row cy-sum-discount' }, h('span', null, props.discountLabel || 'Descuento por cupón'), h('span', null, '- ' + formatCOP(props.discount).slice(0))) : null,
      h('div', { className: 'cy-sum-row cy-sum-total' }, h('span', null, props.totalLabel || 'Total'), h('span', null, formatCOP(props.total))),
      props.children ? h('div', { className: 'cy-summary-actions' }, props.children) : null);
  }

  /* ---------- PickupCode ---------- */
  function PickupCode(props) {
    return h('section', { className: cx('cy-pickup', props.className), 'aria-label': 'Tu código de retiro' },
      h('p', { className: 'cy-pickup-label' }, 'Tu código de retiro'),
      h('p', { className: 'cy-pickup-code' }, props.code),
      h('p', { className: 'cy-pickup-rule' }, h(Icon, { name: 'clock', size: 16 }),
        h('span', null, 'Vence el ', h('strong', null, props.expiresOn), ' (5 días calendario). Se puede usar una sola vez.')),
      props.branch ? h('p', { className: 'cy-pickup-branch' }, h(Icon, { name: 'store', size: 16 }),
        h('span', null, 'Retira en ', h('strong', null, props.branch), props.city ? ', ' + props.city : '')) : null);
  }

  /* ---------- OrderRow: estado + siguiente acción ---------- */
  var CANCELLABLE = { 'creado': true, 'pagado': true };
  function OrderRow(props) {
    var st = props.status;
    var actions = [];
    if (st === 'creado' || st === 'pago-fallido') actions.push(h(Button, { key: 'pay', variant: 'primary', href: props.payHref }, 'Pagar'));
    if (st === 'pagado' || st === 'en-alistamiento' || st === 'listo-para-retiro') actions.push(h(Button, { key: 'rc', variant: st === 'listo-para-retiro' ? 'primary' : 'secondary', href: props.receiptHref, icon: 'receipt' }, 'Ver comprobante y código de retiro'));
    if (CANCELLABLE[st]) actions.push(h(Button, { key: 'cancel', variant: 'danger', onClick: props.onCancel }, 'Cancelar pedido'));
    var note = props.note;
    if (!note && st === 'en-alistamiento') note = 'Este pedido ya está en alistamiento y no se puede cancelar.';
    if (!note && st === 'creado' && props.reservedUntil) note = 'Tus unidades están reservadas hasta las ' + props.reservedUntil + '.';
    return h('article', { className: cx('cy-order', props.className) },
      h('div', { className: 'cy-order-head' },
        h('h3', { className: 'cy-order-num' }, 'Pedido #' + props.number),
        h(OrderStatus, { status: st })),
      h('dl', { className: 'cy-order-meta' },
        h('div', null, h('dt', null, 'Fecha'), h('dd', null, props.date)),
        h('div', null, h('dt', null, 'Retiro'), h('dd', null, props.branch)),
        h('div', null, h('dt', null, 'Total'), h('dd', null, formatCOP(props.total)))),
      props.reason ? h('p', { className: 'cy-order-reason' }, h(Icon, { name: 'info', size: 16 }), props.reason) : null,
      note ? h('p', { className: 'cy-order-note' }, note) : null,
      actions.length ? h('div', { className: 'cy-order-actions' }, actions) : null);
  }

  /* ---------- Card ---------- */
  function Card(props) {
    return h('section', { className: cx('cy-card', props.className) },
      props.title ? h('div', { className: 'cy-card-head' }, h('h2', { className: 'cy-card-title' }, props.title), props.aside || null) : null,
      props.children);
  }

  var api = {
    Button: Button, Notice: Notice, Badge: Badge, OrderStatus: OrderStatus, Spinner: Spinner, Skeleton: Skeleton,
    Field: Field, Checkbox: Checkbox, Tabs: Tabs, QuantityStepper: QuantityStepper, CouponField: CouponField,
    ShopHeader: ShopHeader, CheckoutSteps: CheckoutSteps, AcademicFooter: AcademicFooter,
    ProductImage: ProductImage, ProductCard: ProductCard, BranchAvailability: BranchAvailability,
    LineItem: LineItem, OrderSummary: OrderSummary, PickupCode: PickupCode, OrderRow: OrderRow,
    Card: Card, Icon: Icon, formatCOP: formatCOP, ORDER_STATUS: ORDER_STATUS
  };
  window.ComproYa = Object.assign(window.ComproYa || {}, api);
})();
