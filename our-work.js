const work = []; // Add only verified SuperB jobs.
const reviews = []; // Add only verified SuperB reviews.
const state = { hidden: [], featured: null };
const select = selector => document.querySelector(selector);
const make = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
};
function photo(src, alt) {
  const image = make('img');
  image.src = src;
  image.alt = alt;
  return image;
}
function setupWorkPage() {
  const stage = select('#work-stage');
  const thumbs = select('#work-thumbs');
  const dialog = select('#work-lightbox');
  let active = location.hash.slice(1);
  let visible = [];
  let opener;

  function photoButton(src, alt, label) {
    const button = make('button', 'work-photo-button');
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.append(photo(src, alt));
    button.addEventListener('click', () => {
      opener = button;
      const image = dialog.querySelector('img');
      image.src = src;
      image.alt = alt;
      dialog.showModal();
    });
    return button;
  }
  function render() {
    visible = work.filter(job => !state.hidden.includes(job.id));
    const job = visible.find(item => item.id === active) ?? visible[0];
    select('#work-caption').hidden = !job;
    select('#work-empty').hidden = Boolean(job);
    active = job?.id;
    stage.replaceChildren();
    thumbs.replaceChildren();
    select('#work-category').textContent = job ? (state.featured === job.id ? 'Featured · ' : '') + job.category : '';
    select('#work-title').textContent = job?.title ?? '';
    select('#work-note').textContent = job?.note ?? '';
    select('#work-arrows').hidden = visible.length < 2;
    if (!job) return;
    if (job.before) {
      const openingAlt = 'Vehicle before detailing';
      const comparison = make('div', 'work-compare');
      const opening = photoButton(job.before, openingAlt, 'Enlarge before photo');
      const fitted = photoButton(job.image, job.alt, 'Enlarge after photo');
      comparison.append(opening, fitted);
      const controls = make('div', 'work-compare-controls');
      const slider = make('input');
      slider.type = 'range';
      slider.min = 0;
      slider.max = 100;
      slider.value = 50;
      slider.setAttribute('aria-label', 'Compare before and after detailing');
      function reveal() {
        fitted.style.clipPath = 'inset(0 0 0 ' + slider.value + '%)';
        comparison.style.setProperty('--split', slider.value + '%');
      }
      slider.addEventListener('input', reveal);
      controls.append(make('span', '', 'Before'), slider, make('span', '', 'After'));
      stage.append(comparison, controls);
      reveal();
    } else if (job.video) {
      const video = make('video');
      video.src = job.video;
      if (job.image) video.poster = job.image;
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.setAttribute('aria-label', job.title);
      stage.append(video);
    } else {
      stage.append(photoButton(job.image, job.alt, 'Enlarge ' + job.title));
    }
    for (const item of visible) {
      const thumb = make('button', 'work-thumb');
      thumb.type = 'button';
      thumb.setAttribute('aria-label', item.title);
      thumb.setAttribute('aria-pressed', String(item.id === active));
      if (item.image) thumb.append(photo(item.image, ''));
      thumb.append(make('span', '', item.title));
      thumb.addEventListener('click', () => {
        active = item.id;
        render();
        thumbs.querySelector('[aria-pressed="true"]')?.focus();
      });
      thumbs.append(thumb);
    }
  }
  function step(offset) {
    if (visible.length < 2) return;
    const index = visible.findIndex(item => item.id === active);
    active = visible[(index + offset + visible.length) % visible.length].id;
    render();
  }
  select('#work-prev').addEventListener('click', () => step(-1));
  select('#work-next').addEventListener('click', () => step(1));
  let touch;
  stage.addEventListener('touchstart', event => {
    if (event.target.closest('input,video')) return;
    const point = event.changedTouches[0];
    touch = { x: point.clientX, y: point.clientY };
  }, { passive: true });
  stage.addEventListener('touchend', event => {
    if (!touch) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - touch.x;
    const dy = point.clientY - touch.y;
    touch = undefined;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
      event.preventDefault();
      step(dx < 0 ? 1 : -1);
    }
  });
  stage.addEventListener('touchcancel', () => { touch = undefined; });
  select('#work-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus());

  let review = 0;
  function showReview(offset = 0) {
    if (!reviews.length) return;
    select('#review-empty').hidden = true;
    select('#review-panel').hidden = false;
    review = (review + offset + reviews.length) % reviews.length;
    const { excerpt, name, date, source, url } = reviews[review];
    select('#review-quote').textContent = '“' + excerpt + '”';
    select('#review-credit').textContent = [name, source, date].filter(Boolean).join(' · ');
    select('#review-source').hidden = !url;
    if (url) select('#review-source').href = url;
    select('#review-count').textContent = (review + 1) + ' / ' + reviews.length;
  }
  select('#review-prev').addEventListener('click', () => showReview(-1));
  select('#review-next').addEventListener('click', () => showReview(1));

  function setupPublishing() {
    const admin = select('#work-admin');
    admin.replaceChildren();
    refreshers.length = 0;
    for (const job of work) {
      const row = make('fieldset', 'work-record');
      const legend = make('legend', '', job.title);
      const publishLabel = make('label');
      const publish = make('input');
      publish.type = 'checkbox';
      const feature = make('button', 'secondary');
      feature.type = 'button';
      function refresh() {
        publish.checked = !state.hidden.includes(job.id);
        feature.disabled = !publish.checked;
        feature.textContent = state.featured === job.id ? 'Remove feature' : 'Feature in gallery preview';
      }
      function changed() {
        select('#work-admin-status').textContent = 'Local gallery preview updated.';
        for (const update of refreshers) update();
        render();
      }
      publish.addEventListener('change', () => {
        state.hidden = state.hidden.filter(id => id !== job.id);
        if (!publish.checked) {
          state.hidden.push(job.id);
          if (state.featured === job.id) state.featured = null;
        }
        changed();
      });
      feature.addEventListener('click', () => {
        state.featured = state.featured === job.id ? null : job.id;
        if (state.featured) active = state.featured;
        changed();
      });
      publishLabel.append(publish, ' Publish to local preview');
      row.append(legend, publishLabel, feature);
      admin.append(row);
      refreshers.push(refresh);
      refresh();
    }
  }

  const refreshers = [];
  const mediaForm = select('#media-form');
  mediaForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(mediaForm);
    const file = data.get('media');
    const before = data.get('before');
    const video = file.type.startsWith('video/');
    if ((!video && !file.type.startsWith('image/')) || (before.size && (video || !before.type.startsWith('image/')))) {
      select('#work-admin-status').textContent = 'Choose an image or video. A before photo can only be paired with an after photo.';
      return;
    }
    const id = 'local-job-' + (work.length + 1);
    const url = URL.createObjectURL(file);
    work.push({
      id, title: data.get('title').trim(), category: 'Local upload preview',
      note: 'This media is available only in the current page.',
      image: video ? null : url, video: video ? url : null,
      before: before.size ? URL.createObjectURL(before) : null,
      alt: 'Detailing job after service',
    });
    state.hidden.push(id);
    mediaForm.reset();
    setupPublishing();
    select('#work-admin-status').textContent = 'Media attached. Use Publish to local preview to display this job.';
  });
  mediaForm.querySelector('[type=submit]').disabled = false;
  setupPublishing();
  showReview();
  render();
}
setupWorkPage();
