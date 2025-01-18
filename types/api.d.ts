// types/api.d.ts Types from my ERP API

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface Customer {
  Id: number;
  RazonSocial: string;
  NombreFantasia: string;
  CondicionIva: string;
  TipoDoc: string;
  NroDoc: string;
  Pais?: string;
  Provincia?: string;
  Ciudad?: string;
  Domicilio?: string;
  Telefono?: string;
  Email?: string;
  Codigo?: string;
  PisoDepto?: string;
  Cp?: string;
  Observaciones?: string;
  Personeria?: string;
  IdPais?: number;
  IdProvincia?: number;
  IdCiudad?: number;
  IdListaPrecio?: number | null;
}

export interface GetClientByIdResponse {
  clients: Customer[];
  total: number;
}

export interface Comprobante {
  Id: number;
  IdComprobanteAsociado: number;
  IdUsuarioAdicional: number;
  IdCliente: number;
  RazonSocial: string;
  FechaAlta: string;
  FechaEmision: string;
  FechaServDesde: string | null;
  FechaServHasta: string | null;
  Numero: string;
  TipoFc: string;
  Modo: string;
  Cae: string | null;
  ImporteTotalNeto: string;
  ImporteTotalBruto: string;
  Saldo: string;
  PuntoVenta: number;
  Inventario: number;
  CondicionVenta: string;
  FechaVencimiento: string;
  Items: any | null;
  Tributos: any | null;
  Observaciones: string;
  Canal: string;
  TipoConcepto: number;
  Pagos: any | null;
  Descuento: any | null;
  Recargo: any | null;
  IDIntegracion: string | null;
  Origen: string;
  IDVentaIntegracion: string;
  IDCondicionVenta: number | null;
  IDTurno: number | null;
  IDMoneda: number;
  TipoDeCambio: number;
  PercepcionIIBB: any | null;
  IDJurisdiccion: number | null;
  RefExterna: string;
  fceMiPYME: boolean;
  IDVendedor: number;
}

export interface SearchComprobanteResponse {
  Items: Comprobante[];
  TotalPage: number;
  TotalItems: number;
}

export interface Concepto {
  Id: string;
  Codigo: string;
  Nombre: string;
  Estado?: string;
  PrecioFinal?: number;
  Stock?: number;
}

export interface SearchProductsResponse {
  Items: Concepto[];
  TotalItems: number;
  TotalPage: number;
}