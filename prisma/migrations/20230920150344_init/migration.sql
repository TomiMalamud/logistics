-- CreateTable
CREATE TABLE "Entrega" (
    "id" TEXT NOT NULL,
    "punto_venta" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "producto" TEXT,
    "domicilio" TEXT,
    "nombre" TEXT,
    "celular" TEXT,
    "notas" TEXT,
    "estado" BOOLEAN DEFAULT false,

    CONSTRAINT "Entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nota" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "entrega_id" TEXT,

    CONSTRAINT "Nota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_entrega_id_fkey" FOREIGN KEY ("entrega_id") REFERENCES "Entrega"("id") ON DELETE SET NULL ON UPDATE CASCADE;
