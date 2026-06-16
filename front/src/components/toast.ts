// Toast leve sem dependência externa: pub/sub global.
// O <Toaster/> (Toaster.tsx) assina aqui e renderiza. Usado para dar feedback
// em botões ainda não conectados ao backend (mock).

export interface ToastItem {
  id: number;
  msg: string;
}

let listeners: Array<(t: ToastItem) => void> = [];
let counter = 0;

export function subscribeToast(listener: (t: ToastItem) => void) {
  listeners.push(listener);
  return () => { listeners = listeners.filter(l => l !== listener); };
}

export function toast(msg: string) {
  const item = { id: ++counter, msg };
  listeners.forEach(l => l(item));
  // Log chamativo no console com a intenção do botão (mock).
  console.log('%c[Kinoplex · mock]', 'color:#F5C518;font-weight:bold;font-size:12px', msg);
}
