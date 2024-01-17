"use client";
import MapComponent from "@/components/MapComponent";
import { trpcClient } from "@/trpc/client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Props = {
  params: {
    dispatcherid: string;
  };
};

export default function DispatcherTrack({ params: { dispatcherid } }: Props) {
  const session = useSession();
  if (session.status === "unauthenticated") {
    redirect(`/signup?disptacher=${dispatcherid}`);
  }
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [selectDelivery, setSelectDelivery] = useState("");
  const [dispatcherLocation, setDispatcherLocation] = useState<number[]>([]);

  const router = useRouter();

  const { data } = trpcClient.getDispatcherDeliveries.useQuery({
    dispatcherId: dispatcherid,
  });

  const mapDeliveryData = data?.map((delivery) => {
    if (selectDelivery === delivery._id) {
      return {
        id: delivery._id,
        selected: true,
        pickupLat: delivery.pickupLat,
        pickupLon: delivery.pickupLon,
        route: delivery.route,
        routeName: `Navigate to ${delivery.destinationAddress}`,
        destinationLat: delivery.destinationLat,
        destinationLon: delivery.destinationLon,
      };
    } else {
      return {
        id: delivery._id,
        selected: false,
        pickupLat: delivery.pickupLat,
        pickupLon: delivery.pickupLon,
        route: delivery.route,
        routeName: `Navigate to ${delivery.destinationAddress}`,
        destinationLat: delivery.destinationLat,
        destinationLon: delivery.destinationLon,
      };
    }
  });
  const activeDeliveries = data?.filter((delivery) => {
    return delivery.isActivated === true;
  });
  const inactiveDeliveries = data?.filter((delivery) => {
    return delivery.isActivated === false;
  });

  const { mutate: endDelivery } = trpcClient.endDelivery.useMutation();
  const { mutate } = trpcClient.updateDispatcherLocation.useMutation();

  const handleRejectDeliveryClick = (delivery: any) => {
    setIsLoading(true);
    if (!data) return;
    endDelivery({ trackingId: delivery.trackingId, rejected: true });

    setIsLoading(false);
  };
  useEffect(() => {
    if (!navigator.geolocation)
      alert(
        "Geolocation is NOT supported by this browser :( make sure your GPS is turned on"
      );

    let updateLocation = 0;
    if (!isOnline) {
      if (updateLocation) {
        window.clearInterval(updateLocation);
      }
      return;
    }

    updateLocation = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition((pos) => {
        mutate({
          phone: dispatcherid,
          dispatcherCurrentLocation: [
            pos.coords.longitude,
            pos.coords.latitude,
          ],
        });

        setDispatcherLocation([pos.coords.longitude, pos.coords.latitude]);
      });
    }, 10000);

    return () => window.clearInterval(updateLocation);
  }, [isOnline]);

  return (
    <main className="flex min-h-screen gap-4 flex-col items-center justify-between p-24">
      {/* {isDispatcher ? ( */}
      <button
        className={`w-[30%] border p-4 rounded-md ${
          isOnline ? "animate-pulse bg-green-500" : ""
        } `}
        onClick={() => setIsOnline((prev) => !prev)}
      >
        {isOnline ? "You are online. Click to go Offline" : "Go online"}
      </button>
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none"></div>
      </div>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]"></div>
      {data && data.length > 0 ? (
        <div className="flex flex-col items-center">
          {data && mapDeliveryData && (
            <MapComponent
              deliveries={mapDeliveryData}
              dispatcher={{
                vehicle: "Bike",
                dispatcherCurrentLocation: dispatcherLocation,
              }}
            />
          )}

          {activeDeliveries && activeDeliveries.length > 0 && (
            <div>
              <div className="text-2xl font-bold text-left">
                Pending Deliveries
              </div>
              <div className="mb-32 grid gap-2 mt-6 text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
                {activeDeliveries.map((delivery) => {
                  return (
                    <div
                      onClick={() => {
                        console.log("selected delivery", selectDelivery);
                        setSelectDelivery(delivery._id);
                      }}
                      className={`border cursor-pointer p-3 rounded-md ${
                        selectDelivery === delivery._id ? "bg-blue-400" : ""
                      }${delivery.isStarted ? "bg-green-400" : ""}`}
                      key={delivery._id}
                    >
                      <div>
                        {delivery.s}
                        From <div>{delivery.pickupAddress}</div> To{" "}
                        <div>{delivery.destinationAddress}</div>
                      </div>
                      {delivery.deliveryCost && (
                        <div>Delivery fee: N{delivery.deliveryCost}</div>
                      )}
                      <button
                        onClick={() => {
                          handleRejectDeliveryClick(delivery);
                        }}
                        disabled={delivery.rejected}
                        className="border p-2 flex justify-center my-2 rounded-md"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-t-2 rounded-full animate-spin"></div>
                        ) : (
                          "Reject delivery"
                        )}
                      </button>
                      <Link
                        href={`${process.env.NEXT_PUBLIC_SERVER_URL}/dispatcher/${delivery.dispatcherPhone}/${delivery.trackingId}`}
                        className="border p-2 flex justify-center my-2 rounded-md"
                      >
                        Accept delivery
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {inactiveDeliveries && inactiveDeliveries.length > 0 && (
            <div>
              <div className="text-2xl font-bold text-left">
                Past Activities
              </div>
              <div className="mb-32 grid mt-6 text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
                {inactiveDeliveries?.map((delivery) => {
                  return (
                    <div
                      onClick={() => setSelectDelivery(delivery._id)}
                      className={`border p-3 rounded-md ${
                        selectDelivery === delivery._id ? "shadow-lg" : ""
                      }`}
                      key={delivery._id}
                    >
                      <div>
                        From <div>{delivery.pickupAddress}</div> To{" "}
                        <div>{delivery.destinationAddress}</div>
                      </div>
                      {delivery.deliveryCost && (
                        <div>Delivery fee: N{delivery.deliveryCost}</div>
                      )}
                      <button
                        onClick={() => {
                          handleRejectDeliveryClick(delivery);
                        }}
                        disabled={delivery.rejected}
                        className="border p-2 flex justify-center my-2 rounded-md"
                      >
                        {delivery.rejected ? (
                          "Rejected delivery"
                        ) : (
                          <div>
                            <div>
                              Delivery started:{" "}
                              {new Intl.DateTimeFormat("en-GB", {
                                timeStyle: "medium",
                                dateStyle: "medium",
                                hour12: true,
                              }).format(delivery.startedAt)}
                            </div>
                            <div>
                              Delivery ended:{" "}
                              {new Intl.DateTimeFormat("en-GB", {
                                timeStyle: "medium",
                                dateStyle: "medium",
                                hour12: true,
                              }).format(delivery.endedAt)}
                            </div>
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="font-bold text-xl">You have no deliveries</div>
      )}
    </main>
  );
}

// ) :
// (
//  <div className="flex gap-2 place-items-center">
//    Confirm dispatcher code:
//    <input className="text-black " ref={dispatcherCodeRef} type="text" />
//    <button
//      disabled={isLoading}
//      className="border p-2 flex justify-center m-2 rounded-md"
//      onClick={confirmDispatcherCode}
//    >
//      {isLoading ? (
//        <div className="h-5 w-5 border-t-2 rounded-full animate-spin border-white"></div>
//      ) : (
//        "Submit"
//      )}
//    </button>
//  </div>
// )}
