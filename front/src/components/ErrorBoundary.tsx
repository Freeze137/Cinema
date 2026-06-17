import { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Rótulo do botão de recuperação. */
  resetLabel?: string;
  /** Ação ao tentar novamente (ex.: voltar para a escolha de assentos). */
  onReset?: () => void;
}

interface State {
  hasError: boolean;
}

/**
 * Captura erros de runtime na árvore filha e exibe um fallback elegante,
 * em vez de derrubar toda a renderização (tela preta). Evita que uma falha
 * de terceiros (ex.: widget de cartão) ou um dado ausente quebre a página.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('[ErrorBoundary] Falha capturada na etapa:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f0f13] text-zinc-100 p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Algo deu errado</h2>
            <p className="text-zinc-400 mb-6">
              Ocorreu um erro ao carregar esta etapa. Tente novamente — seus dados de sessão não foram perdidos.
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-xl font-bold transition-all duration-150 ease-out active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              {this.props.resetLabel ?? 'Tentar novamente'}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
