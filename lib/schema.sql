-- 1. ENUM Type for Delivery Status
CREATE TYPE delivery_status AS ENUM('pending', 'delivered');

-- 3. Customers Table
CREATE TABLE
  Customers (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    domicilio VARCHAR(200) NOT NULL,
    celular VARCHAR(20),
    email VARCHAR(255)
  );

-- 4. Deliveries (Deliveries) Table
CREATE TABLE
  Deliveries (
    id SERIAL PRIMARY KEY,
    punto_venta VARCHAR(5) NOT NULL,
    fecha_venta DATE NOT NULL,
    producto VARCHAR(255) NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES Customers (id),
    estado delivery_status DEFAULT 'pending',
    fecha_programada DATE,
    created_by UUID REFERENCES auth.users (id),
    created_at TIMESTAMP DEFAULT NOW(),
  );

-- 5. Notes Table
CREATE TABLE
  Notes (
    id SERIAL PRIMARY KEY,
    delivery_id INTEGER NOT NULL REFERENCES Deliveries (id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );

-- 6. Status_History Table
CREATE TABLE
  Status_History (
    id SERIAL PRIMARY KEY,
    delivery_id INTEGER NOT NULL REFERENCES Deliveries (id) ON DELETE CASCADE,
    previous_status delivery_status NOT NULL,
    new_status delivery_status NOT NULL,
    changed_at TIMESTAMP DEFAULT NOW(),
    changed_by UUID REFERENCES auth.users (id)
  );

-- 12. Indexes for Performance Optimization
-- Index on Deliveries.punto_venta
CREATE INDEX idx_deliveries_punto_venta ON Deliveries (punto_venta);

-- Index on Deliveries.producto
CREATE INDEX idx_deliveries_producto ON Deliveries (producto);

-- Index on Deliveries.estado
CREATE INDEX idx_deliveries_estado ON Deliveries (estado);

-- Index on Deliveries.customer_id
CREATE INDEX idx_deliveries_customer_id ON Deliveries (customer_id);

-- Index on Deliveries.created_by
CREATE INDEX idx_deliveries_created_by ON Deliveries (created_by);

-- Index on Deliveries.updated_by
CREATE INDEX idx_deliveries_updated_by ON Deliveries (updated_by);

-- Index on Status_History.changed_by
CREATE INDEX idx_status_history_changed_by ON Status_History (changed_by);

-- Index on Status_History.delivery_id
CREATE INDEX idx_status_history_delivery_id ON Status_History (delivery_id);
