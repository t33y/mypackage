// export type Delivery = {
//   destination: string;
//   dispatcher: string;
//   startTime?: number;
//   trackingId?: string;
//   arrivalTime?: number;
//   dispatchCurrentLocation?: string;
//   isStarted: false;
//   distance?: number;
//   duration?: number;
//   itemsToDeliver?: {
//     itemName: string;
//     itemPrice?: number;
//     isPaid?: boolean;
//     amountDue?: number;
//   };
// };

import { useEffect, useState } from "react";

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

export const getDistance = (origin: string, destination: string | number[]) => {
  const originCoord = getCoord(origin);
  let destinationCoord;
  if (typeof destination === "string") {
    destinationCoord = getCoord(destination);
    console.log("origin", originCoord.latitude, originCoord.longitude);
    console.log(
      "destination",
      destinationCoord.latitude,
      destinationCoord.longitude
    );
  } else {
    destinationCoord = { longitude: destination[0], latitude: destination[1] };
    console.log(
      "destination",
      destinationCoord.latitude,
      destinationCoord.longitude
    );
  }
  console.log(
    "origin lon",
    originCoord.longitude,
    Math.pow(originCoord.longitude, 2),
    "origin lat",
    originCoord.latitude,
    Math.pow(originCoord.latitude, 2)
  );
  console.log(
    "destination lon",
    destinationCoord.longitude,
    Math.pow(destinationCoord.longitude, 2),
    "destination lat",
    destinationCoord.latitude,
    Math.pow(destinationCoord.latitude, 2)
  );
  const longitudeSquare =
    Math.pow(originCoord.longitude, 2) -
    Math.pow(destinationCoord.longitude, 2);
  console.log("longitude square", longitudeSquare);
  const latitudeSquare =
    Math.pow(originCoord.latitude, 2) - Math.pow(destinationCoord.latitude, 2);
  console.log("latitude square", latitudeSquare);

  const rawDistance = Math.pow(
    Math.abs(
      Math.pow(originCoord.longitude, 2) -
        Math.pow(destinationCoord.longitude, 2) +
        (Math.pow(originCoord.latitude, 2) -
          Math.pow(destinationCoord.latitude, 2))
    ),
    0.5
  );
  const distance = Math.ceil(rawDistance * 10);
  console.log("raw distance", rawDistance);
  console.log("real distance", distance);

  return distance;
};

export const UseLocalStorage = <T>(intialValue: T | (() => T)) => {
  // if (typeof window !== "undefined") return []
  console.log("running local storage", intialValue);
  const [value, setValue] = useState<T>(() => {
    const jsonValue =
      typeof window !== "undefined"
        ? localStorage.getItem("UserDelivery")
        : null;
    console.log("running local storage jsonValue", jsonValue);
    if (jsonValue === null) {
      if (typeof intialValue === "function") {
        return (intialValue as () => T)();
      } else {
        return intialValue;
      }
    } else {
      return JSON.parse(jsonValue);
    }
  });

  useEffect(() => {
    // if (Array.isArray(value) && value.length < 1) return;
    if (typeof window === "undefined") return;
    localStorage.setItem("UserDelivery", JSON.stringify(value));
  }, [value]);
  console.log("running local value is", value);
  return [value, setValue] as [T, typeof setValue];
  // }
};

export const useCurrency = (value: number) => {
  const currency = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return currency;
};
