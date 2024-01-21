import mapboxgl from "mapbox-gl";
import React, { useEffect, useState } from "react";

type DeliveryOnMap = {
  id?: string;
  pickupLon: number;
  pickupLat: number;
  selected?: boolean;
  destinationLon?: number;
  destinationLat?: number;
  route?: number[][];
  routeName?: string;
};

type DispatcherOnMap = {
  dispatcherCurrentLocation?: number[];
  vehicle?: string;
};

type Prop = {
  deliveries: DeliveryOnMap[];
  dispatcher: DispatcherOnMap;
};

const MapComponent = ({ deliveries, dispatcher }: Prop) => {
  const [mapBox, setMapBox] = useState<mapboxgl.Map | null>(null);
  const [dispatcherPositionMarker, setDispatcherPositionMarker] =
    useState<mapboxgl.Marker | null>(null);
  const [selectedDelivery, setSelectedDelivery] =
    useState<DeliveryOnMap | null>(null);

  useEffect(() => {
    if (!deliveries) return;

    // let lateralDistance;
    // if (destinationLon && destinationLat) {
    // const pickupLatLon = `${pickupLat},${pickupLon}`;
    //   lateralDistance = getDistance(pickupLatLon, [
    //     destinationLon,
    //     destinationLat,
    //   ]);
    // }
    console.log("deliveries", deliveries);
    if (!deliveries.length) return;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY as string;
    const map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [deliveries[0].pickupLon, deliveries[0].pickupLat],
      zoom: 17,
    });
    setMapBox(map);
    // ({
    //   url: "https://www.flaticon.com/free-icons/motorcycle",
    // });
    deliveries.forEach((delivery) => {
      if (delivery.selected) {
        setSelectedDelivery(delivery);
      }
      new mapboxgl.Marker({
        // classList: "text-blue"  ,
        className:
          "after:absolute after:whitespace-nowrap after:bg-gray-500/70 after:text-white after:content-['Pick_up'] after:px-[4px] after:py-1 after:rounded-[3px] after:-left-[100%]  ",
      } as mapboxgl.MarkerOptions)
        .setLngLat([delivery.pickupLon, delivery.pickupLat])
        .addTo(map);

      if (delivery.destinationLat && delivery.destinationLon) {
        new mapboxgl.Marker({
          className: `after:absolute after:whitespace-nowrap after:bg-gray-500/70 after:text-white after:content-['Destination'] after:px-[4px] after:py-1 after:rounded-[3px] after:-left-[100%]  `,
        } as mapboxgl.MarkerOptions)
          .setLngLat([delivery.destinationLon, delivery.destinationLat])
          .addTo(map);
        map.fitBounds(
          [
            [delivery.destinationLon, delivery.destinationLat],
            [delivery.pickupLon, delivery.pickupLat],
          ],
          { padding: 100 }
        );
      }
    });
    // new mapboxgl.Marker({
    //   // classList: "text-blue"  ,
    //   className:
    //     "after:absolute after:whitespace-nowrap after:bg-gray-500/70 after:text-white after:content-['Pick_up_location'] after:px-[4px] after:py-1 after:rounded-[3px] after:-left-[100%]  ",
    // } as mapboxgl.MarkerOptions)
    //   .setLngLat([pickupLon, pickupLat])
    //   .addTo(map);
    // if (destinationLat && destinationLon) {
    //   new mapboxgl.Marker({
    //     className:
    //       "after:absolute after:whitespace-nowrap after:bg-gray-500/70 after:text-white after:content-['Destination'] after:px-[4px] after:py-1 after:rounded-[3px] after:-left-[100%]  ",
    //   } as mapboxgl.MarkerOptions)
    //     .setLngLat([destinationLon, destinationLat])
    //     .addTo(map);
    //   map.fitBounds(
    //     [
    //       [destinationLon, destinationLat],
    //       [pickupLon, pickupLat],
    //     ],
    //     { padding: 100 }
    //   );

    // if (!route || !routeName) return;

    map.on("load", () => {
      deliveries.forEach((delivery) => {
        if (delivery.route && delivery.routeName) {
          console.log("is it selected?", delivery.id, delivery.selected);
          let pathColor = delivery.selected ? "#54d062" : "#888";
          let pathOrder = delivery.selected ? 102 : 1;
          map.addSource(delivery.routeName, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {
                name: delivery.routeName,
                color: pathColor,
                order: pathOrder,
              },
              geometry: {
                type: "LineString",
                coordinates: delivery.route,
              },
            },
          });

          map.addLayer({
            id: delivery.routeName,
            type: "line",
            source: delivery.routeName,

            layout: {
              "line-join": "round",
              "line-cap": "round",
              "line-sort-key": 0,
            },
            paint: {
              "line-color": ["get", "color"],
              "line-color-transition": { duration: 1000 },
              "line-width": 6,
            },
          });
          // map.addLayer({
          //   id: delivery.routeName,
          //   type: "line",
          //   source: delivery.routeName,
          //   layout: {
          //     "line-join": "round",
          //     "line-cap": "round",
          //   },
          //   paint: {
          //     "line-color": "#888",
          //     "line-width": 6,
          //   },
          // });
        }
      });
      // if (vehicleRef.current) {
      //   map.addImage("bikeI", vehicleRef.current);
      // }

      // map.addLayer({
      //   id: routeName,
      //   type: "line",
      //   source: routeName,
      //   layout: {
      //     "line-join": "round",
      //     "line-cap": "round",
      //   },
      //   paint: {
      //     "line-color": "#888",
      //     "line-width": 6,
      //   },
      // });

      // if (!dispatcherCurrentLocation) return;
      // map.addSource("dispatcher", {
      //   type: "geojson",
      //   data: {
      //     type: "Feature",
      //     properties: {
      //       name: "dispatcherFeature",
      //     },

      //     geometry: {
      //       type: "Point",
      //       coordinates: dispatcherCurrentLocation,
      //     },
      //   },
      // });
      // map.addLayer({
      //   id: "dispatcherLayer",
      //   source: "dispatcher",
      //   type: "symbol",
      //   layout: {
      //     // "icon-size": 5,
      //     "icon-image": "bikeI",
      //     "icon-allow-overlap": true,
      //   },
      // });
    });
  }, []);

  useEffect(() => {
    console.log("dispatcher location", dispatcher.dispatcherCurrentLocation);
    if (!mapBox || !dispatcher.dispatcherCurrentLocation?.length) return;
    console.log("dispatcher location", dispatcher.dispatcherCurrentLocation);
    // mapBox.on("load", () => {
    if (dispatcher.dispatcherCurrentLocation?.length) {
      if (dispatcherPositionMarker) {
        dispatcherPositionMarker?.setLngLat([
          dispatcher.dispatcherCurrentLocation[0],
          dispatcher.dispatcherCurrentLocation[1],
        ]);
        return;
      }
      const dispatcherIcon = document.createElement("img");
      dispatcherIcon.src = `/${dispatcher.vehicle}.png`;
      dispatcherIcon.width = 24;
      dispatcherIcon.height = 24;
      dispatcherIcon.className =
        "after:absolute after:whitespace-nowrap after:bg-gray-500/70 after:text-white after:content-['Dispatcher'] after:px-[4px] after:py-1 after:rounded-[3px] after:-left-[100%]  ";
      const dispatcherMarker = new mapboxgl.Marker({
        element: dispatcherIcon,
      } as mapboxgl.MarkerOptions)
        .setLngLat([
          dispatcher.dispatcherCurrentLocation[0],
          dispatcher.dispatcherCurrentLocation[1],
        ])
        .addTo(mapBox);
      setDispatcherPositionMarker(dispatcherMarker);
      // }
      //   const dispatcherSource = mapBox.getSource(
      //     "dispatcher"
      //   ) as mapboxgl.GeoJSONSource;
      //   dispatcherSource?.setData({
      //     type: "Feature",

      //     properties: {
      //       name: "dispatcherFeature",
      //     },

      //     geometry: {
      //       type: "Point",
      //       coordinates: dispatcherCurrentLocation,
      //     },
      //   });
      // }
    }
  }, [mapBox, dispatcher]);

  useEffect(() => {
    console.log("the deliveries", deliveries);
    if (!deliveries) return;
    console.log("the deliveries", deliveries);
    const currSelection = deliveries.filter((delivery) => {
      return delivery.selected;
    });
    if (currSelection.length < 1) return;
    if (!currSelection[0].routeName) return;
    if (currSelection[0].routeName === selectedDelivery?.routeName) return;
    console.log("the deliveries", deliveries);

    mapBox?.removeLayer(currSelection[0].routeName);
    mapBox?.addLayer({
      id: currSelection[0].routeName,
      type: "line",
      source: currSelection[0].routeName,

      layout: {
        "line-join": "round",
        "line-cap": "round",
        "line-sort-key": 1,
      },
      paint: {
        "line-color": "#54d062",
        "line-color-transition": { duration: 1000 },
        "line-width": 6,
      },
    });

    if (!selectedDelivery?.routeName) {
      setSelectedDelivery(currSelection[0]);
      return;
    }
    mapBox?.setPaintProperty(selectedDelivery.routeName, "line-color", "#888");
    mapBox?.setLayoutProperty(selectedDelivery.routeName, "line-sort-key", 0);
    setSelectedDelivery(currSelection[0]);
  }, [deliveries]);

  return (
    <div className=" w-[650px] h-[500px] ">
      {/* <img
        ref={vehicleRef}
        className="w-6 bg-white h-6"
        id="picBike"
        src="/motorbike.png"
      /> */}
      <div id="map" className="w-[600px] h-[460px]"></div>
    </div>
  );
};

export default MapComponent;
