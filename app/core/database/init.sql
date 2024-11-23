CREATE TABLE IF NOT EXISTS core.translations (
    id BIGSERIAL PRIMARY KEY,
    language TEXT NOT NULL,
    before_text TEXT NOT NULL,
    after_text TEXT NOT NULL,
    UNIQUE (language, before_text)
);

CREATE OR REPLACE FUNCTION core.get_ids_translations_text(
    _language TEXT,
    _text TEXT
)
RETURNS SETOF BIGINT
AS $$
BEGIN
    RETURN query
    SELECT 
        id
    FROM core.translations t
    WHERE t.language = _language
    AND t.before_text = _text;
END; 
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION core.get_translations_text_by_id(
    _id BIGINT
)
RETURNS SETOF core.translations
AS $$
BEGIN
    RETURN QUERY
    SELECT * 
    FROM core.translations t
    WHERE t.id = _id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION core.insert_translations(
    _language TEXT,
    _before_text TEXT,
    _after_text TEXT
)
RETURNS void
AS $$
BEGIN
    INSERT INTO core.translations (language, before_text, after_text) 
    VALUES (_language, _before_text, after_text)
    ON CONFLICT (language, before_text)
    DO NOTHING;
END;
$$ LANGUAGE plpgsql;