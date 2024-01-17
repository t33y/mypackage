"use client";
import LoadingDelivery from "@/components/LoadingDelivery";
import MapComponent from "@/components/MapComponent";
import { trpcClient } from "@/trpc/client";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Props = {
  params: {
    trackingid: string;
  };
};

export default function DispatcherTrack({ params: { trackingid } }: Props) {
  const session = useSession();
  if (session.status === "unauthenticated") {
    redirect("/signup");
  }
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStart, setIsLoadingStart] = useState(false);
  const [dispatcherLocationInterval, setDispatcherLocationInterval] =
    useState(0);
  console.log(trackingid);

  const [dispatcherLocation, setDispatcherLocation] = useState<number[]>([]);

  const router = useRouter();

  const { data, refetch } = trpcClient.trackDelivery.useQuery(trackingid);

  const { mutate: endDelivery } = trpcClient.endDelivery.useMutation();
  const { mutate: startDelivery } = trpcClient.startDelivery.useMutation();
  const { mutate } = trpcClient.updateDispatcherLocation.useMutation();

  const arrival = data?.arrivalTime * 1000;

  const start = new Intl.DateTimeFormat("en-GB", {
    timeStyle: "medium",
    hour12: true,
  }).format(data?.startTime);

  const end = arrival
    ? new Intl.DateTimeFormat("en-GB", {
        timeStyle: "medium",
        hour12: true,
      }).format(arrival)
    : "";

  const handleStartDeliveryClick = async () => {
    setIsLoadingStart(true);
    if (!data) return;
    if (dispatcherLocation.length < 1)
      return alert(
        "Geolocation is NOT supported by this browser :( make sure your GPS is turned on"
      );

    let updateLocation = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition((pos) => {
        mutate({
          phone: data?.dispatcherPhone,
          dispatcherCurrentLocation: [
            pos.coords.longitude,
            pos.coords.latitude,
          ],
        });

        setDispatcherLocation([pos.coords.longitude, pos.coords.latitude]);
      });
    }, 10000);
    setDispatcherLocationInterval(updateLocation);

    const routeRequestUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${dispatcherLocation[0]},${dispatcherLocation[1]};${data.pickupLon},${data.pickupLat}?steps=true&geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_API_KEY}`;
    const resJson = await fetch(routeRequestUrl);
    const response = await resJson.json();
    const distanceToPickup = response.routes[0].distance;
    const durationToPickup = response.routes[0].duration;
    const routeToPickup = response.routes[0].geometry.coordinates;
    startDelivery(
      {
        trackingId: trackingid,
        routeToPickup,
        durationToPickup,
        distanceToPickup,
        dispatcherCurrentLocation: dispatcherLocation,
      },
      {
        onSuccess: () => {
          refetch();
          setTimeout(() => {
            setIsLoadingStart(false);
          }, 1500);
        },
        onError: (e) => {
          setIsLoadingStart(false);
          console.log(e);
        },
      }
    );

    setIsLoadingStart(false);
  };

  const handleEndDeliveryClick = () => {
    setIsLoading(true);
    if (!data) return;
    endDelivery({ trackingId: trackingid });
    router.push(`/`);
    setIsLoading(false);
  };
  useEffect(() => {
    if (!navigator.geolocation)
      alert(
        "Geolocation is NOT supported by this browser :( make sure your GPS is turned on"
      );
    navigator.geolocation.getCurrentPosition((pos) => {
      mutate({
        phone: data?.dispatcherPhone,
        dispatcherCurrentLocation: [pos.coords.longitude, pos.coords.latitude],
      });

      setDispatcherLocation([pos.coords.longitude, pos.coords.latitude]);
    });

    return () => window.clearInterval(dispatcherLocationInterval);
  }, []);

  const duration = data?.duration / 3600;
  const remainderTime = data?.arrivalTime * 1000 - Date.now();

  const remainderHr = Math.floor(remainderTime / 3600000);
  const remainderMin = Math.floor((remainderTime % 3600000) / 60000);
  const remainderSec = Math.round((remainderTime % 60000) / 1000);

  const ETA = `${remainderHr}hr:${remainderMin}min:${remainderSec}sec`;

  {
    console.log("dispatcher DOM", dispatcherLocation);
  }

  if (isLoadingStart) {
    return <LoadingDelivery loader="Starting delivery" />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {/* {isDispatcher ? ( */}
      <div>
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
          <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none"></div>
        </div>

        <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]"></div>
        {data && (
          <MapComponent
            deliveries={[
              {
                pickupLat: data.pickupLat,
                pickupLon: data.pickupLon,
                route: data.route,
                routeName: `Navigate to ${data.destinationAddress}`,
                destinationLat: data.destinationLat,
                destinationLon: data.destinationLon,
              },
            ]}
            dispatcher={{
              vehicle: data.vehicle,
              dispatcherCurrentLocation: dispatcherLocation,
            }}
          />
        )}

        <div className="gap-2 flex">
          <div>Destination: </div>
          <span className=" text-center">{data?.destinationAddress} </span>
        </div>
        <div className="gap-2 flex">
          <div>Pick up: </div>
          <span className=" text-center"> {data?.pickupAddress}</span>
        </div>
        <div className=" justify-between border-b w-1/2 flex">
          <div>Start time: </div>
          <span className="text-center ">{start}</span>
        </div>
        <div className=" justify-between border-b w-1/2  flex">
          <div>Arrival time: </div>
          <span className=" text-center">{end}</span>
        </div>
        <div className="gap-2 flex">
          <div>Duration: </div>
          <span className="text-black text-center w-80">{`${duration.toFixed(
            2
          )} hrs`}</span>
        </div>
        <div className="gap-2 flex">
          <div>Distance: </div>
          <span className="text-center w-80">{`${(
            data?.distance / 1000
          ).toFixed(2)}Km`}</span>
        </div>
        <div className="gap-2 flex">
          <div>Estimated time of arrival: </div>
          <span>{ETA}</span>
        </div>

        <div className="mb-32 grid mt-6 text-center gap-4 lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
          <button
            disabled={data?.isEnded}
            onClick={handleEndDeliveryClick}
            className="border p-2 flex justify-center my-2 rounded-md"
          >
            {isLoading ? (
              <div className=" w-5 h-5 rounded-full border-t-2 border-white animate-spin"></div>
            ) : (
              "End delivery"
            )}
          </button>
          <button
            disabled={data?.isStarted || data?.isEnded}
            onClick={handleStartDeliveryClick}
            className="border p-2 flex justify-center my-2 rounded-md"
          >
            {isLoading ? (
              <div className=" w-5 h-5 rounded-full border-t-2 border-white animate-spin"></div>
            ) : (
              "Start delivery"
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
