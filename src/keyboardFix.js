const editableSelector = 'input, textarea, select';

function getViewport() {
  const vv = window.visualViewport;
  return {
    height: Math.round(vv?.height || window.innerHeight),
    top: Math.round(vv?.offsetTop || 0),
  };
}

function positionOverlay(target) {
  const overlay = target?.closest?.('.ov');
  if (!overlay) return;

  const modal = overlay.querySelector('.modal');
  if (!modal) return;

  const { height, top } = getViewport();

  overlay.dataset.keyboardOpen = 'true';
  overlay.style.position = 'fixed';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.top = `${top}px`;
  overlay.style.bottom = 'auto';
  overlay.style.height = `${height}px`;
  overlay.style.minHeight = '0';
  overlay.style.padding = '8px 12px 0';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'flex-end';
  overlay.style.justifyContent = 'center';
  overlay.style.overflow = 'hidden';

  modal.style.margin = '0';
  modal.style.maxHeight = `${Math.max(180, height - 8)}px`;
  modal.style.overflowY = 'auto';
  modal.style.borderRadius = '22px 22px 0 0';
  modal.style.paddingBottom = 'max(18px, env(safe-area-inset-bottom))';

  requestAnimationFrame(() => {
    target.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  });
}

function resetOverlay(target) {
  const overlay = target?.closest?.('.ov') || document.querySelector('.ov[data-keyboard-open="true"]');
  if (!overlay) return;

  const modal = overlay.querySelector('.modal');
  overlay.removeAttribute('data-keyboard-open');
  overlay.removeAttribute('style');
  modal?.removeAttribute('style');
}

function refreshFocusedOverlay() {
  const active = document.activeElement;
  if (active?.matches?.(editableSelector)) positionOverlay(active);
}

export function installKeyboardFix() {
  const onFocusIn = (event) => {
    if (!event.target?.matches?.(editableSelector)) return;
    setTimeout(() => positionOverlay(event.target), 80);
  };

  const onFocusOut = (event) => {
    if (!event.target?.matches?.(editableSelector)) return;
    setTimeout(() => {
      const active = document.activeElement;
      if (active?.matches?.(editableSelector)) {
        positionOverlay(active);
      } else {
        resetOverlay(event.target);
      }
    }, 120);
  };

  const onViewportChange = () => requestAnimationFrame(refreshFocusedOverlay);

  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('focusout', onFocusOut);
  window.visualViewport?.addEventListener('resize', onViewportChange);
  window.visualViewport?.addEventListener('scroll', onViewportChange);
  window.addEventListener('resize', onViewportChange);

  return () => {
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('focusout', onFocusOut);
    window.visualViewport?.removeEventListener('resize', onViewportChange);
    window.visualViewport?.removeEventListener('scroll', onViewportChange);
    window.removeEventListener('resize', onViewportChange);
  };
}
