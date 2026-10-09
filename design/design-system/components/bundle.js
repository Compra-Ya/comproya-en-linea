/* @ds-bundle: {"format":4,"namespace":"ComproYa","components":[{"name":"Button"},{"name":"IconButton"},{"name":"Tooltip"},{"name":"InfoTip"},{"name":"Notice"},{"name":"AddedToCart"},{"name":"Badge"},{"name":"OrderStatus"},{"name":"Spinner"},{"name":"Skeleton"},{"name":"EmptyState"},{"name":"Field"},{"name":"Checkbox"},{"name":"QuantityStepper"},{"name":"CouponField"},{"name":"ShopHeader"},{"name":"CheckoutSteps"},{"name":"Breadcrumbs"},{"name":"AcademicFooter"},{"name":"ProductImage"},{"name":"ProductCard"},{"name":"CategoryCard"},{"name":"CategoryCarousel"},{"name":"LineItem"},{"name":"OrderSummary"},{"name":"ShippingSummary"},{"name":"OrderRow"},{"name":"Card"},{"name":"Icon"}]} */
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
  function reducedMotion() {
    try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }

  /* Pesos colombianos sin decimales y con punto de miles: $ 1.899.900 */
  function formatCOP(value) {
    var n = Math.round(Number(value) || 0);
    var s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (n < 0 ? '- ' : '') + '$ ' + s;
  }
  function units(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  /* ---------- Icon: línea 24×24, trazo 1,7, puntas redondeadas ---------- */
  var PATHS = {
    'cart': ['c:9,20,1.3', 'c:18,20,1.3', 'M2.5 3h2l2.2 11.4a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H5.3'],
    'cart-plus': ['c:9,20,1.3', 'c:18,20,1.3', 'M2.5 3h2l2.2 11.4a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H5.3', 'M13.5 8.5v5', 'M11 11h5'],
    'trash': ['M4 7h16', 'M9.5 7V4.5h5V7', 'M6.5 7l1 12.5a1 1 0 0 0 1 .9h7a1 1 0 0 0 1-.9l1-12.5', 'M10.3 11v5.5', 'M13.7 11v5.5'],
    'truck': ['M2.5 6.5h11v9h-11z', 'M13.5 9.5h4l3 3.5v2.5h-7', 'c:6.5,17.5,1.8', 'c:16.5,17.5,1.8'],
    'package': ['M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z', 'M3.5 7.5L12 12l8.5-4.5', 'M12 12v9', 'M7.8 5.3l8.5 4.5'],
    'card': ['M3 6h18v12H3z', 'M3 10h18', 'M6.5 14.5h4'],
    'ticket': ['M3.5 7.5a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v2.5a2 2 0 0 0 0 4v2.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V14a2 2 0 0 0 0-4z', 'M14.5 6.5v2', 'M14.5 11v2', 'M14.5 15.5v2'],
    'clock': ['c:12,12,9', 'M12 7v5l3.5 2'],
    'receipt': ['M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z', 'M9 8h6', 'M9 11.5h6', 'M9 15h3.5'],
    'map-pin': ['M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z', 'c:12,10,2.4'],
    'info': ['c:12,12,9', 'M12 11v5.5', 'M12 7.8v.3'],
    'alert': ['c:12,12,9', 'M12 7.5v5.5', 'M12 16.2v.3'],
    'warn': ['M12 3.5l9.5 16.5h-19z', 'M12 10v4.5', 'M12 17.2v.3'],
    'check-circle': ['c:12,12,9', 'M8 12.5l2.8 2.8L16.2 9.6'],
    'check': ['M5 12.5l4.5 4.5L19 7.5'],
    'search': ['c:11,11,6.5', 'M20 20l-4.2-4.2'],
    'user': ['c:12,8,4', 'M4.5 20.5c1.2-3.6 4.1-5.5 7.5-5.5s6.3 1.9 7.5 5.5'],
    'grid': ['M4 4h6.5v6.5H4z', 'M13.5 4H20v6.5h-6.5z', 'M4 13.5h6.5V20H4z', 'M13.5 13.5H20V20h-6.5z'],
    'home': ['M3.5 11L12 4l8.5 7', 'M5.5 9.5V20h13V9.5', 'M10 20v-5.5h4V20'],
    'lock': ['M5.5 10.5h13v10h-13z', 'M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3', 'M12 14.5v2.5'],
    'shield': ['M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z', 'M8.8 12l2.3 2.3 4.3-4.6'],
    'phone': ['M6.5 3.5h3l1.5 4.5-2 1.3a11 11 0 0 0 5.7 5.7l1.3-2 4.5 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z'],
    'help': ['c:12,12,9', 'M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6', 'M12 16.8v.3'],
    'chevron-left': ['M14.5 5.5L8 12l6.5 6.5'],
    'chevron-right': ['M9.5 5.5L16 12l-6.5 6.5'],
    'chevron-down': ['M5.5 9.5L12 16l6.5-6.5'],
    'arrow-right': ['M4.5 12h15', 'M13.5 6l6 6-6 6'],
    'arrow-left': ['M19.5 12h-15', 'M10.5 6l-6 6 6 6'],
    'refresh': ['M19.5 12a7.5 7.5 0 1 1-2.2-5.3', 'M19.5 4.5v4.5H15'],
    'minus': ['M6 12h12'],
    'plus': ['M12 6v12', 'M6 12h12'],
    'x': ['M6.5 6.5l11 11', 'M17.5 6.5l-11 11'],
    'pause': ['M8.5 6v12', 'M15.5 6v12'],
    'play': ['M8 5.5v13l10.5-6.5z'],
    'logout': ['M14 4.5h4.5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H14', 'M9.5 8l-4 4 4 4', 'M5.5 12h10'],
    'smile': ['c:12,12,9', 'M8.5 14a4.2 4.2 0 0 0 7 0', 'M9 9.5v.3', 'M15 9.5v.3']
  };
  var ICON_NAMES = Object.keys(PATHS);
  function Icon(props) {
    var size = props.size || 20;
    var parts = PATHS[props.name] || PATHS.info;
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
      'aria-hidden': props.title ? undefined : 'true', role: props.title ? 'img' : undefined, 'aria-label': props.title, focusable: 'false'
    }, kids);
  }

  /* ---------- Tooltip: al pasar el mouse y al enfocar con teclado; Esc lo cierra ---------- */
  function Tooltip(props) {
    var id = useId(props.id);
    var _s = React.useState(false), hidden = _s[0], setHidden = _s[1];
    var child = React.Children.only(props.children);
    var describe = props.describe !== false;
    var trigger = React.cloneElement(child, describe ? { 'aria-describedby': cx(child.props['aria-describedby'], id) } : {});
    return h('span', {
      className: cx('cy-tip-wrap', props.block && 'cy-tip-block', props.open && 'cy-tip-forced', hidden && 'cy-tip-hidden', props.className),
      onKeyDown: function (e) { if (e.key === 'Escape') setHidden(true); },
      onMouseLeave: function () { setHidden(false); }, onBlur: function () { setHidden(false); }
    },
      trigger,
      h('span', { id: id, role: 'tooltip', className: cx('cy-tip', 'cy-tip-' + (props.placement || 'top'), props.align === 'end' && 'cy-tip-end', props.align === 'start' && 'cy-tip-start'), 'aria-hidden': describe ? undefined : 'true' }, props.label));
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
      } else if (variant === 'category') {
        items.push(h('div', { key: i, className: 'cy-skel-cat' },
          h('div', { className: 'cy-skel cy-skel-circle' }),
          h('div', { className: 'cy-skel cy-skel-line', style: { width: '70%', margin: '8px auto 0' } })));
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
    var rest = omit(props, ['variant', 'size', 'full', 'loading', 'icon', 'iconRight', 'href', 'className', 'children', 'disabledReason', 'tooltip', 'tooltipOpen']);
    var inner = [
      props.loading ? h('span', { key: 's', className: 'cy-spinner cy-spinner-btn', 'aria-hidden': 'true' })
        : props.icon ? h(Icon, { key: 'i', name: props.icon }) : null,
      h('span', { key: 'l' }, props.children),
      props.iconRight ? h(Icon, { key: 'r', name: props.iconRight }) : null
    ];
    var cls = cx('cy-btn', 'cy-btn-' + variant, size === 'lg' && 'cy-btn-lg', size === 'sm' && 'cy-btn-sm', props.full && 'cy-btn-full', props.className);
    var el;
    if (props.href && !props.disabled) el = h('a', Object.assign({ className: cls, href: props.href }, rest), inner);
    else el = h('button', Object.assign({ type: 'button', className: cls, 'aria-busy': props.loading ? 'true' : undefined }, rest,
      { disabled: props.disabled || props.loading }), inner);
    if (props.tooltip) el = h(Tooltip, { label: props.tooltip, open: props.tooltipOpen, block: props.full }, el);
    if (props.disabled && props.disabledReason) {
      return h('div', { className: cx('cy-btn-with-reason', props.full && 'cy-btn-full') }, el,
        h('p', { className: 'cy-btn-reason' }, h(Icon, { name: 'info', size: 16 }), props.disabledReason));
    }
    return el;
  }

  /* ---------- IconButton: solo ícono, siempre con nombre accesible y tooltip ---------- */
  function IconButton(props) {
    var rest = omit(props, ['icon', 'label', 'tooltip', 'tooltipOpen', 'placement', 'align', 'variant', 'className', 'size']);
    var btn = h('button', Object.assign({ type: 'button', className: cx('cy-iconbtn', 'cy-iconbtn-' + (props.variant || 'secondary'), props.size === 'sm' && 'cy-iconbtn-sm', props.className), 'aria-label': props.label }, rest),
      h(Icon, { name: props.icon }));
    return h(Tooltip, { label: props.tooltip || props.label, open: props.tooltipOpen, placement: props.placement, align: props.align, describe: false }, btn);
  }

  /* ---------- InfoTip: término dudoso con su explicación en una línea ---------- */
  function InfoTip(props) {
    return h('span', { className: cx('cy-infotip', props.className) },
      props.children ? h('span', null, props.children) : null,
      h(Tooltip, { label: props.tip, open: props.open, placement: props.placement },
        h('button', { type: 'button', className: 'cy-infotip-btn', 'aria-label': '¿Qué es ' + (props.term || 'esto') + '?' }, h(Icon, { name: 'help', size: 16 }))));
  }

  /* ---------- Notice: qué pasó + qué hacer + botón ---------- */
  var NOTICE_ICON = { info: 'info', ok: 'check-circle', warn: 'warn', danger: 'alert', progress: null, test: 'card' };
  function Notice(props) {
    var tone = props.tone || 'info';
    return h('div', { className: cx('cy-notice', 'cy-notice-' + tone, props.className), role: tone === 'danger' ? 'alert' : 'status' },
      tone === 'progress' ? h('span', { className: 'cy-spinner', 'aria-hidden': 'true' }) : h(Icon, { name: props.icon || NOTICE_ICON[tone] }),
      h('div', { className: 'cy-notice-body' },
        props.title ? h('p', { className: 'cy-notice-title' }, props.title) : null,
        props.children ? h('div', { className: 'cy-notice-text' }, props.children) : null,
        props.progress ? h('div', { className: 'cy-progress', role: 'progressbar', 'aria-label': props.title || 'Progreso' }, h('span', null)) : null,
        props.action ? h('div', { className: 'cy-notice-actions' }, props.action) : null));
  }

  /* ---------- AddedToCart: confirmación junto al botón que la provocó ---------- */
  function AddedToCart(props) {
    var q = props.quantity || 1;
    return h('div', { className: cx('cy-added', props.compact && 'cy-added-compact', props.className), role: 'status' },
      h('p', { className: 'cy-added-title' }, h(Icon, { name: 'check-circle', size: 18 }),
        h('span', null, 'Agregamos ' + units(q, 'unidad', 'unidades') + ' a tu carrito')),
      h('div', { className: 'cy-added-actions' },
        h(Button, { variant: 'secondary', size: 'sm', href: props.cartHref || '/carrito', icon: 'cart' }, 'Ver carrito'),
        h(Button, { variant: 'ghost', size: 'sm', onClick: props.onContinue, href: props.continueHref }, 'Seguir comprando')));
  }

  /* ---------- Badge y OrderStatus ---------- */
  function Badge(props) {
    var tone = props.tone || 'neutral';
    return h('span', { className: cx('cy-badge', 'cy-badge-' + tone, props.className) },
      props.icon ? h(Icon, { name: props.icon, size: 14 }) : h('span', { className: 'cy-badge-dot', 'aria-hidden': 'true' }),
      props.children);
  }
  var ORDER_STATUS = {
    'creado': { label: 'Pendiente de pago', tone: 'warn', icon: 'clock', explain: 'Creaste el pedido y falta pagarlo con tarjeta.' },
    'pagado': { label: 'Pagado', tone: 'info', icon: 'check', explain: 'Recibimos tu pago. Pronto empezamos a alistar tu pedido.' },
    'en-alistamiento': { label: 'En alistamiento', tone: 'info', icon: 'package', explain: 'Estamos preparando tu pedido para enviarlo.' },
    'entregado': { label: 'Entregado', tone: 'ok', icon: 'check-circle', explain: 'Tu pedido llegó a la dirección de envío.' },
    'cancelado': { label: 'Cancelado', tone: 'neutral', icon: 'x', explain: 'Este pedido se canceló y no se cobró.' },
    'pago-fallido': { label: 'Pago fallido', tone: 'danger', icon: 'alert', explain: 'El pago con tarjeta no se completó.' }
  };
  function OrderStatus(props) {
    var s = ORDER_STATUS[props.status] || ORDER_STATUS['creado'];
    return h(Badge, { tone: s.tone, icon: s.icon, className: props.className }, s.label);
  }

  /* ---------- EmptyState: ilustración sencilla + qué hacer ---------- */
  function EmptyState(props) {
    return h('div', { className: cx('cy-empty', props.className) },
      props.imageSrc ? h('img', { className: 'cy-empty-img', src: props.imageSrc, alt: '' })
        : h('div', { className: 'cy-empty-art', 'aria-hidden': 'true' }, h(Icon, { name: props.icon || 'cart', size: 44 })),
      h('h2', { className: 'cy-empty-title' }, props.title),
      props.text ? h('p', { className: 'cy-empty-text' }, props.text) : null,
      (props.action || props.children) ? h('div', { className: 'cy-empty-actions' }, props.action, props.children) : null);
  }

  /* ---------- Field (input, select, textarea) y Checkbox ---------- */
  function Field(props) {
    var id = useId(props.id);
    var hintId = id + '-hint', errId = id + '-err';
    var described = cx(props.hint && hintId, props.error && errId) || undefined;
    var common = { id: id, 'aria-invalid': props.error ? 'true' : undefined, 'aria-describedby': described, className: 'cy-input' };
    var rest = omit(props, ['id', 'label', 'hint', 'error', 'options', 'as', 'className', 'optional', 'icon', 'valid', 'labelTip', 'tipOpen']);
    var control;
    if (props.as === 'select') {
      control = h('select', Object.assign({}, rest, common), (props.options || []).map(function (o) {
        return h('option', { key: o.value, value: o.value, disabled: o.disabled }, o.label);
      }));
    } else if (props.as === 'textarea') {
      control = h('textarea', Object.assign({ rows: 3 }, rest, common, { className: 'cy-input cy-textarea' }));
    } else {
      control = h('input', Object.assign({ type: 'text' }, rest, common));
    }
    return h('div', { className: cx('cy-field', props.error && 'cy-field-error', props.className) },
      h('div', { className: 'cy-label-row' },
        h('label', { htmlFor: id, className: 'cy-label' }, props.label, props.optional ? h('span', { className: 'cy-optional' }, ' (opcional)') : null),
        props.labelTip ? h(InfoTip, { term: props.label, tip: props.labelTip, open: props.tipOpen }) : null),
      h('div', { className: cx('cy-control', props.icon && 'cy-control-icon') }, props.icon ? h(Icon, { name: props.icon, size: 18 }) : null, control,
        props.valid ? h('span', { className: 'cy-valid', 'aria-hidden': 'true' }, h(Icon, { name: 'check', size: 18 })) : null),
      props.error ? h('p', { id: errId, className: 'cy-error' }, h(Icon, { name: 'alert', size: 16 }), props.error) : null,
      props.hint ? h('p', { id: hintId, className: 'cy-hint' }, props.hint) : null);
  }
  function Checkbox(props) {
    var id = useId(props.id);
    var rest = omit(props, ['id', 'label', 'className', 'error']);
    return h('div', { className: cx('cy-check', props.className) },
      h('input', Object.assign({ type: 'checkbox', id: id, 'aria-invalid': props.error ? 'true' : undefined }, rest)),
      h('label', { htmlFor: id }, props.label),
      props.error ? h('p', { className: 'cy-error' }, h(Icon, { name: 'alert', size: 16 }), props.error) : null);
  }

  /* ---------- QuantityStepper: 44 px, tooltips con verbo ---------- */
  function QuantityStepper(props) {
    var min = props.min == null ? 1 : props.min, max = props.max;
    var _s = React.useState(props.defaultValue || props.value || 1), inner = _s[0], setInner = _s[1];
    var value = props.onChange ? (props.value || 1) : inner;
    function set(v) { if (props.onChange) props.onChange(v); else setInner(v); }
    var atMin = value <= min, atMax = max != null && value >= max;
    return h('div', { className: cx('cy-stepper-wrap', props.className) },
      h('div', { className: 'cy-stepper', role: 'group', 'aria-label': props.label || 'Cantidad' },
        h(IconButton, { icon: 'minus', variant: 'plain', label: 'Disminuir cantidad', tooltip: atMin ? 'Disminuir cantidad (mínimo ' + min + ')' : 'Disminuir cantidad', disabled: atMin, tooltipOpen: props.tipOpen === 'minus', onClick: function () { set(value - 1); } }),
        h('output', { 'aria-live': 'polite', className: 'cy-stepper-value' }, value),
        h(IconButton, { icon: 'plus', variant: 'plain', label: 'Aumentar cantidad', tooltip: atMax ? 'Llegaste al máximo por pedido' : 'Aumentar cantidad', disabled: atMax, tooltipOpen: props.tipOpen === 'plus', onClick: function () { set(value + 1); } })),
      props.hint ? h('p', { className: 'cy-hint' }, props.hint) : null);
  }

  /* ---------- CouponField: un solo mensaje a la vez ---------- */
  function CouponField(props) {
    var status = props.status || 'idle';
    var id = useId(props.id);
    var msgId = id + '-msg';
    var msg;
    if (status === 'applied') msg = h('p', { id: msgId, className: 'cy-coupon-ok', role: 'status' }, h(Icon, { name: 'check-circle', size: 16 }), props.appliedText || 'Cupón aplicado.');
    else if (status === 'invalid') msg = h('p', { id: msgId, className: 'cy-error', role: 'alert' }, h(Icon, { name: 'alert', size: 16 }), props.errorText || 'Ese cupón no existe o ya venció. Revisa el código o continúa sin cupón.');
    else msg = h('p', { id: msgId, className: 'cy-hint' }, 'Cada cupón se usa una sola vez por pedido.');
    return h('div', { className: cx('cy-coupon', props.className) },
      h('div', { className: 'cy-label-row' },
        h('label', { htmlFor: id, className: 'cy-label' }, h(Icon, { name: 'ticket', size: 16 }), ' Cupón de lealtad', h('span', { className: 'cy-optional' }, ' (opcional)')),
        h(InfoTip, { term: 'un cupón de lealtad', tip: 'Código de descuento del programa de lealtad de ComproYa. Se usa una vez por pedido.', open: props.tipOpen })),
      h('div', { className: 'cy-coupon-row' },
        h('input', {
          id: id, className: 'cy-input', placeholder: 'Escribe tu código', value: props.value, autoComplete: 'off',
          'aria-invalid': status === 'invalid' ? 'true' : undefined, 'aria-describedby': msgId,
          readOnly: status === 'applied', onChange: function (e) { if (props.onChange) props.onChange(e.target.value); }
        }),
        status === 'applied'
          ? h(Button, { variant: 'secondary', onClick: props.onRemove, tooltip: 'Quitar el cupón de este pedido' }, 'Quitar')
          : h(Button, { variant: 'secondary', loading: status === 'checking', disabled: !props.value, onClick: props.onApply }, status === 'checking' ? 'Validando…' : 'Aplicar')),
      msg);
  }

  /* ---------- ShopHeader: misma cabecera en todo el flujo ---------- */
  var NAV = [
    { id: 'catalogo', label: 'Catálogo', href: '/', icon: 'grid' },
    { id: 'carrito', label: 'Carrito', href: '/carrito', icon: 'cart' },
    { id: 'pedidos', label: 'Mis pedidos', href: '/pedidos', icon: 'receipt' },
    { id: 'cuenta', label: 'Mi cuenta', href: '/cuenta', icon: 'user' }
  ];
  function Logo(props) {
    return h('a', { className: 'cy-brand', href: '/', 'aria-label': 'ComproYa, ir al catálogo' },
      props.src ? h('img', { src: props.src, alt: 'ComproYa', className: 'cy-brand-img' })
        : h('span', { className: 'cy-brand-text' }, 'ComproYa'));
  }
  function ShopHeader(props) {
    var compact = props.variant === 'compact';
    var count = props.cartCount || 0;
    var nav = h('nav', { className: 'cy-nav', 'aria-label': 'Secciones de la tienda' },
      h('div', { className: 'cy-nav-inner' }, NAV.map(function (n) {
        var active = props.active === n.id;
        return h('a', { key: n.id, href: n.href, className: cx('cy-nav-link', active && 'cy-nav-active'), 'aria-current': active ? 'page' : undefined },
          h('span', { className: 'cy-nav-icon' }, h(Icon, { name: n.icon, size: 18 }),
            n.id === 'carrito' && count > 0 ? h('span', { className: 'cy-count', 'aria-hidden': 'true' }, count) : null),
          h('span', null, n.label, n.id === 'carrito' && count > 0 ? h('span', { className: 'cy-sr' }, ', ' + units(count, 'producto', 'productos')) : null));
      })));
    var account = props.customerName
      ? h('div', { className: 'cy-account' },
          h('span', { className: 'cy-account-hello' }, 'Hola, ', h('strong', null, props.customerName)),
          h(Tooltip, { label: 'Cerrar sesión en este dispositivo', describe: false, placement: 'bottom' },
            h('a', { href: props.logoutHref || '#', className: 'cy-link cy-account-out' }, 'Cerrar sesión')))
      : h(Button, { variant: 'secondary', href: '/ingresar', icon: 'user', className: 'cy-login' }, 'Iniciar sesión');
    var cart = h(Tooltip, { label: count > 0 ? 'Ver tu carrito: ' + units(count, 'producto', 'productos') : 'Ver tu carrito', describe: false, placement: 'bottom', align: 'end' },
      h('a', { href: '/carrito', className: 'cy-cart-btn' },
        h('span', { className: 'cy-nav-icon' }, h(Icon, { name: 'cart' }), count > 0 ? h('span', { className: 'cy-count', 'aria-hidden': 'true' }, count) : null),
        h('span', { className: 'cy-cart-text' }, h('span', null, 'Carrito'), count > 0 ? h('strong', null, formatCOP(props.cartTotal)) : null)));
    return h('header', { className: cx('cy-header', compact && 'cy-header-compact', props.className) },
      compact ? null : h('div', { className: 'cy-utility' }, h('div', { className: 'cy-utility-inner' },
        h('span', null, h(Icon, { name: 'truck', size: 16 }), 'Compra en línea y recíbelo en la dirección que escribas'),
        h('span', { className: 'cy-utility-sec' }, h(Icon, { name: 'lock', size: 16 }), 'Pago con tarjeta en la pasarela segura'))),
      h('div', { className: 'cy-header-main' },
        h(Logo, { src: props.logoSrc }),
        compact
          ? h('p', { className: 'cy-secure' }, h(Icon, { name: 'lock', size: 18 }), h('span', null, 'Compra segura'))
          : h('form', { className: 'cy-search', role: 'search', onSubmit: function (e) { e.preventDefault(); if (props.onSearch) props.onSearch(e.target.elements.q.value); } },
              h('label', { htmlFor: 'cy-q', className: 'cy-sr' }, 'Buscar productos'),
              h(Icon, { name: 'search', size: 18, className: 'cy-search-icon' }),
              h('input', { id: 'cy-q', name: 'q', type: 'search', placeholder: 'Buscar productos, por ejemplo "licuadora"', defaultValue: props.query }),
              h('button', { type: 'submit' }, 'Buscar')),
        h('div', { className: 'cy-header-actions' }, account, cart)),
      nav);
  }

  /* ---------- CheckoutSteps: 4 pasos con nombre de pantalla ---------- */
  var STEPS = ['Carrito', 'Datos y envío', 'Pago', 'Pedido confirmado'];
  function CheckoutSteps(props) {
    var current = props.current || 1;
    return h('div', { className: cx('cy-steps-wrap', props.className) },
      props.back ? h('a', { className: 'cy-back', href: props.back.href }, h(Icon, { name: 'arrow-left', size: 18 }), props.back.label) : h('span', null),
      h('p', { className: 'cy-steps-mobile' }, 'Paso ' + current + ' de 4 · ', h('strong', null, STEPS[current - 1])),
      h('ol', { className: 'cy-steps', 'aria-label': 'Progreso de la compra' },
        STEPS.map(function (s, i) {
          var n = i + 1, state = n < current ? 'done' : n === current ? 'current' : 'todo';
          return h('li', { key: s, className: 'cy-step cy-step-' + state, 'aria-current': state === 'current' ? 'step' : undefined },
            h('span', { className: 'cy-step-num', 'aria-hidden': 'true' }, state === 'done' ? h(Icon, { name: 'check', size: 14 }) : n),
            h('span', { className: 'cy-step-label' }, s, state === 'done' ? h('span', { className: 'cy-sr' }, ' (completado)') : null));
        })));
  }

  /* ---------- Breadcrumbs ---------- */
  function Breadcrumbs(props) {
    var items = props.items || [];
    return h('nav', { className: cx('cy-crumbs', props.className), 'aria-label': 'Estás en' },
      h('ol', null, items.map(function (it, i) {
        var last = i === items.length - 1;
        return h('li', { key: i },
          last ? h('span', { 'aria-current': 'page' }, it.label)
            : h('a', { href: it.href || '#' }, i === 0 ? h(Icon, { name: 'home', size: 16 }) : null, it.label),
          last ? null : h(Icon, { name: 'chevron-right', size: 14, className: 'cy-crumb-sep' }));
      })));
  }

  /* ---------- AcademicFooter ---------- */
  function AcademicFooter(props) {
    function col(title, links) {
      return h('div', { className: 'cy-footer-col' }, h('h2', null, title),
        h('ul', null, links.map(function (l) { return h('li', { key: l[0] }, h('a', { href: l[1] }, l[0])); })));
    }
    return h('footer', { className: cx('cy-footer', props.className) },
      h('div', { className: 'cy-footer-inner' },
        h('div', { className: 'cy-footer-brand' },
          props.logoSrc ? h('img', { src: props.logoSrc, alt: 'ComproYa', className: 'cy-footer-logo' }) : h('strong', null, 'ComproYa'),
          h('p', null, 'Compra en línea, paga con tarjeta en la pasarela segura y recibe tu pedido en casa.')),
        col('Comprar', [['Catálogo', '/'], ['Carrito', '/carrito'], ['Cómo funciona el envío', '#envio']]),
        col('Tu cuenta', [['Mis pedidos', '/pedidos'], ['Mi cuenta', '/cuenta'], ['Privacidad y consentimiento', '/privacidad']]),
        col('Pagos', [['Pago con tarjeta', '#pago'], ['Cupón de lealtad', '#cupon']])),
      h('div', { className: 'cy-footer-legal' },
        h('p', null, 'Proyecto académico — Ingeniería de Software II, Universidad Central. Sin fines comerciales. Las imágenes de producto pertenecen a sus respectivos titulares.'),
        h('p', null, '© 2026 ComproYa. Todos los derechos reservados.')));
  }

  /* ---------- ProductImage: nunca una imagen rota ---------- */
  function ProductImage(props) {
    var _s = React.useState(false), failed = _s[0], setFailed = _s[1];
    var size = props.size || 'card';
    if (!props.src || failed) {
      return h('div', { className: cx('cy-pimg', 'cy-pimg-' + size, 'cy-pimg-empty', props.className), role: 'img', 'aria-label': 'Sin foto: ' + (props.alt || 'producto') },
        h(Icon, { name: 'package', size: size === 'thumb' ? 22 : 40 }),
        size === 'thumb' ? null : h('span', null, props.category || 'Sin foto'));
    }
    return h('div', { className: cx('cy-pimg', 'cy-pimg-' + size, props.className) },
      h('img', { src: props.src, alt: props.alt || '', loading: 'lazy', onError: function () { setFailed(true); } }));
  }

  /* ---------- ProductCard ---------- */
  function ProductCard(props) {
    var state = props.state || 'idle';
    var soldOut = props.units === 0;
    var action;
    if (soldOut) {
      action = h(Button, { variant: 'primary', full: true, disabled: true, icon: 'cart-plus', disabledReason: 'Producto agotado: por ahora no hay unidades.' }, 'Agotado');
    } else if (state === 'added') {
      action = h(AddedToCart, { quantity: props.addedQuantity || 1, compact: true });
    } else {
      action = h(Button, { variant: 'primary', full: true, icon: 'cart-plus', loading: state === 'adding', onClick: props.onAdd, 'aria-label': state === 'adding' ? undefined : 'Agregar ' + props.name + ' al carrito',
        tooltip: 'Agregar ' + props.name + ' al carrito', tooltipOpen: props.tooltipOpen }, state === 'adding' ? 'Agregando…' : h(Fragment, null, 'Agregar', h('span', { className: 'cy-pcard-long' }, ' al carrito')));
    }
    return h('article', { className: cx('cy-pcard', soldOut && 'cy-pcard-soldout', props.className) },
      h('a', { href: props.href || '#', className: 'cy-pcard-link' },
        h(ProductImage, { src: props.image, alt: props.name, category: props.category }),
        props.category ? h('span', { className: 'cy-pcard-cat' }, props.category) : null,
        h('h3', { className: 'cy-pcard-name' }, props.name)),
      h('p', { className: 'cy-pcard-price' }, formatCOP(props.price)),
      props.units != null ? h('p', { className: cx('cy-pcard-units', soldOut && 'cy-pcard-units-out') }, soldOut ? 'Sin unidades por ahora' : units(props.units, 'unidad disponible', 'unidades disponibles')) : null,
      state === 'error' ? h('p', { className: 'cy-error', role: 'alert' }, h(Icon, { name: 'alert', size: 16 }), 'No pudimos agregarlo. Inténtalo de nuevo.') : null,
      action);
  }

  /* ---------- CategoryCard ---------- */
  function CategoryCard(props) {
    return h('a', { className: cx('cy-catcard', props.active && 'cy-catcard-active', props.className), href: props.href || '#', 'aria-current': props.active ? 'page' : undefined },
      h('span', { className: 'cy-catcard-img' }, props.image ? h('img', { src: props.image, alt: '' }) : h(Icon, { name: 'grid', size: 28 })),
      h('span', { className: 'cy-catcard-name' }, props.name),
      props.count != null ? h('span', { className: 'cy-catcard-count' }, units(props.count, 'producto', 'productos')) : null);
  }

  /* ---------- CategoryCarousel: una fila infinita; se detiene con el mouse, con foco o con Pausar ---------- */
  function CategoryCarousel(props) {
    var cats = props.categories || [];
    var vp = React.useRef(null);
    var _m = React.useState(!!props.paused || reducedMotion()), manual = _m[0], setManual = _m[1];
    var _p = React.useState(!!props.paused), paused = _p[0], setPaused = _p[1];
    function half() { var el = vp.current; return el ? el.scrollWidth / 2 : 0; }
    function onScroll() {
      var el = vp.current; if (!el || !manual) return;
      var hw = half();
      if (el.scrollLeft >= hw) el.scrollLeft -= hw;
      else if (el.scrollLeft <= 0) el.scrollLeft += hw;
    }
    function go(dir) {
      var el = vp.current; if (!el) return;
      if (!manual) { setManual(true); el.scrollLeft = half() / 2; }
      el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reducedMotion() ? 'auto' : 'smooth' });
    }
    function card(c, i, dup) {
      return h('li', { key: (dup ? 'd' : 'a') + i, 'aria-hidden': dup ? 'true' : undefined },
        h(CategoryCard, { name: c.name, image: c.image, href: c.href, active: c.active, tabIndex: dup ? -1 : undefined }));
    }
    var list = cats.map(function (c, i) { return card(c, i, false); }).concat(cats.map(function (c, i) { return card(c, i, true); }));
    var animated = !manual && !paused;
    return h('section', { className: cx('cy-carousel', animated && 'cy-carousel-anim', props.className), 'aria-label': props.title || 'Categorías', 'aria-roledescription': 'carrusel' },
      h('div', { className: 'cy-carousel-head' },
        h('h2', { className: 'cy-carousel-title' }, props.title || 'Explora por categoría'),
        h('div', { className: 'cy-carousel-ctrls' },
          manual ? null : h(IconButton, { icon: paused ? 'play' : 'pause', label: paused ? 'Reanudar el carrusel' : 'Pausar el carrusel', onClick: function () { setPaused(!paused); }, tooltipOpen: props.tipOpen === 'pause' }),
          h(IconButton, { icon: 'chevron-left', label: 'Ver categorías anteriores', onClick: function () { go(-1); }, tooltipOpen: props.tipOpen === 'prev' }),
          h(IconButton, { icon: 'chevron-right', label: 'Ver más categorías', align: 'end', onClick: function () { go(1); }, tooltipOpen: props.tipOpen === 'next' }))),
      h('div', { className: 'cy-carousel-vp', ref: vp, onScroll: onScroll, onPointerDown: function (e) { if (e.pointerType === 'touch') setManual(true); } },
        h('ul', { className: 'cy-carousel-track', style: { animationDuration: Math.max(20, cats.length * 3) + 's' } }, list)));
  }

  /* ---------- LineItem ---------- */
  function LineItem(props) {
    return h('div', { className: cx('cy-li', props.compact && 'cy-li-compact', props.className) },
      h(ProductImage, { src: props.image, alt: props.name, size: 'thumb' }),
      h('div', { className: 'cy-li-info' },
        h('p', { className: 'cy-li-name' }, props.name),
        h('p', { className: 'cy-li-unit' }, formatCOP(props.unitPrice) + ' cada uno'),
        props.readOnly ? h('p', { className: 'cy-li-unit' }, units(props.quantity, 'unidad', 'unidades')) : null),
      props.readOnly ? null : h(QuantityStepper, { value: props.quantity, defaultValue: props.quantity, max: props.max, onChange: props.onQuantity, label: 'Cantidad de ' + props.name, className: 'cy-li-stepper', tipOpen: props.tipOpen }),
      h('div', { className: 'cy-li-end' },
        h('p', { className: 'cy-li-total' }, formatCOP(props.lineTotal != null ? props.lineTotal : props.unitPrice * props.quantity)),
        props.readOnly ? null : h(Tooltip, { label: 'Quitar ' + props.name + ' del carrito', open: props.tipOpen === 'remove', placement: 'bottom', align: 'end' },
          h('button', { type: 'button', className: 'cy-li-remove', onClick: props.onRemove }, h(Icon, { name: 'trash', size: 18 }), 'Quitar'))));
  }

  /* ---------- OrderSummary: valores del servidor, sin recalcular ---------- */
  function OrderSummary(props) {
    var items = props.items || [];
    return h('section', { className: cx('cy-summary', props.className), 'aria-label': props.title || 'Resumen del pedido' },
      h('h2', { className: 'cy-summary-title' }, props.title || 'Resumen del pedido'),
      items.length ? h('ul', { className: 'cy-sum-items' }, items.map(function (it, i) {
        return h('li', { key: i }, h(ProductImage, { src: it.image, alt: it.name, size: 'mini' }),
          h('span', { className: 'cy-sum-item-name' }, it.name, h('small', null, units(it.quantity, 'unidad', 'unidades'))),
          h('span', null, formatCOP(it.lineTotal)));
      })) : null,
      h('div', { className: 'cy-sum-row' }, h('span', null, 'Productos'), h('span', null, String(props.itemsCount || 0))),
      h('div', { className: 'cy-sum-row' }, h('span', null, 'Subtotal'), h('span', null, formatCOP(props.subtotal))),
      props.discount ? h('div', { className: 'cy-sum-row cy-sum-discount' }, h('span', null, props.discountLabel || 'Descuento por cupón'), h('span', null, '- ' + formatCOP(props.discount))) : null,
      props.shippingLabel ? h('div', { className: 'cy-sum-row' }, h('span', null, 'Envío'), h('span', null, props.shippingLabel)) : null,
      h('div', { className: 'cy-sum-row cy-sum-total' }, h('span', null, props.totalLabel || 'Total'), h('span', null, formatCOP(props.total))),
      props.note ? h('p', { className: 'cy-sum-note' }, h(Icon, { name: props.noteIcon || 'clock', size: 16 }), props.note) : null,
      props.children ? h('div', { className: 'cy-summary-actions' }, props.children) : null,
      props.secure ? h('p', { className: 'cy-sum-secure' }, h(Icon, { name: 'lock', size: 16 }), 'Pagas con tarjeta en la pasarela segura. ComproYa nunca ve tu tarjeta.') : null);
  }

  /* ---------- ShippingSummary ---------- */
  function ShippingSummary(props) {
    return h('section', { className: cx('cy-ship', props.className), 'aria-label': 'Dirección de envío' },
      h('div', { className: 'cy-ship-head' },
        h('h2', null, h(Icon, { name: 'map-pin', size: 18 }), props.title || 'Enviamos a'),
        props.editHref ? h('a', { className: 'cy-link', href: props.editHref }, 'Cambiar') : null),
      h('p', { className: 'cy-ship-name' }, props.name),
      h('p', null, props.address + ', ' + props.city),
      props.notes ? h('p', { className: 'cy-ship-notes' }, props.notes) : null,
      props.phone ? h('p', { className: 'cy-ship-phone' }, h(Icon, { name: 'phone', size: 16 }), props.phone) : null);
  }

  /* ---------- OrderRow: estado en palabras y siguiente acción ---------- */
  var CANCELLABLE = { 'creado': true, 'pagado': true };
  function OrderRow(props) {
    var st = props.status, info = ORDER_STATUS[st] || ORDER_STATUS['creado'];
    var actions = [];
    if (st === 'creado' || st === 'pago-fallido') actions.push(h(Button, { key: 'pay', variant: 'primary', href: props.payHref || '#', icon: 'card' }, 'Pagar'));
    if (st === 'pagado' || st === 'en-alistamiento' || st === 'entregado') actions.push(h(Button, { key: 'v', variant: 'secondary', href: props.viewHref || '#', icon: 'receipt' }, 'Ver pedido confirmado'));
    if (CANCELLABLE[st]) actions.push(h(Button, { key: 'c', variant: 'ghost-danger', onClick: props.onCancel }, 'Cancelar pedido'));
    var note = props.note;
    if (!note && st === 'en-alistamiento') note = 'Ya empezamos a alistarlo, así que no se puede cancelar.';
    return h('article', { className: cx('cy-order', props.className) },
      h('div', { className: 'cy-order-head' },
        h('div', null, h('h3', { className: 'cy-order-num' }, 'Pedido #' + props.number), h('p', { className: 'cy-order-date' }, props.date)),
        h(OrderStatus, { status: st })),
      props.images ? h('div', { className: 'cy-order-thumbs' }, props.images.slice(0, 4).map(function (src, i) { return h(ProductImage, { key: i, src: src, alt: '', size: 'mini' }); })) : null,
      h('dl', { className: 'cy-order-meta' },
        h('div', null, h('dt', null, 'Productos'), h('dd', null, String(props.itemsCount))),
        h('div', null, h('dt', null, 'Total'), h('dd', null, formatCOP(props.total))),
        h('div', null, h('dt', null, 'Envío a'), h('dd', null, props.city))),
      h('p', { className: cx('cy-order-explain', (st === 'cancelado' || st === 'pago-fallido') && 'cy-order-explain-alert') },
        h(Icon, { name: st === 'pago-fallido' ? 'alert' : 'info', size: 16 }), props.reason || info.explain),
      note ? h('p', { className: 'cy-order-note' }, note) : null,
      actions.length ? h('div', { className: 'cy-order-actions' }, actions) : null);
  }

  /* ---------- Card ---------- */
  function Card(props) {
    return h('section', { className: cx('cy-card', props.className) },
      props.title ? h('div', { className: 'cy-card-head' }, h('h2', { className: 'cy-card-title' }, props.icon ? h(Icon, { name: props.icon, size: 20 }) : null, props.title), props.aside || null) : null,
      props.children);
  }

  var api = {
    Button: Button, IconButton: IconButton, Tooltip: Tooltip, InfoTip: InfoTip, Notice: Notice, AddedToCart: AddedToCart,
    Badge: Badge, OrderStatus: OrderStatus, Spinner: Spinner, Skeleton: Skeleton, EmptyState: EmptyState,
    Field: Field, Checkbox: Checkbox, QuantityStepper: QuantityStepper, CouponField: CouponField,
    ShopHeader: ShopHeader, CheckoutSteps: CheckoutSteps, Breadcrumbs: Breadcrumbs, AcademicFooter: AcademicFooter,
    ProductImage: ProductImage, ProductCard: ProductCard, CategoryCard: CategoryCard, CategoryCarousel: CategoryCarousel,
    LineItem: LineItem, OrderSummary: OrderSummary, ShippingSummary: ShippingSummary, OrderRow: OrderRow,
    Card: Card, Icon: Icon, ICON_NAMES: ICON_NAMES, formatCOP: formatCOP, ORDER_STATUS: ORDER_STATUS
  };
  window.ComproYa = Object.assign(window.ComproYa || {}, api);
})();
