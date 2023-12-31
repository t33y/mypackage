"use client";
import MapComponent from "@/components/MapComponent";
import { trpcClient } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Props = {
  params: {
    tracker: string;
  };
};

const API_KEY = "djjdhnsdhkdjsd";

export default function DispatcherTrack({ params: { tracker } }: Props) {
  const [isDispatcher, setIsDispatcher] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dispatcherLocation, setDispatcherLocation] = useState<number[]>([]);
  const dispatcherCodeRef = useRef<HTMLInputElement | null>(null);

  const router = useRouter();

  const { data } = trpcClient.trackDelivery.useQuery(tracker);
  const { data: isCorrectCode } = trpcClient.confirmDispatcherCode.useQuery({
    code: dispatcherCodeRef?.current?.value,
    trackingId: tracker,
  });

  const { mutate: endDelivery } = trpcClient.endDelivery.useMutation();
  const { mutate } = trpcClient.updateDispatcherLocation.useMutation();

  const confirmDispatcherCode = () => {
    setIsLoading(true);
    if (isCorrectCode === undefined) return;
    if (!dispatcherCodeRef.current) {
      setIsLoading(false);
      alert("Please Enter Dispatcher Code");
      return;
    }

    console.log("data tracking ", isCorrectCode);
    if (isCorrectCode) {
      setIsDispatcher(true);
      setIsLoading(false);
    } else {
      alert("Dispatcher code not correct");
      setIsLoading(false);
      return;
    }
  };

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

  const handleEndDeliveryClick = () => {
    setIsLoading(true);
    if (!data) return;
    endDelivery({ trackingId: tracker });
    router.push(`http://localhost:3000`);
    setIsLoading(false);
  };
  useEffect(() => {
    if (!navigator.geolocation)
      alert(
        "Geolocation is NOT supported by this browser :( make sure your GPS is turned on"
      );

    const updateLocation = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition((pos) => {
        mutate({
          trackingId: tracker,
          dispatcherCurrentLocation: [
            pos.coords.longitude,
            pos.coords.latitude,
          ],
        });

        setDispatcherLocation([pos.coords.longitude, pos.coords.latitude]);
      });
    }, 10000);

    return () => window.clearInterval(updateLocation);
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {isDispatcher ? (
        <div>
          <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
            <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none"></div>
          </div>

          <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]"></div>
          {data && (
            <MapComponent
              originLat={data.originLat}
              originLon={data.originLon}
              route={data.route}
              routeName={`Navigate to ${data.destinationAddress}`}
              destinationLat={data.destinationLat}
              destinationLon={data.destinationLon}
              dispatcherCurrentLocation={dispatcherLocation}
            />
          )}
          {/* {JSON.stringify(data)} */}

          <div className="gap-2 flex">
            <label htmlFor="destination">Destination</label>
            <input
              className="text-black text-center"
              id="destination"
              value={data?.destinationAddress}
              readOnly
            />
          </div>
          <div className="gap-2 flex">
            <label htmlFor="dispatcher">Pick up </label>
            <input
              className="text-black text-center"
              id="dispatcher"
              value={data?.originAddress}
              readOnly
            />
          </div>
          <div className=" justify-between border w-1/2 flex">
            <label htmlFor="dispatcher">Start time </label>
            <input
              className="text-black text-center w-1/2"
              id="dispatcher"
              value={start}
              readOnly
            />
          </div>
          <div className=" justify-between border w-1/2  flex">
            <label htmlFor="dispatcher">Arrival time </label>
            <input
              className="text-black text-center w-1/2"
              id="dispatcher"
              readOnly
              value={end}
            />
          </div>
          <div className="gap-2 flex">
            <label htmlFor="duration">Duration </label>
            <input
              className="text-black text-center w-80"
              id="duration"
              value={`${duration.toFixed(2)} hrs`}
              readOnly
            />
          </div>
          <div className="gap-2 flex">
            <label htmlFor="dispatcher">Distance </label>
            <input
              className="text-black text-center w-80"
              id="dispatcher"
              value={`${(data?.distance / 1000).toFixed(2)}Km`}
              readOnly
            />
          </div>
          <div className="gap-2 flex">
            <label htmlFor="dispatcher">Estimated time to left </label>
            <input
              className="text-black w-80"
              id="dispatcher"
              readOnly
              value={ETA}
            />
          </div>

          <div className="mb-32 grid text-center gap-4 lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
            <button
              onClick={handleEndDeliveryClick}
              className="border p-2 flex justify-center my-2 rounded-md"
            >
              {isLoading ? (
                <div className=" w-5 h-5 rounded-full border-t-2 border-white animate-spin"></div>
              ) : (
                "End delivery"
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 place-items-center">
          Confirm dispatcher code:
          <input className="text-black " ref={dispatcherCodeRef} type="text" />
          <button
            disabled={isLoading}
            className="border p-2 flex justify-center m-2 rounded-md"
            onClick={confirmDispatcherCode}
          >
            {isLoading ? (
              <div className="h-5 w-5 border-t-2 rounded-full animate-spin border-white"></div>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      )}
    </main>
  );
}
