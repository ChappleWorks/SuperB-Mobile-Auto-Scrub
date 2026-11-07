// Review and replace these demo rates with Josh's approved service menu.
const packages = {
  interior: { name: 'Interior Refresh', price: 85, description: 'Vacuum, wipe down surfaces, and clean interior windows.' },
  exterior: { name: 'Exterior Detail', price: 75, description: 'Hand wash, dry, and clean wheels and exterior windows.' },
  full: { name: 'Full Detail', price: 145, description: 'Combine the interior refresh and exterior detail.' },
};
const addOns = { pet: { name: 'Pet hair removal', price: 20 }, protection: { name: 'Paint protection', price: 25 } };
const vehicleFees = { car: 0, suv: 15, truck: 25 };
const coupon = { code: 'SUPERB10', discount: 10 };
const money = amount => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
const byId = id => document.getElementById(id);
function element(tag, content, className) {
  const el = document.createElement(tag);
  el.textContent = content;
  if (className) el.className = className;
  return el;
}

if (byId('package-cards')) {
  for (const [key, item] of Object.entries(packages)) {
    const card = element('article', '');
    const link = element('a', 'Choose ' + item.name, 'text-link');
    link.href = 'booking.html?package=' + key;
    card.append(element('span', money(item.price) + ' example base'), element('h3', item.name), element('p', item.description), link);
    byId('package-cards').append(card);
  }
  for (const item of Object.values(addOns)) byId('addon-list').append(element('li', item.name + ' · ' + money(item.price) + ' example'));
}

const booking = byId('booking');
if (booking) {
  const field = name => booking.elements.namedItem(name);
  const params = new URLSearchParams(location.search);
  const options = field('package');
  for (const [key, item] of Object.entries(packages)) options.add(new Option(item.name, key));
  if (Object.hasOwn(packages, params.get('package'))) options.value = params.get('package');
  if (params.get('interest') === 'membership') field('membership').value = 'interested';
  if (params.get('interest') === 'coupon') field('coupon').value = coupon.code;
  for (const [key, item] of Object.entries(addOns)) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'addons';
    checkbox.value = key;
    const label = element('label', '');
    label.append(checkbox, item.name + ' · ' + money(item.price));
    byId('addon-fields').append(label);
  }
  const today = new Date();
  field('year').max = today.getFullYear() + 1;
  field('date').min = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');

  function estimate() {
    const item = packages[options.value];
    const fee = vehicleFees[field('vehicle').value];
    const code = field('coupon').value.trim().toUpperCase();
    const extras = [...booking.querySelectorAll('[name=addons]:checked')].map(input => addOns[input.value]);
    const heavy = ['interior', 'exterior'].some(name => field(name).value.startsWith('Heavy'));
    const canPrice = Boolean(item) && Number.isFinite(fee) && !heavy;
    byId('coupon-status').textContent = !code ? '' : code !== coupon.code ? 'That demo coupon code was not recognized.' :
      canPrice ? 'Demo coupon applied.' : 'Demo coupon recognized. It applies when an example estimate is available.';
    byId('breakdown').textContent = '';
    if (!item || !field('vehicle').value) return 'Choose a package and vehicle type';
    if (!canPrice) return 'Needs shop review';
    const lines = [item.name + ' ' + money(item.price)];
    if (fee) lines.push('Vehicle size ' + money(fee));
    for (const extra of extras) lines.push(extra.name + ' ' + money(extra.price));
    const subtotal = item.price + fee + extras.reduce((total, extra) => total + extra.price, 0);
    const discount = code === coupon.code ? Math.min(subtotal, coupon.discount) : 0;
    if (discount) lines.push('Coupon −' + money(discount));
    byId('breakdown').textContent = lines.join(' · ');
    return money(subtotal - discount);
  }

  function refresh() {
    byId('estimate').textContent = estimate();
    byId('booking-status').hidden = true;
    byId('handoff').hidden = true;
  }
  booking.addEventListener('input', refresh);
  booking.addEventListener('submit', event => {
    event.preventDefault();
    const vehicle = ['year', 'make', 'model'].map(name => field(name).value.trim()).join(' ');
    const cadence = field('membership').selectedOptions[0].textContent;
    byId('job-summary').textContent = [
      vehicle, packages[options.value].name, field('area').value.trim(),
      'Preferred date ' + field('date').value, cadence, 'Estimate: ' + estimate(),
    ].join(' · ');
    byId('handoff').hidden = false;
    byId('booking-status').textContent = 'Sample request prepared. No appointment was booked.';
    byId('booking-status').hidden = false;
  });
  booking.querySelector('[type=submit]').disabled = false;
  refresh();
}
