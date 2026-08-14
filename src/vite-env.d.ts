/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  /** Opcional. Sem ele a loja registra o pedido e some com o atalho do WhatsApp. */
  readonly VITE_WHATSAPP_PHONE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
