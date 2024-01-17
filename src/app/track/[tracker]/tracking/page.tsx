"use client";
import DispatcherData from "@/components/DispatcherData";
import MapComponent from "@/components/MapComponent";
import { trpcClient } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  params: {
    tracker: string;
  };
};

const API_KEY = "djjdhnsdhkdjsd";

export default function Track({ params: { tracker } }: Props) {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState(0);
  const [ETA, setETA] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data, refetch } = trpcClient.trackDelivery.useQuery(tracker);

  const { mutate: endDelivery } = trpcClient.endDelivery.useMutation();

  // const handleDispatcherClick = () => {
  //   if (!data) return;
  //   router.push(
  //     `http://localhost:3000/track/${tracker}/${data.dispatcherCode}`
  //   );
  // };
  // const handleCancelDeliveryClick = () => {
  //   setIsLoading(true);
  //   if (!data) return;
  //   cancelDelivery({ trackingId: tracker });
  //   router.push(`http://localhost:3000/delivery/${data._id}`);
  // };
  const handleEndDeliveryClick = () => {
    setIsLoading(true);
    if (!data) return;
    endDelivery(
      { trackingId: tracker, receiverCode: code },
      {
        onSuccess: (data) => {
          if (data === "Please enter Correct Receiver code")
            return alert("Please Enter Receiver Code");
          refetch();
          setCode(0);
          setIsLoading(false);
          setShowCodeInput(false);
        },
      }
    );

    setIsLoading(false);
  };

  const arrival = data?.startedAt + data?.duration * 1000;

  const start = new Intl.DateTimeFormat("en-GB", {
    timeStyle: "medium",
    hour12: true,
  }).format(data?.startedAt);

  useEffect(() => {
    const showETAInterval = setInterval(() => {
      const remainderTime = data?.arrivalTime * 1000 - Date.now();
      if (!remainderTime) {
        setETA("Your Delivery is Here");
        clearInterval(showETAInterval);
        return;
      }

      const remainderHr = Math.floor(remainderTime / 3600000);
      const remainderMin = Math.floor((remainderTime % 3600000) / 60000);
      const remainderSec = Math.round((remainderTime % 60000) / 1000);

      setETA(`${remainderHr}hr:${remainderMin}min:${remainderSec}sec`);
    }, 1000);
  }, [data]);
  // const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  // const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  // const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

  console.log("arrival", arrival);
  console.log("started", data?.startedAt);
  console.log("start", start);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
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
              dispatcherCurrentLocation: data.dispatcherLocation,
            }}
          />
        )}
        <DispatcherData dispatcherPhone={data?.dispatcherPhone} />

        {data?.isEnded ? (
          <div>The Delivery has Ended</div>
        ) : data?.isStarted ? (
          <div className="text-green-600">
            Dispatcher has Started the delivery
          </div>
        ) : (
          <div className="text-red-600">
            Dispatcher has NOT Started the delivery
          </div>
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
          <span className="text-center ">
            {data?.startedAt ? (
              start
            ) : (
              <div className="text-gray-400 italic">
                Delivery not started yet
              </div>
            )}
          </span>
        </div>
        <div className=" justify-between border-b w-1/2  flex">
          <div>Arrival time: </div>
          {!!arrival && (
            <span className=" text-center">
              {data?.startedAt
                ? new Intl.DateTimeFormat("en-GB", {
                    timeStyle: "medium",
                    hour12: true,
                  }).format(arrival)
                : "Delivery not started yet"}
            </span>
          )}
        </div>
        <div className="gap-2 flex">
          <div>Duration: </div>
          {data?.duration && (
            <span className="text-center w-80">
              {`${(data?.duration / 3600).toFixed(2)} hrs`}
            </span>
          )}
        </div>
        <div className="gap-2 flex">
          <div>Distance: </div>
          {data?.distance && (
            <span className="text-center w-80">{`${(
              data?.distance / 1000
            ).toFixed(2)}Km`}</span>
          )}
        </div>
        <div className="gap-2 flex">
          <div>Estimated time to delivery: </div>
          <span>
            {data?.startedAt ? (
              ETA
            ) : (
              <div className="text-gray-400 italic">
                Delivery not started yet
              </div>
            )}
          </span>
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

          <div>
            <button
              disabled={data?.isEnded}
              onClick={() => setShowCodeInput((prev) => !prev)}
              className="border p-2 flex justify-center my-2 rounded-md"
            >
              End delivery
            </button>
            {showCodeInput && (
              <div>
                <input
                  value={code}
                  onChange={(e) => setCode(Number(e.target.value))}
                  type="text"
                />{" "}
                <button
                  onClick={handleEndDeliveryClick}
                  className="border p-2 flex justify-center my-2 rounded-md"
                >
                  {" "}
                  {isLoading ? (
                    <div className=" w-5 h-5 rounded-full border-t-2 border-white animate-spin"></div>
                  ) : (
                    "End delivery"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// ) : (
//   <div>
//     <button
//       className="border p-2 flex justify-center my-2 rounded-md"
//       onClick={handleDispatcherClick}
//     >
//       Dispatcher
//     </button>
//     <button
//       className="border p-2 flex justify-center my-2 rounded-md"
//       onClick={() => setIsViewer(true)}
//     >
//       Receiver
//     </button>
//   </div>
// )}
