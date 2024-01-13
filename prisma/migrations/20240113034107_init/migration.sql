-- CreateTable
CREATE TABLE "Entrega" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "punto_venta" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "producto" TEXT,
    "domicilio" TEXT,
    "nombre" TEXT,
    "celular" TEXT,
    "notas" TEXT,
    "pagado" BOOLEAN DEFAULT false,
    "estado" BOOLEAN DEFAULT false,
    "fecha_programada" DATETIME
);

-- CreateTable
CREATE TABLE "Nota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "entrega_id" TEXT,
    CONSTRAINT "Nota_entrega_id_fkey" FOREIGN KEY ("entrega_id") REFERENCES "Entrega" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
