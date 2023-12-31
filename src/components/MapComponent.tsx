import { getDistance } from "@/lib/utils";
import mapboxgl from "mapbox-gl";
import React, { useEffect, useRef, useState } from "react";

type Props = {
  originLon: number;
  originLat: number;
  destinationLon?: number;
  destinationLat?: number;
  route?: number[][];
  routeName?: string;
  dispatcherCurrentLocation?: number[];
};

const MapComponent = ({
  originLon,
  originLat,
  destinationLon,
  destinationLat,
  routeName,
  route,
  dispatcherCurrentLocation,
}: Props) => {
  const [mapBox, setMapBox] = useState<mapboxgl.Map | null>(null);
  const vehicleRef = useRef<HTMLImageElement>(null);
  console.log("rendering Map", dispatcherCurrentLocation);
  useEffect(() => {
    let lateralDistance;
    if (destinationLon && destinationLat) {
      const originLatLon = `${originLat},${originLon}`;
      lateralDistance = getDistance(originLatLon, [
        destinationLon,
        destinationLat,
      ]);
    }

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY as string;
    const map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [
        destinationLon ? (originLon + destinationLon) / 2 : originLon,
        destinationLat ? (originLat + destinationLat) / 2 : originLat,
      ],
      zoom: lateralDistance
        ? lateralDistance >= 14
          ? Math.floor((1 / lateralDistance) * 150)
          : 11
        : 17,
    });
    setMapBox(map);
    // ({
    //   url: "https://www.flaticon.com/free-icons/motorcycle",
    // });
    new mapboxgl.Marker({
      // classList: "text-blue"  ,
      className:
        "after:absolute after:whitespace-nowrap after:bg-gray-500/70 after:text-white after:content-['Pick_up_location'] after:px-[4px] after:py-1 after:rounded-[3px] after:-left-[100%]  ",
    } as mapboxgl.MarkerOptions)
      .setLngLat([originLon, originLat])
      .addTo(map);

    if (destinationLat && destinationLon) {
      console.log("the if log", destinationLat, destinationLon);
      new mapboxgl.Marker({
        className:
          "after:absolute after:whitespace-nowrap after:bg-gray-500/70 after:text-white after:content-['Destination'] after:px-[4px] after:py-1 after:rounded-[3px] after:-left-[100%]  ",
      } as mapboxgl.MarkerOptions)
        .setLngLat([destinationLon, destinationLat])
        .addTo(map);

      if (!route || !routeName) return;
      map.on("load", () => {
        if (vehicleRef.current) {
          map.addImage("bikeI", vehicleRef.current);
        }
        map.addSource(routeName, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {
              name: routeName,
            },
            geometry: {
              type: "LineString",
              coordinates: route,
            },
          },
        });
        map.addLayer({
          id: routeName,
          type: "line",
          source: routeName,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#888",
            "line-width": 6,
          },
        });

        if (!dispatcherCurrentLocation) return;
        map.addSource("dispatcher", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {
              name: "dispatcherFeature",
            },

            geometry: {
              type: "Point",
              coordinates: dispatcherCurrentLocation,
            },
          },
        });
        map.addLayer({
          id: "dispatcherLayer",
          source: "dispatcher",
          type: "symbol",
          layout: {
            // "icon-size": 5,
            "icon-image": "bikeI",
            "icon-allow-overlap": true,
          },
        });
      });
    }
  }, [originLon, originLat, destinationLat, destinationLon]);

  useEffect(() => {
    if (!mapBox || !dispatcherCurrentLocation?.length) return;
    // mapBox.on("load", () => {
    if (dispatcherCurrentLocation.length) {
      const dispatcherSource = mapBox.getSource(
        "dispatcher"
      ) as mapboxgl.GeoJSONSource;
      dispatcherSource?.setData({
        type: "Feature",

        properties: {
          name: "dispatcherFeature",
        },

        geometry: {
          type: "Point",
          coordinates: dispatcherCurrentLocation,
        },
      });
    }
  }, [mapBox, dispatcherCurrentLocation]);

  return (
    <div className=" w-[650px] h-[500px]  ">
      <img
        ref={vehicleRef}
        className="w-6 bg-white h-6"
        id="picBike"
        src="/motorbike.png"
      />
      <div id="map" className="w-[600px] h-[460px]"></div>
    </div>
  );
};

export default MapComponent;
