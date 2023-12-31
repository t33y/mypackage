"use client";
import MapComponent from "@/components/MapComponent";
import { trpcClient } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  params: {
    tracker: string;
  };
};

const API_KEY = "djjdhnsdhkdjsd";

export default function Track({ params: { tracker } }: Props) {
  const [isViewer, setIsViewer] = useState(false);
  // const [isLoading, setIsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data } = trpcClient.trackDelivery.useQuery(tracker);
  // const { mutate: cancelDelivery } = trpcClient.cancelDelivery.useMutation();
  const { mutate: endDelivery } = trpcClient.endDelivery.useMutation();

  const handleDispatcherClick = () => {
    if (!data) return;
    router.push(
      `http://localhost:3000/track/${tracker}/${data.dispatcherCode}`
    );
  };
  // const handleCancelDeliveryClick = () => {
  //   setIsLoading(true);
  //   if (!data) return;
  //   cancelDelivery({ trackingId: tracker });
  //   router.push(`http://localhost:3000/delivery/${data._id}`);
  // };
  const handleEndDeliveryClick = () => {
    setIsLoading(true);
    if (!data) return;
    endDelivery({ trackingId: tracker });
    router.push(`http://localhost:3000`);
    setIsLoading(false);
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
  console.log("the data", data);
  const duration = data?.duration / 3600;
  const remainderTime = data?.arrivalTime * 1000 - Date.now();

  const remainderHr = Math.floor(remainderTime / 3600000);
  const remainderMin = Math.floor((remainderTime % 3600000) / 60000);
  const remainderSec = Math.round((remainderTime % 60000) / 1000);

  // const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  // const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  // const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

  const ETA = `${remainderHr}hr:${remainderMin}min:${remainderSec}sec`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {isViewer ? (
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
              dispatcherCurrentLocation={data.dispatcherCurrentLocation}
            />
          )}
          {/* {JSON.stringify(data)} */}

          <div className="gap-2 flex">
            <label htmlFor="destination">Destination</label>
            <input
              className="text-black"
              readOnly
              id="destination"
              value={data?.destinationAddress}
            />
          </div>
          <div className="gap-2 flex">
            <label htmlFor="dispatcher">Pick up </label>
            <input
              className="text-black"
              readOnly
              id="dispatcher"
              value={data?.originAddress}
              // {...form.register("dispatcher")}
            />
          </div>
          <div className=" justify-between border w-1/2 flex">
            <label htmlFor="dispatcher">Start time </label>
            <input
              className="text-black w-1/2"
              readOnly
              id="dispatcher"
              value={start}

              // {...form.register("dispatcher")}
            />
          </div>
          <div className=" justify-between border w-1/2  flex">
            <label htmlFor="dispatcher">Arrival time </label>
            <input
              className="text-black w-1/2"
              id="dispatcher"
              readOnly
              value={end}
            />
          </div>
          <div className="gap-2 flex">
            <label htmlFor="duration">Duration </label>
            <input
              className="text-black"
              readOnly
              id="duration"
              value={`${duration.toFixed(2)} hrs`}
            />
          </div>
          <div className="gap-2 flex">
            <label htmlFor="dispatcher">Distance </label>
            <input
              className="text-black"
              readOnly
              id="dispatcher"
              value={`${(data?.distance / 1000).toFixed(2)}Km`}
            />
          </div>
          <div className="gap-2 flex">
            <label htmlFor="dispatcher">Estimated time to left </label>
            <input
              className="text-black"
              id="dispatcher"
              readOnly
              value={ETA}
            />
          </div>

          <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
            {/* <button
              className="border p-2 flex justify-center my-2 rounded-md"
              onClick={handleCancelDeliveryClick}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className=" w-5 h-5 rounded-full border-t-2 border-white animate-spin"></div>
              ) : (
                "Cancel delivery"
              )}
            </button> */}

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
        <div>
          <button
            className="border p-2 flex justify-center my-2 rounded-md"
            onClick={handleDispatcherClick}
          >
            Dispatcher
          </button>
          <button
            className="border p-2 flex justify-center my-2 rounded-md"
            onClick={() => setIsViewer(true)}
          >
            Receiver
          </button>
        </div>
      )}
    </main>
  );
}
