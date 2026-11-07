const menu = document.querySelector('.menu');
const navigation = document.querySelector('#navigation');
const compact = matchMedia('(max-width: 760px)');

function setMenu(open) {
  menu.hidden = !compact.matches;
  menu.setAttribute('aria-expanded', String(compact.matches && open));
  navigation.hidden = compact.matches && !open;
}

setMenu(false);
compact.addEventListener('change', () => setMenu(false));
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menu.focus();
  }
});
