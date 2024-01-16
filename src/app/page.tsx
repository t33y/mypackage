"use client";
import mapboxgl, { Map } from "mapbox-gl";
import { trpcClient } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import UserDeliveries from "@/components/UserDeliveries";
import { useSession } from "next-auth/react";
import { deliveriesSchema } from "@/lib/schemas";
import LoadingDelivery from "@/components/LoadingDelivery";

export type UserDelivery = {
  pickupAddress: string;
  destinationAddress: string;
  id: string;
};

export default function Home() {
  const session = useSession();
  const { data } = trpcClient.getUserDeliveries.useQuery({
    userId: session.data?.user.id,
  });

  const userDeliveries = data ? deliveriesSchema.parse(data) : [];
  const { mutate: createDelivery } = trpcClient.createDelivery.useMutation();
  const { mutate: deleteDelivery } = trpcClient.deleteDelivery.useMutation();

  const [pickupLatLon, setPickupLatLon] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [destinationLat, setDestinationLat] = useState<number>();
  const [destinationLon, setDestinationLon] = useState<number>();
  const [isLoading, setIsLoading] = useState(false);
  const pickupRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const handleDeleteDelivery = (deliveryId: string) => {
    deleteDelivery({ id: deliveryId });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    console.log("form data", formData.get("dispatcherName"));
    if (!destinationRef.current || !pickupRef.current || !pickupLatLon) return;
    const destinationAddress = destinationRef.current.value;
    const pickupAddress = pickupRef.current.value;
    const pickupLat = Number(pickupLatLon.split(",")[0]);
    const pickupLon = Number(pickupLatLon.split(",")[1]);

    const routeRequestUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupLon},${pickupLat};${destinationLon},${destinationLat}?steps=true&geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_API_KEY}`;
    const resJson = await fetch(routeRequestUrl);
    const response = await resJson.json();
    const distance = response.routes[0].distance;
    const duration = response.routes[0].duration;
    const route = response.routes[0].geometry.coordinates;

    const data = {
      destinationAddress,
      pickupAddress,
      pickupLat,
      pickupLon,
      destinationLat,
      destinationLon,
      duration,
      distance,
      route,
      dispatcherName: formData.get("dispatcherName") as string | undefined,
      dispatcherPhone: formData.get("dispatcherPhone") as string,
    };

    createDelivery(data, {
      onSuccess: (e) => {
        setTimeout(() => {
          router.push(`http://localhost:3000/delivery/${e.insertedId}`);
          setIsLoading(false);
        }, 2000);
      },
      onError: (error) => {
        setIsLoading(false);
        alert("Something went wrong");
      },
    });
  };

  // Get user location from brower geolocation api
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPickupLatLon(`${pos.coords.latitude},${pos.coords.longitude}`);
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
    const pickupInput = document.getElementById("pickup") as HTMLInputElement;
    if (!window) return;
    const autoCompleteDestination = new google.maps.places.Autocomplete(
      destinationInput,
      options
    );
    autoCompleteDestination.addListener("place_changed", () => {
      let ref;
      if (!destinationRef.current) return;
      if (destinationRef.current.value === ref) return;
      ref = destinationRef.current.value;
      setDestinationAddress(ref);
    });
    const autoCompletePickup = new google.maps.places.Autocomplete(
      pickupInput,
      options
    );
    autoCompletePickup.addListener("place_changed", () => {
      let ref;
      if (!pickupRef.current) return;
      if (pickupRef.current.value === ref) return;
      ref = pickupRef.current.value;

      setPickupAddress(ref);
    });
  }, []);

  // Get destination Longitude and Latitude from address
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
        } else {
          window.console.log("No results found");
        }
      })
      .catch((e) => window.console.log("Geocoder failed due to: " + e));
  }, [destinationAddress]);

  //Get pick up Longitude and Latitude from address
  useEffect(() => {
    if (!pickupAddress) return;

    const geocoder = new window.google.maps.Geocoder();

    geocoder
      .geocode({ address: pickupAddress })
      .then((response) => {
        if (response.results[0]) {
          const lat = response.results[0].geometry.location.lat();

          const lon = response.results[0].geometry.location.lng();

          setPickupLatLon(`${lat},${lon}`);
        } else {
          window.console.log("No results found");
        }
      })
      .catch((e) => {
        window.console.log("Geocoder failed due to: " + e);
        window.console.log("pick up address geocode: ", pickupAddress);
      });
  }, [pickupAddress]);

  //Create map and insert pick up and destination(if available) markers from their respective Longitude and Latitude
  useEffect(() => {
    if (!pickupLatLon) return;

    const lat = Number(pickupLatLon.split(",")[0]);
    const lon = Number(pickupLatLon.split(",")[1]);

    let map;
    if (!map) {
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY as string;
      const mapBox = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v11",

        center: [lon, lat],

        zoom: 17,
      });
      map = mapBox;
    }

    new mapboxgl.Marker({
      className:
        "after:absolute after:whitespace-nowrap after:bg-gray-500/70 after:text-white after:content-['Pick_up_location'] after:px-[4px] after:py-1 after:rounded-[3px] after:-left-[100%]  ",
    } as mapboxgl.MarkerOptions)
      .setLngLat([lon, lat])
      .addTo(map);

    if (destinationLat && destinationLon) {
      console.log("the if log", destinationLat, destinationLon);
      new mapboxgl.Marker({
        className:
          "after:absolute after:whitespace-nowrap after:bg-gray-500/70 after:text-white after:content-['Destination'] after:px-[4px] after:py-1 after:rounded-[3px] after:-left-[100%]  ",
      } as mapboxgl.MarkerOptions)
        .setLngLat([destinationLon, destinationLat])
        .addTo(map);
      map.fitBounds(
        [
          { lng: destinationLon, lat: destinationLat },
          { lng: lon, lat: lat },
        ],
        { padding: 100 }
      );
    }
  }, [pickupLatLon, pickupRef, destinationLat, destinationLon]);

  // get pick up address from longitude and latitude
  useEffect(() => {
    if (!pickupLatLon) return;

    const lat = Number(pickupLatLon.split(",")[0]);
    const lon = Number(pickupLatLon.split(",")[1]);

    let cache;
    if (!cache) {
      const geocoder = new window.google.maps.Geocoder();
      cache = geocoder;
    }

    cache
      .geocode({ location: { lat, lng: lon } })
      .then((response) => {
        if (response.results[0]) {
          if (!pickupRef.current) return;
          let ref = pickupRef.current;
          ref.value = response.results[0].formatted_address;
        } else {
          window.console.log("No results found");
        }
      })
      .catch((e) => window.console.log("Geocoder failed due to: " + e));
  }, [pickupLatLon]);

  return (
    <>
      {isLoading ? (
        <LoadingDelivery loader={"Creating Delivery"} />
      ) : (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
          <h1 className="p-5">{session.data?.user?.email}</h1>

          <div className=" w-[650px] h-[500px]  ">
            <div id="map" className="w-[600px] h-[460px]"></div>
          </div>
          <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
            <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none"></div>
          </div>

          <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]"></div>
          <form
            onSubmit={(e) => handleSubmit(e)}
            className="flex flex-col gap-5"
          >
            <div className="gap-2 flex">
              <label htmlFor="destination">Add Destination</label>
              <input
                className="text-black"
                id="destination"
                name="destination"
                ref={destinationRef}
              />
              {/* <button
            type="button"
            onClick={handleDestinationButtonClick}
            // disabled={
              //   destinationRef.current
              //     ? destinationRef.current.value === destinationAddress
              //     : false
              // }
              >
              Update
            </button> */}
            </div>
            <div className="gap-2 flex">
              <label htmlFor="pickup">Pick up </label>
              <input
                ref={pickupRef}
                className="text-black"
                // onChange={(e) => {
                //   setOriginAddress(e.target.value);
                // }}
                id="pickup"
                name="pickup"
                type="text"
                // value={originAddress}
              />
              {/* <button
            type="button"
            // disabled={originRef?.current?.value === originAddress}
            onClick={handleOriginButtonClick}
            >
            Update
          </button> */}
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
                name="dispatcherName"
                type="text"
                // value={originAddress}
              />
            </div>
            <div className="gap-2 flex">
              <label htmlFor="dispatcherPhone">Dispatcher Mobile Number </label>
              <input
                className="text-black"
                required
                // onChange={(e) => {
                //   setOriginAddress(e.target.value);
                // }}
                id="dispatcherPhone"
                name="dispatcherPhone"
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
                name="dispatcherEmail"
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

          {userDeliveries ? (
            <UserDeliveries
              handleDeleteDelivery={handleDeleteDelivery}
              isActive={true}
              userDeliveries={userDeliveries}
            />
          ) : null}
        </main>
      )}
    </>
  );
}
