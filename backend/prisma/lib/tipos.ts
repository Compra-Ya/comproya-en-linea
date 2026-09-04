export interface ProductoSemilla {
  codigoHomologado: string;
  nombre: string;
  categoria: string;
  costo: number;
  precioDigital: number;
  publicado: boolean;
  fuente: "dummyjson" | "sintetico";
}

export interface SucursalSemilla {
  nombre: string;
  ciudad: string;
}

export interface DisponibilidadSemilla {
  existenciasErp: number;
  umbralSeguridad: number;
  unidadesReservadas: number;
  sincronizadoEn: Date;
}
