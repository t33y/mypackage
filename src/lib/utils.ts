export type Delivery = {
  destination: string;
  dispatcher: string;
  startTime?: number;
  trackingId?: string;
  arrivalTime?: number;
  dispatchCurrentLocation?: string;
  isStarted: false;
  distance?: number;
  duration?: number;
  itemsToDeliver?: {
    itemName: string;
    itemPrice?: number;
    isPaid?: boolean;
    amountDue?: number;
  };
};

export type Coordinate = {
  longitude: number;
  latitude: number;
};

export const getCoord = (location: string): Coordinate => {
  const longitude = Number(location.split(",")[0]);
  const latitude = Number(location.split(",")[1]);
  console.log("longitude", longitude);
  console.log("latitude", latitude);
  return { longitude, latitude };
};

export const getDistance = (origin: string, destination: string) => {
  const originCoord = getCoord(origin);
  const destinationCoord = getCoord(destination);
  console.log("origin", originCoord.latitude, originCoord.longitude);
  console.log(
    "destination",
    destinationCoord.latitude,
    destinationCoord.longitude
  );

  const rawDistance = Math.pow(
    Math.pow(originCoord.longitude, 2) -
      Math.pow(destinationCoord.longitude, 2) +
      (Math.pow(originCoord.latitude, 2) -
        Math.pow(destinationCoord.latitude, 2)),
    0.5
  );
  const distance = Math.ceil(rawDistance * 10);
  console.log("raw distance", rawDistance);
  console.log("real distance", distance);

  return distance;
};
