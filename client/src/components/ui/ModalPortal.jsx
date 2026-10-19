import { createPortal } from 'react-dom';

/**
 * ModalPortal mounts modal dialogs and backdrops directly into `document.body`.
 * This breaks out of any parent stacking contexts (sticky headers, overflow containers, transforms),
 * ensuring the modal backdrop covers 100% of the viewport seamlessly from edge to edge.
 */
export default function ModalPortal({ children }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
