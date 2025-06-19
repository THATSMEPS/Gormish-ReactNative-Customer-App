// types/area.types.ts

export interface Area {
  pincode: number;
  areaName: string;
  cityName: string;
  stateName: string;
  latitude: number;
  longitude: number;
  id: string;
}

export interface FetchAreasResponse {
  success: boolean;
  message: string;
  data: Area[];
}