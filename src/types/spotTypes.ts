interface ISpotAddress {
  village: string;
  union: string;
  upozila: string;
  district: string;
  googleLocation: string;
}
interface ISpot {
  _id: string;
  __v: number;
  updatedAt: Date;
  createdAt: Date;
  spotName: string;
  totalEmployees: number;
  spotCode: string;
  password: string;
  concernMobileNumber: string;
  address: ISpotAddress;
}

export interface ISpotResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ISpot[];
}
