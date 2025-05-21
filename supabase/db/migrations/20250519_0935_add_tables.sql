-- legal_documents テーブルを作成
CREATE TABLE public.legal_documents (
    id uuid PRIMARY KEY,
    document_type text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    content text NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_latest boolean DEFAULT true NOT NULL,
);
