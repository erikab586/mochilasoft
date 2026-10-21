CREATE TABLE IF NOT EXISTS public.prospecto (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100),
  email VARCHAR(190),
  telefono VARCHAR(16) NOT NULL,
  nombre_proyecto VARCHAR(150) NOT NULL,
  nicho VARCHAR(150),
  descripcion TEXT,
  archivo_ruta VARCHAR(255),
  archivo_nombre VARCHAR(255),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prospecto_creado_en
  ON public.prospecto (creado_en);

CREATE TABLE IF NOT EXISTS public.admin_usuario (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario VARCHAR(64) NOT NULL UNIQUE,
  password_salt CHAR(32) NOT NULL,
  password_hash CHAR(128) NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.admin_sesion (
  token_hash CHAR(64) PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES public.admin_usuario (id) ON DELETE CASCADE,
  expira_en TIMESTAMPTZ NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_sesion_expira_en
  ON public.admin_sesion (expira_en);
