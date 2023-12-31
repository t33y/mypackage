"use client";
import mapboxgl, { Map } from "mapbox-gl";
import { trpcClient } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { UseLocalStorage, getDistance } from "@/lib/utils";
import UserDeliveries from "@/components/UserDeliveries";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLEMAP_API_KEY as string;
export type UserDelivery = {
  originAddress: string;
  destinationAddress: string;
  id: string;
};

export default function Home() {
  const [userDeliveries, setUserDeliveries] = UseLocalStorage<UserDelivery[]>(
    []
  );
  const [originLatLon, setOriginLatLon] = useState("");
  const [originAddress, setOriginAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [destinationLat, setDestinationLat] = useState<number>();
  const [destinationLon, setDestinationLon] = useState<number>();
  const [isLoading, setIsLoading] = useState(false);
  const originRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);

  const userDeliveryIds = useMemo(() => {
    return userDeliveries?.map((delivery) => {
      console.log("user deliveries in ids", userDeliveries);
      return delivery?.id;
    });
  }, [userDeliveries]);

  const router = useRouter();
  // const form = useForm<Delivery>({
  //   defaultValues: {
  //     destination: " ",
  //     dispatcher: originLocation,
  //   },
  // });

  const { mutate: createDelivery } = trpcClient.createDelivery.useMutation();
  const { mutate: deleteDelivery } = trpcClient.deleteDelivery.useMutation();

  const handleDeleteDelivery = (delivery: UserDelivery) => {
    setUserDeliveries((prev) => {
      return prev.filter((d) => {
        // if (!d) return;
        return d.id !== delivery.id;
      });
    });
    deleteDelivery({ id: delivery.id });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    if (!destinationRef.current || !originRef.current || !originLatLon) return;
    const destinationAddress = destinationRef.current.value;
    const originAddress = originRef.current.value;
    const originLat = Number(originLatLon.split(",")[0]);
    const originLon = Number(originLatLon.split(",")[1]);

    const routeRequestUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${originLon},${originLat};${destinationLon},${destinationLat}?steps=true&geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_API_KEY}`;
    const resJson = await fetch(routeRequestUrl);
    const response = await resJson.json();
    const distance = response.routes[0].distance;
    const duration = response.routes[0].duration;
    const route = response.routes[0].geometry.coordinates;
    const data = {
      destinationAddress,
      originAddress,
      originLat,
      originLon,
      destinationLat,
      destinationLon,
      duration,
      distance,
      route,
    };

    createDelivery(data, {
      onSuccess: (e) => {
        console.log("Deliveries Created", e);
        // return redirect(`/delivery/${e.insertedId}`);
        setUserDeliveries((prev) => {
          const id = e.insertedId;
          return [...prev, { destinationAddress, originAddress, id }];
        });
        router.push(`http://localhost:3000/delivery/${e.insertedId}`);
        setIsLoading(false);
      },
    });
  };

  const handleOriginButtonClick = () => {
    let ref;
    if (!originRef.current) return;
    if (originRef.current.value === ref) return;
    ref = originRef.current.value;

    setOriginAddress(ref);
  };

  const handleDestinationButtonClick = () => {
    let ref;
    if (!destinationRef.current) return;
    if (destinationRef.current.value === ref) return;
    ref = destinationRef.current.value;
    setDestinationAddress(ref);
  };

  // Get user location and initiate autocomplete
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setOriginLatLon(`${pos.coords.latitude},${pos.coords.longitude}`);
      });
    } else {
      console.log(
        "Geolocation is NOT supported by this browser :( make sure your GPS is turned on"
      );
    }

    const options = {
      componentRestrictions: { country: "ng" },
      fields: ["address_components", "geometry", "icon", "name"],
      strictBounds: false,
    };
    const destinationInput = document.getElementById(
      "destination"
    ) as HTMLInputElement;
    const originInput = document.getElementById("origin") as HTMLInputElement;
    if (!window.google) return;
    new window.google.maps.places.Autocomplete(destinationInput, options);

    new window.google.maps.places.Autocomplete(originInput, options);
  }, []);

  // Get destination address from Longitude and Latitude
  useEffect(() => {
    if (!destinationAddress) return;
    let cache;
    if (!cache) {
      const geocoder = new window.google.maps.Geocoder();
      cache = geocoder;
    }

    cache
      .geocode({ address: destinationAddress })
      .then((response) => {
        if (response.results[0]) {
          console.log("response", response);
          setDestinationLat(response.results[0].geometry.location.lat());
          setDestinationLon(response.results[0].geometry.location.lng());
          // const marker = new google.maps.Marker({
          //   position: latlng,
          //   map: map,
          // });

          // infowindow.setContent(response.results[0].formatted_address);
          // infowindow.open(map, marker);
        } else {
          window.console.log("No results found");
        }
      })
      .catch((e) => window.console.log("Geocoder failed due to: " + e));
  }, [destinationAddress]);

  //Get origin address from Longitude and Latitude
  useEffect(() => {
    if (!originAddress) return;

    const geocoder = new window.google.maps.Geocoder();

    console.log("origin address", originAddress);
    geocoder
      .geocode({ address: originAddress })
      .then((response) => {
        if (response.results[0]) {
          console.log("origin ", response);
          const lat = response.results[0].geometry.location.lat();
          console.log("google lat", lat);
          const lon = response.results[0].geometry.location.lng();
          console.log("google lon", lon);
          setOriginLatLon(`${lat},${lon}`);
          console.log("lat and lon origin", originLatLon);
        } else {
          window.console.log("No results found");
        }
      })
      .catch((e) => {
        window.console.log("Geocoder failed due to: " + e);
        window.console.log("origin address geocode: ", originAddress);
      });
  }, [originAddress]);

  //Create map and insert origin and destination(if available) markers from their respective Longitude and Latitude
  useEffect(() => {
    if (!originLatLon) return;
    console.log("map origin lnlat", originLatLon);
    const lat = Number(originLatLon.split(",")[0]);
    const lon = Number(originLatLon.split(",")[1]);
    console.log("lat", lat, "lon", lon);
    let lateralDistance;
    if (destinationLon && destinationLat) {
      lateralDistance = getDistance(originLatLon, [
        destinationLon,
        destinationLat,
      ]);
      console.log("lateral distance", lateralDistance);
    }
    let map;
    if (!map) {
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY as string;
      const mapBox = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v11",
        // bounds: [
        //   [
        //     destinationLon ?? 0 > lon
        //       ? lon - 0.03
        //       : (destinationLon ?? lon) - 0.03,
        //     destinationLat ?? 0 > lat
        //       ? lat - 0.01
        //       : (destinationLat ?? lat) - 0.01,
        //   ],
        //   [
        //     destinationLon ?? 0 < lon
        //       ? lon + 0.03
        //       : (destinationLon ?? lon) + 0.03,
        //     destinationLat ?? 0 < lat
        //       ? lat + 0.01
        //       : (destinationLat ?? lat) + 0.01,
        //   ],
        // ],

        center: [
          destinationLon ? (lon + destinationLon) / 2 : lon,
          destinationLat ? (lat + destinationLat) / 2 : lat,
        ],
        zoom: lateralDistance
          ? lateralDistance >= 14
            ? Math.floor((1 / lateralDistance) * 150)
            : 11
          : 17,
      });
      map = mapBox;
    }

    new mapboxgl.Marker({
      // classList: "text-blue"  ,
      className:
        "after:absolute after:whitespace-nowrap after:bg-gray-500/70 after:text-white after:content-['Pick_up_location'] after:px-[4px] after:py-1 after:rounded-[3px] after:-left-[100%]  ",
      // element: dispatchMarkerRef.current,
    })
      .setLngLat([lon, lat])
      .addTo(map);

    if (destinationLat && destinationLon) {
      console.log("the if log", destinationLat, destinationLon);
      new mapboxgl.Marker({
        className:
          "after:absolute after:whitespace-nowrap after:bg-gray-500/70 after:text-white after:content-['Destination'] after:px-[4px] after:py-1 after:rounded-[3px] after:-left-[100%]  ",
      })
        .setLngLat([destinationLon, destinationLat])
        .addTo(map);
      // if (originLatLon) {
      //   map.setMaxBounds([
      //     [destinationLon, destinationLat + 0.01],
      //     [lon, lat + 0.01],
      //   ]);
      // }
    }
  }, [originLatLon, originRef, destinationLat, destinationLon]);

  useEffect(() => {
    if (!originLatLon) return;

    const lat = Number(originLatLon.split(",")[0]);
    const lon = Number(originLatLon.split(",")[1]);

    let cache;
    if (!cache) {
      const geocoder = new window.google.maps.Geocoder();
      cache = geocoder;
    }

    cache
      .geocode({ location: { lat, lng: lon } })
      .then((response) => {
        if (response.results[0]) {
          console.log("response", response);
          if (!originRef.current) return;
          let ref = originRef.current;
          ref.value = response.results[0].formatted_address;
          // setOriginAddress(response.results[0].formatted_address);
        } else {
          window.console.log("No results found");
        }
      })
      .catch((e) => window.console.log("Geocoder failed due to: " + e));
  }, [originLatLon]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className=" w-[650px] h-[500px]  ">
        <div id="map" className="w-[600px] h-[460px]"></div>
      </div>
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none"></div>
      </div>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]"></div>
      <form onSubmit={(e) => handleSubmit(e)} className="flex flex-col gap-5">
        <div className="gap-2 flex">
          <label htmlFor="destination">Add Destination</label>
          <input className="text-black" id="destination" ref={destinationRef} />
          <button
            type="button"
            onClick={handleDestinationButtonClick}
            // disabled={
            //   destinationRef.current
            //     ? destinationRef.current.value === destinationAddress
            //     : false
            // }
          >
            Update
          </button>
        </div>
        <div className="gap-2 flex">
          <label htmlFor="origin">Pick up </label>
          <input
            ref={originRef}
            className="text-black"
            // onChange={(e) => {
            //   setOriginAddress(e.target.value);
            // }}
            id="origin"
            type="text"
            // value={originAddress}
          />
          <button
            type="button"
            // disabled={originRef?.current?.value === originAddress}
            onClick={handleOriginButtonClick}
          >
            Update
          </button>
        </div>

        <div className="gap-2 flex">
          <label htmlFor="dispatcherName">Dispatcher Name </label>
          <input
            className="text-black"
            required
            // onChange={(e) => {
            //   setOriginAddress(e.target.value);
            // }}
            id="dispatcherName"
            type="text"
            // value={originAddress}
          />
        </div>
        <div className="gap-2 flex">
          <label htmlFor="dispatcherNumber">Dispatcher Mobile Number </label>
          <input
            className="text-black"
            required
            // onChange={(e) => {
            //   setOriginAddress(e.target.value);
            // }}
            id="dispatcherNumber"
            type="tel"
            // value={originAddress}
          />
        </div>
        <div className="gap-2 flex">
          <label htmlFor="dispatcherEmail">Dispatcher Email </label>
          <input
            className="text-black"
            // onChange={(e) => {
            //   setOriginAddress(e.target.value);
            // }}
            id="dispatcherEmail"
            type="email"
            // value={originAddress}
          />
          <span>Optional</span>
        </div>

        <button
          disabled={isLoading}
          type="submit"
          className="border flex justify-center rounded-md"
        >
          {isLoading ? (
            <div className="w-5 h-5 rounded-full animate-spin border-t-2 border-white"></div>
          ) : (
            "Create a delivery"
          )}
        </button>
      </form>
      {/* <button onClick={()=>console.log(createDelivery(data))} className="border rounded-md">
          Create a delivery
        </button> */}

      {userDeliveryIds?.length ? (
        <UserDeliveries
          handleDeleteDelivery={handleDeleteDelivery}
          setUserDeliveries={setUserDeliveries}
          userDeliveries={userDeliveries}
          userDeliveryIds={userDeliveryIds}
        />
      ) : null}
    </main>
  );
}
